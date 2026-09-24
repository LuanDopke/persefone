"""
GBIF Species API integration service with local database caching.
Constitution Principle IV: Local-first caching for external API queries.
"""

import requests
import logging
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import quote

from django.core.cache import cache
from django.utils.html import strip_tags

from catalog.models import Species

logger = logging.getLogger(__name__)

GBIF_API_BASE = 'https://api.gbif.org/v1'
GBIF_PLANTAE_KEY = 6
TAXONOMY_RANKS = {'ORDER', 'FAMILY', 'GENUS', 'SPECIES'}
PORTUGUESE_LANGUAGE_CODES = {'por', 'pt', 'pt-br', 'pt-pt'}
ENGLISH_LANGUAGE_CODES = {'eng', 'en', 'en-us', 'en-gb'}
DESCRIPTION_TYPES = {'description', 'general description', 'morphology', 'diagnosis'}
DESCRIPTION_NOISE = ('selected examined material', 'specimens examined', 'taxonomic notes:', 'references:')
PROFILE_TERMS = {
    'lifeForm': {
        'árvore', 'arbusto', 'subarbusto', 'erva', 'herbácea', 'trepadeira', 'liana',
        'epífita', 'aquática', 'rupícola', 'tree', 'shrub', 'subshrub', 'herb',
        'vine', 'climber', 'epiphyte', 'aquatic',
    },
    'habitat': {
        'terrestre', 'terrícola', 'aquático', 'aquática', 'rupícola', 'epífita',
        'terrestrial', 'aquatic', 'freshwater', 'marine', 'forest', 'grassland',
    },
}
WIKIPEDIA_LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/'
WIKIPEDIA_USER_AGENT = 'Persefone/1.0 (https://github.com/LuanDopke/persefone)'


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
            (entry.get('vernacularName') for entry in vernacular_names if _description_language(entry.get('language')) == 'pt' and entry.get('vernacularName')),
            None,
        ) or next(
            (entry.get('vernacularName') for entry in vernacular_names if _description_language(entry.get('language')) == 'en' and entry.get('vernacularName')),
            '',
        )
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


def _description_language(value):
    language = (value or '').strip().lower()
    if language in PORTUGUESE_LANGUAGE_CODES:
        return 'pt'
    if language in ENGLISH_LANGUAGE_CODES:
        return 'en'
    return None


def _select_description(items, taxon_key):
    candidates = []
    for item in items or []:
        language = _description_language(item.get('language'))
        kind = (item.get('type') or '').strip().lower()
        text = _clean_text(item.get('description'))
        if not language or kind not in DESCRIPTION_TYPES or not 30 <= len(text) <= 1500:
            continue
        if any(marker in text.casefold() for marker in DESCRIPTION_NOISE):
            continue
        source_key = item.get('sourceTaxonKey') or taxon_key
        candidates.append({
            'text': text,
            'source': item.get('source') or 'GBIF',
            'source_url': f'https://www.gbif.org/species/{source_key}',
            'language': language,
            'type': kind,
        })
    candidates.sort(key=lambda row: (
        len(row['text']) < 80,
        row['language'] != 'pt',
        row['type'] not in {'description', 'general description'},
        -len(row['text']),
        row['source'].casefold(),
    ))
    return candidates[0] if candidates else None


def _wikipedia_description(scientific_name):
    title = '_'.join(scientific_name.split())
    if not title:
        return None
    for language in ('pt', 'en'):
        url = f'https://{language}.wikipedia.org/api/rest_v1/page/summary/{quote(title, safe="")}'
        try:
            response = requests.get(url, headers={'User-Agent': WIKIPEDIA_USER_AGENT}, timeout=3)
            response.raise_for_status()
            payload = response.json()
        except (requests.RequestException, ValueError) as exc:
            logger.info('Wikipedia summary unavailable for %s (%s): %s', scientific_name, language, exc)
            continue
        page_title = ' '.join((payload.get('titles') or {}).get('normalized', '').split())
        extract = _clean_text(payload.get('extract'))
        if (
            payload.get('type') != 'standard'
            or (payload.get('namespace') or {}).get('id') != 0
            or page_title.casefold() != scientific_name.casefold()
            or not 40 <= len(extract) <= 1500
        ):
            continue
        return {
            'text': extract,
            'source': 'Wikipédia',
            'source_url': f'https://{language}.wikipedia.org/wiki/{quote(title, safe="")}',
            'language': language,
            'license': 'CC BY-SA 4.0',
            'license_url': WIKIPEDIA_LICENSE_URL,
        }
    return None


def _profile_facts(items):
    candidates = []
    for item in items or []:
        values = {}
        value_items = {}
        life_form = item.get('lifeForm')
        official_source = 'flora e funga do brasil' in (item.get('source') or '').casefold()
        if isinstance(life_form, str) and life_form.lstrip().startswith('{'):
            try:
                decoded = json.loads(life_form)
                if isinstance(decoded, dict):
                    for key in ('lifeForm', 'habitat', 'vegetationType'):
                        raw_values = decoded.get(key)
                        entries = raw_values if isinstance(raw_values, list) else [raw_values]
                        accepted = []
                        for value in entries:
                            if not isinstance(value, str):
                                continue
                            text = _clean_text(value)
                            if 0 < len(text) <= 100 and (official_source or text.casefold() in PROFILE_TERMS.get(key, set())):
                                accepted.append(text)
                        if accepted:
                            value_items[key] = list(dict.fromkeys(accepted))
                            values[key] = ', '.join(value_items[key])
            except (TypeError, ValueError):
                pass
        elif isinstance(life_form, str) and _clean_text(life_form).casefold() in PROFILE_TERMS['lifeForm']:
            values['lifeForm'] = _clean_text(life_form)
            value_items['lifeForm'] = [values['lifeForm']]
        habitat = item.get('habitat')
        if isinstance(habitat, str) and _clean_text(habitat).casefold() in PROFILE_TERMS['habitat']:
            values['habitat'] = _clean_text(habitat)
            value_items['habitat'] = [values['habitat']]
        for key in ('extinct', 'hybrid', 'aquatic'):
            if isinstance(item.get(key), bool):
                values[key] = item[key]
        core_count = sum(key in values for key in ('lifeForm', 'habitat', 'vegetationType'))
        if core_count:
            candidates.append((core_count, official_source, len(values), item.get('source') or '', item.get('sourceTaxonKey') or 0, values, value_items))
    candidates.sort(key=lambda row: (-row[0], -row[1], -row[2], row[3].casefold(), row[4]))
    if not candidates:
        return []
    _, _, _, source, source_key, values, value_items = candidates[0]
    return [{
        'values': values,
        'value_items': value_items,
        'source': source,
        'source_url': f'https://www.gbif.org/species/{source_key}' if source_key else '',
    }]


def _vernacular_language_priority(item):
    language = (item.get('language') or '').lower()
    if language in PORTUGUESE_LANGUAGE_CODES:
        return 0
    if language in ENGLISH_LANGUAGE_CODES:
        return 1
    return 2


def _establishment_means_value(value):
    if isinstance(value, dict):
        value = value.get('concept') or next(iter(value.get('lineage') or []), '')
    return value if isinstance(value, str) else ''


def _occurrence_points(items):
    points = []
    seen = set()
    for item in items or []:
        latitude = item.get('decimalLatitude')
        longitude = item.get('decimalLongitude')
        if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
            continue
        fingerprint = (round(latitude, 4), round(longitude, 4))
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        points.append({
            'key': item.get('key'),
            'latitude': latitude,
            'longitude': longitude,
            'country': item.get('country', ''),
            'state_province': item.get('stateProvince', ''),
            'locality': item.get('locality', ''),
            'establishment_means': _establishment_means_value(item.get('establishmentMeans')),
            'basis_of_record': item.get('basisOfRecord', ''),
        })
    return points[:300]


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
    cache_key = f'gbif-taxon-profile:v4:{taxon_key}'
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
        'distributions': (f'species/{taxon_key}/distributions', {'limit': 100}),
        'vernacular': (f'species/{taxon_key}/vernacularNames', {'limit': 50}),
        'iucn': (f'species/{taxon_key}/iucnRedListCategory', None),
        'literature_exact': ('literature/search', {('gbifTaxonKey' if rank == 'SPECIES' else 'gbifHigherTaxonKey'): taxon_key, 'limit': 10}),
        'literature_text': ('literature/search', {'q': scientific_name, 'limit': 10}),
    }
    if rank == 'SPECIES':
        jobs['descriptions'] = (f'species/{taxon_key}/descriptions', {'limit': 100})
        jobs['profiles'] = (f'species/{taxon_key}/speciesProfiles', {'limit': 100})
        jobs['occurrences'] = ('occurrence/search', {'taxon_key': taxon_key, 'limit': 0})
        jobs['occurrence_points'] = ('occurrence/search', {'taxon_key': taxon_key, 'has_coordinate': 'true', 'limit': 300})
        jobs['media'] = ('occurrence/search', {'taxon_key': taxon_key, 'media_type': 'StillImage', 'limit': 30})

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

    description = _select_description(payloads.get('descriptions', {}).get('results', []), taxon_key) if rank == 'SPECIES' else None
    if rank == 'SPECIES' and not description:
        description = _wikipedia_description(scientific_name)

    names = payloads.get('vernacular', {}).get('results', [])
    vernacular_names = []
    for item in sorted(names, key=lambda row: (_vernacular_language_priority(row), (row.get('vernacularName') or '').casefold())):
        if _description_language(item.get('language')) is None:
            continue
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
                'establishment_means': _establishment_means_value(item.get('establishmentMeans')),
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
        'descriptions': [description] if description else [],
        'profiles': _profile_facts(payloads.get('profiles', {}).get('results', [])) if rank == 'SPECIES' else [],
        'vernacular_names': vernacular_names[:12],
        'distributions': distributions[:30],
        'occurrence_points': _occurrence_points(payloads.get('occurrence_points', {}).get('results', [])),
        'occurrence_count': payloads.get('occurrences', {}).get('count'),
        'image_count': payloads.get('media', {}).get('count'),
        'images': images[:30],
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
