"""
GBIF Species API integration service with local database caching.
Constitution Principle IV: Local-first caching for external API queries.
"""

import requests
import logging

from catalog.models import Species

logger = logging.getLogger(__name__)

GBIF_API_BASE = 'https://api.gbif.org/v1'


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
