"""Tests for GBIF service API fetcher and local cache handler."""

import pytest
from unittest.mock import patch, MagicMock
from catalog.models import Species
from catalog.services import search_gbif_species, get_species_by_gbif_key


@pytest.mark.django_db
class TestGBIFService:
    """Tests for GBIF integration service with database caching."""

    def test_cache_hit_returns_existing_species(self):
        """Returns cached species without calling GBIF API."""
        Species.objects.create(
            scientific_name='Monstera deliciosa',
            gbif_key=5371917,
            family='Araceae',
        )
        result = search_gbif_species('Monstera deliciosa')
        assert result is not None
        assert result.scientific_name == 'Monstera deliciosa'

    @patch('catalog.services.requests.get')
    def test_api_call_when_not_cached(self, mock_get):
        """Calls GBIF API and caches result when species not in DB."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            'usageKey': 9999999,
            'scientificName': 'Ficus lyrata',
            'matchType': 'EXACT',
            'kingdom': 'Plantae',
            'phylum': 'Tracheophyta',
            'class': 'Magnoliopsida',
            'order': 'Rosales',
            'family': 'Moraceae',
            'genus': 'Ficus',
        }
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        result = search_gbif_species('Ficus lyrata')

        assert result is not None
        assert result.scientific_name == 'Ficus lyrata'
        assert result.gbif_key == 9999999
        assert result.family == 'Moraceae'
        # Verify it was cached in DB
        assert Species.objects.filter(gbif_key=9999999).exists()

    @patch('catalog.services.requests.get')
    def test_returns_none_on_no_match(self, mock_get):
        """Returns None when GBIF reports no match."""
        mock_response = MagicMock()
        mock_response.json.return_value = {'matchType': 'NONE'}
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        result = search_gbif_species('NonexistentPlant xyz')
        assert result is None

    @patch('catalog.services.requests.get')
    def test_returns_none_on_api_error(self, mock_get):
        """Returns None when GBIF API call fails."""
        import requests
        mock_get.side_effect = requests.RequestException('API timeout')

        result = search_gbif_species('Timeout Plant')
        assert result is None

    def test_cached_lookup_performance(self):
        """Cached lookup should be near-instantaneous."""
        import time
        Species.objects.create(
            scientific_name='Cached Plant',
            gbif_key=11111,
        )
        start = time.time()
        result = search_gbif_species('Cached Plant')
        elapsed_ms = (time.time() - start) * 1000

        assert result is not None
        assert elapsed_ms < 100, f'Cached lookup took {elapsed_ms:.1f}ms, expected <100ms'
