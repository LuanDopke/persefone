"""
GBIF Species API integration service with local database caching.
Constitution Principle IV: Local-first caching for external API queries.
"""

import requests
import logging
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

from django.core.cache import cache
from django.utils.html import strip_tags

from catalog.models import Species

logger = logging.getLogger(__name__)

GBIF_API_BASE = 'https://api.gbif.org/v1'
GBIF_PLANTAE_KEY = 6
TAXONOMY_RANKS = {'ORDER', 'FAMILY', 'GENUS', 'SPECIES'}


class GBIFServiceError(Exception):
    """Raised when GBIF cannot serve a taxonomy browsing request."""


def _clean_text(value, limit=None):
    text = ' '.join(strip_tags(value or '').split())
    if limit and len(text) > limit:
        return f'{text[:limit].rsplit(" ", 1)[0]}…'
    return text


def _gbif_get(path, params=None):
    response = requests.get(f'{GBIF_API_BASE}/{path.lstrip("/")}', params=params, timeout=10)
    response.raise_for_status()
    return response.json()


def browse_gbif_taxa(rank, parent_key=None, limit=24, offset=0, query=''):
    """Return one page of accepted plant taxa for the requested hierarchy level."""
    normalized_rank = rank.upper()
    if normalized_rank not in TAXONOMY_RANKS:
        raise ValueError('Unsupported taxonomy rank.')

    query = ' '.join((query or '').split())
    higher_taxon_key = GBIF_PLANTAE_KEY if normalized_rank == 'ORDER' or query else parent_key
    if higher_taxon_key is None:
        raise ValueError('A parent taxon is required for this rank.')

    limit = min(max(int(limit), 1), 50)
    offset = max(int(offset), 0)
    cache_key = f'gbif-taxonomy:{normalized_rank}:{higher_taxon_key}:{limit}:{offset}:{query.casefold()}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        params = {
            'rank': normalized_rank,
            'highertaxon_key': higher_taxon_key,
            'status': 'ACCEPTED',
            'limit': limit,
            'offset': offset,
        }
        if query:
            params['q'] = query
        payload = _gbif_get('species/search', params=params)
    except (requests.RequestException, ValueError) as exc:
        logger.error('GBIF taxonomy browsing error: %s', exc)
        raise GBIFServiceError('GBIF taxonomy service is unavailable.') from exc

    taxa = []
    for item in payload.get('results', []):
        vernacular_names = item.get('vernacularNames') or []
        preferred_name = next(
            (entry.get('vernacularName') for entry in vernacular_names if entry.get('language') == 'por'),
            None,
        ) or next((entry.get('vernacularName') for entry in vernacular_names if entry.get('vernacularName')), '')
        taxa.append({
            'key': item.get('key'),
            'parent_key': item.get('parentKey'),
            'scientific_name': item.get('canonicalName') or item.get('scientificName', ''),
            'authorship': item.get('authorship', ''),
            'vernacular_name': preferred_name,
            'rank': item.get('rank', normalized_rank).lower(),
            'num_descendants': item.get('numDescendants', 0),
            'order': item.get('order', ''),
            'family': item.get('family', ''),
            'genus': item.get('genus', ''),
            'order_key': item.get('orderKey'),
            'family_key': item.get('familyKey'),
            'genus_key': item.get('genusKey'),
            'species_key': item.get('speciesKey'),
            'habitats': list(dict.fromkeys(item.get('habitats') or [])),
        })

    result = {
        'count': payload.get('count', len(taxa)),
        'offset': payload.get('offset', offset),
        'limit': payload.get('limit', limit),
        'end_of_records': payload.get('endOfRecords', True),
        'results': taxa,
        'source': 'GBIF Backbone Taxonomy',
    }
    cache.set(cache_key, result, 60 * 60)
    return result


def _optional_gbif_request(path, params=None):
    try:
        return _gbif_get(path, params=params), None
    except (requests.RequestException, ValueError) as exc:
        logger.warning('Optional GBIF request failed for %s: %s', path, exc)
        return None, path


def _profile_facts(items):
    facts = []
    seen = set()
    for item in items or []:
        values = {}
        life_form = item.get('lifeForm')
        if isinstance(life_form, str) and life_form.startswith('{'):
            try:
                decoded = json.loads(life_form)
                for key, value in decoded.items():
                    values[key] = ', '.join(value) if isinstance(value, list) else str(value)
            except (TypeError, ValueError):
                values['lifeForm'] = life_form
        elif life_form:
            values['lifeForm'] = life_form
        for key in ('habitat', 'extinct', 'hybrid', 'aquatic'):
            if item.get(key) is not None:
                values[key] = item[key]
        fingerprint = tuple(sorted((key, str(value)) for key, value in values.items()))
        if values and fingerprint not in seen:
            seen.add(fingerprint)
            facts.append({'values': values, 'source': item.get('source', '')})
    return facts[:8]


def _literature_rows(payloads):
    rows = []
    seen = set()
    for payload in payloads:
        for item in (payload or {}).get('results', []):
            identifier = item.get('id') or item.get('identifiers', {}).get('doi') or item.get('title')
            if not identifier or identifier in seen:
                continue
            seen.add(identifier)
            authors = [' '.join(filter(None, (author.get('firstName'), author.get('lastName')))) for author in item.get('authors', [])]
            doi = item.get('identifiers', {}).get('doi')
            websites = item.get('websites') or []
            rows.append({
                'id': identifier,
                'title': item.get('title', ''),
                'authors': authors,
                'year': item.get('year'),
                'source': item.get('source', ''),
                'abstract': _clean_text(item.get('abstract'), 700),
                'doi': doi,
                'url': websites[0] if websites else (f'https://doi.org/{doi}' if doi else ''),
                'open_access': item.get('openAccess'),
                'peer_review': item.get('peerReview'),
                'literature_type': item.get('literatureType', ''),
            })
    return rows[:10]


def get_gbif_taxon_profile(taxon_key):
    """Aggregate species, occurrence and literature metadata for a GBIF taxon."""
    cache_key = f'gbif-taxon-profile:{taxon_key}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        detail = _gbif_get(f'species/{taxon_key}')
    except (requests.RequestException, ValueError) as exc:
        logger.error('GBIF taxon detail error for %s: %s', taxon_key, exc)
        raise GBIFServiceError('GBIF taxon profile is unavailable.') from exc

    scientific_name = detail.get('canonicalName') or detail.get('scientificName', '')
    rank = detail.get('rank', '').upper()
    jobs = {
        'descriptions': (f'species/{taxon_key}/descriptions', {'limit': 10}),
        'profiles': (f'species/{taxon_key}/speciesProfiles', {'limit': 20}),
        'distributions': (f'species/{taxon_key}/distributions', {'limit': 100}),
        'vernacular': (f'species/{taxon_key}/vernacularNames', {'limit': 50}),
        'iucn': (f'species/{taxon_key}/iucnRedListCategory', None),
        'literature_exact': ('literature/search', {('gbifTaxonKey' if rank == 'SPECIES' else 'gbifHigherTaxonKey'): taxon_key, 'limit': 10}),
        'literature_text': ('literature/search', {'q': scientific_name, 'limit': 10}),
    }
    if rank == 'SPECIES':
        jobs['occurrences'] = ('occurrence/search', {'taxon_key': taxon_key, 'limit': 0})
        jobs['media'] = ('occurrence/search', {'taxon_key': taxon_key, 'media_type': 'StillImage', 'limit': 12})

    payloads = {}
    warnings = []
    with ThreadPoolExecutor(max_workers=len(jobs)) as executor:
        futures = {executor.submit(_optional_gbif_request, path, params): name for name, (path, params) in jobs.items()}
        for future in as_completed(futures):
            name = futures[future]
            payload, warning = future.result()
            payloads[name] = payload or {}
            if warning:
                warnings.append(name)

    description_rows = []
    for item in payloads.get('descriptions', {}).get('results', []):
        text = _clean_text(item.get('description'))
        if len(text) >= 30:
            description_rows.append({
                'text': _clean_text(text, 900),
                'source': item.get('source', ''),
                'language': item.get('language', ''),
                'type': item.get('type', ''),
            })
    description_rows.sort(key=lambda row: (row['type'].lower() != 'description', len(row['text'])))

    names = payloads.get('vernacular', {}).get('results', [])
    vernacular_names = []
    for item in sorted(names, key=lambda row: row.get('language') != 'por'):
        name = item.get('vernacularName')
        if name and name.casefold() not in {entry['name'].casefold() for entry in vernacular_names}:
            vernacular_names.append({'name': name, 'language': item.get('language', '')})

    distributions = []
    seen_locations = set()
    for item in payloads.get('distributions', {}).get('results', []):
        locality = item.get('locality') or item.get('country') or item.get('locationId')
        if locality and locality.casefold() not in seen_locations:
            seen_locations.add(locality.casefold())
            distributions.append({
                'locality': locality,
                'establishment_means': item.get('establishmentMeans', ''),
                'threat_status': item.get('threatStatus', ''),
                'source': item.get('source', ''),
            })

    images = []
    seen_images = set()
    for occurrence in payloads.get('media', {}).get('results', []):
        for media in occurrence.get('media', []):
            url = media.get('identifier')
            if media.get('type') == 'StillImage' and url and url not in seen_images:
                seen_images.add(url)
                images.append({
                    'url': url,
                    'references': media.get('references') or occurrence.get('references', ''),
                    'creator': media.get('creator') or media.get('rightsHolder', ''),
                    'publisher': media.get('publisher', ''),
                    'license': media.get('license') or occurrence.get('license', ''),
                    'country': occurrence.get('country', ''),
                    'occurrence_key': occurrence.get('key'),
                })

    result = {
        'taxon': {
            'key': detail.get('key', taxon_key),
            'scientific_name': scientific_name,
            'full_scientific_name': detail.get('scientificName', scientific_name),
            'authorship': detail.get('authorship', ''),
            'rank': rank.lower(),
            'status': detail.get('taxonomicStatus', ''),
            'published_in': detail.get('publishedIn', ''),
            'num_descendants': detail.get('numDescendants', 0),
            'kingdom': detail.get('kingdom', ''),
            'phylum': detail.get('phylum', ''),
            'class_name': detail.get('class', ''),
            'order': detail.get('order', ''),
            'family': detail.get('family', ''),
            'genus': detail.get('genus', ''),
        },
        'descriptions': description_rows[:3],
        'profiles': _profile_facts(payloads.get('profiles', {}).get('results', [])),
        'vernacular_names': vernacular_names[:12],
        'distributions': distributions[:30],
        'occurrence_count': payloads.get('occurrences', {}).get('count'),
        'image_count': payloads.get('media', {}).get('count'),
        'images': images[:12],
        'literature': _literature_rows([payloads.get('literature_exact'), payloads.get('literature_text')]),
        'conservation': {
            'category': payloads.get('iucn', {}).get('category', ''),
            'code': payloads.get('iucn', {}).get('code', ''),
        },
        'warnings': warnings,
        'source': 'GBIF',
    }
    cache.set(cache_key, result, 60 * 60)
    return result


def search_gbif_species(name):
    """
    Search GBIF for a species by name.
    Checks local DB cache first. If not found, queries GBIF API and caches result.
    Returns a Species model instance.
    """
    # Check local cache first
    cached = Species.objects.filter(scientific_name__iexact=name).first()
    if cached:
        logger.info(f'Cache hit for species: {name}')
        return cached

    # Query GBIF API
    try:
        response = requests.get(
            f'{GBIF_API_BASE}/species/match',
            params={'name': name, 'kingdom': 'Plantae'},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        logger.error(f'GBIF API error for "{name}": {exc}')
        return None

    if data.get('matchType') == 'NONE' or not data.get('usageKey'):
        logger.info(f'No GBIF match for: {name}')
        return None

    # Persist to local database cache
    species, created = Species.objects.update_or_create(
        gbif_key=data['usageKey'],
        defaults={
            'scientific_name': data.get('scientificName', name),
            'common_name': data.get('vernacularName', ''),
            'kingdom': data.get('kingdom', 'Plantae'),
            'phylum': data.get('phylum', ''),
            'class_name': data.get('class', ''),
            'order': data.get('order', ''),
            'family': data.get('family', ''),
            'genus': data.get('genus', ''),
        },
    )

    if created:
        logger.info(f'Cached new species from GBIF: {species.scientific_name} (key={species.gbif_key})')
    else:
        logger.info(f'Updated cached species: {species.scientific_name}')

    return species


def get_species_by_gbif_key(gbif_key):
    """Retrieve a species by GBIF key, from cache or API."""
    cached = Species.objects.filter(gbif_key=gbif_key).first()
    if cached:
        return cached

    try:
        response = requests.get(
            f'{GBIF_API_BASE}/species/{gbif_key}',
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        logger.error(f'GBIF API error for key {gbif_key}: {exc}')
        return None

    species, _ = Species.objects.update_or_create(
        gbif_key=gbif_key,
        defaults={
            'scientific_name': data.get('scientificName', ''),
            'common_name': data.get('vernacularName', ''),
            'kingdom': data.get('kingdom', 'Plantae'),
            'phylum': data.get('phylum', ''),
            'class_name': data.get('class', ''),
            'order': data.get('order', ''),
            'family': data.get('family', ''),
            'genus': data.get('genus', ''),
        },
    )
    return species
