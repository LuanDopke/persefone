"""Tests for GBIF service API fetcher and local cache handler."""

import pytest
import requests
from unittest.mock import patch, MagicMock
from catalog.models import Species
from catalog.services import (
    _profile_facts, _select_description, _wikipedia_description,
    browse_gbif_taxa, get_gbif_taxon_profile, search_gbif_species, get_species_by_gbif_key,
)


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

    @patch('catalog.services.requests.get')
    def test_browses_accepted_families_under_an_order(self, mock_get):
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            'count': 1,
            'offset': 0,
            'limit': 24,
            'endOfRecords': True,
            'results': [{
                'key': 2259,
                'parentKey': 376,
                'canonicalName': 'Ricciaceae',
                'rank': 'FAMILY',
                'numDescendants': 357,
                'order': 'Marchantiales',
                'family': 'Ricciaceae',
                'vernacularNames': [
                    {'vernacularName': 'Nom français', 'language': 'fra'},
                    {'vernacularName': 'Liverwort family', 'language': 'eng'},
                ],
            }],
        }
        mock_get.return_value = mock_response

        result = browse_gbif_taxa('family', parent_key=376)

        assert result['results'][0]['scientific_name'] == 'Ricciaceae'
        assert result['results'][0]['vernacular_name'] == 'Liverwort family'
        mock_get.assert_called_once_with(
            'https://api.gbif.org/v1/species/search',
            params={'rank': 'FAMILY', 'highertaxon_key': 376, 'status': 'ACCEPTED', 'limit': 24, 'offset': 0},
            timeout=10,
        )

    @patch('catalog.services._gbif_get')
    def test_builds_species_profile_with_images_and_literature(self, gbif_get):
        def response(path, params=None):
            if path == 'species/7303475':
                return {'key': 7303475, 'canonicalName': 'Begonia maculata', 'rank': 'SPECIES', 'family': 'Begoniaceae', 'genus': 'Begonia'}
            if path.endswith('/descriptions'):
                return {'results': [{'description': '<p>Erva terrestre com folhas assimétricas.</p>', 'type': 'description', 'language': 'por', 'source': 'Flora'}]}
            if path.endswith('/speciesProfiles'):
                return {'results': [{'lifeForm': 'Subarbusto', 'habitat': 'terrestrial', 'source': 'Flora'}]}
            if path.endswith('/vernacularNames'):
                return {'results': [
                    {'vernacularName': 'Spotted begonia', 'language': 'eng'},
                    {'vernacularName': 'Bégonia', 'language': 'fra'},
                    {'vernacularName': 'Begônia pintada', 'language': 'por'},
                ]}
            if path.endswith('/distributions'):
                return {'results': [{'locality': 'Brazil Southeast', 'source': 'WCVP'}]}
            if path == 'occurrence/search' and params.get('media_type'):
                return {'count': 1, 'results': [{'key': 99, 'country': 'Brazil', 'media': [{'type': 'StillImage', 'identifier': 'https://images.example/begonia.jpg', 'license': 'CC BY 4.0', 'creator': 'Ana'}]}]}
            if path == 'occurrence/search' and params.get('has_coordinate'):
                return {'results': [{'key': 100, 'country': 'Brazil', 'decimalLatitude': -15.7, 'decimalLongitude': -47.9, 'establishmentMeans': {'concept': 'NATIVE'}}]}
            if path == 'occurrence/search':
                return {'count': 415, 'results': []}
            if path == 'literature/search' and params.get('q'):
                return {'results': [{'id': 'paper-1', 'title': 'Begonia study', 'year': 2024, 'authors': [{'firstName': 'A.', 'lastName': 'Silva'}], 'websites': ['https://doi.org/example']}]}
            return {'results': []}

        gbif_get.side_effect = response

        result = get_gbif_taxon_profile(7303475)

        assert result['taxon']['scientific_name'] == 'Begonia maculata'
        assert result['occurrence_count'] == 415
        assert result['images'][0]['creator'] == 'Ana'
        assert result['occurrence_points'][0]['establishment_means'] == 'NATIVE'
        assert [item['language'] for item in result['vernacular_names']] == ['por', 'eng']
        assert result['literature'][0]['title'] == 'Begonia study'
        assert result['descriptions'][0]['text'] == 'Erva terrestre com folhas assimétricas.'
        assert result['profiles'][0]['values'] == {'lifeForm': 'Subarbusto', 'habitat': 'terrestrial'}
        assert result['profiles'][0]['value_items'] == {'lifeForm': ['Subarbusto'], 'habitat': ['terrestrial']}

    def test_description_selection_rejects_unrelated_types_and_languages(self):
        result = _select_description([
            {'language': 'eng', 'type': 'distribution', 'description': 'Found throughout Brazil in humid forests and gardens.'},
            {'language': 'spa', 'type': 'description', 'description': 'Arbusto de hojas asimétricas y flores pequeñas.'},
            {'language': 'eng', 'type': 'description', 'description': 'A shrub with spotted leaves and small white flowers.', 'source': 'English flora'},
            {'language': 'por', 'type': 'morphology', 'description': 'Subarbusto com folhas assimétricas e manchas prateadas.', 'source': 'Flora brasileira'},
        ], 7303475)

        assert result['language'] == 'pt'
        assert result['source'] == 'Flora brasileira'
        assert result['text'].startswith('Subarbusto')

    def test_substantive_english_description_beats_short_portuguese_text(self):
        result = _select_description([
            {'language': 'por', 'type': 'description', 'description': 'Planta herbácea com flores brancas.'},
            {'language': 'eng', 'type': 'description', 'description': 'An herbaceous plant with spotted leaves, white flowers, and a branching stem growing in humid forests.'},
        ], 7303475)

        assert result['language'] == 'en'

    def test_profile_uses_one_structured_source_without_mixing_conflicts(self):
        result = _profile_facts([
            {'lifeForm': 'Trepadora', 'source': 'Catálogo de Colombia'},
            {'lifeForm': '{"lifeForm":["Subarbusto"],"habitat":["Terrícola"],"vegetationType":["Floresta Ombrófila, em encostas", "Vegetação Sobre Afloramentos Rochosos"]}',
             'source': 'Flora e Funga do Brasil - Lista Oficial', 'sourceTaxonKey': 114698094},
            {'extinct': False, 'source': 'Other checklist'},
        ])

        assert len(result) == 1
        assert result[0]['values'] == {
            'lifeForm': 'Subarbusto', 'habitat': 'Terrícola',
            'vegetationType': 'Floresta Ombrófila, em encostas, Vegetação Sobre Afloramentos Rochosos',
        }
        assert result[0]['value_items']['vegetationType'] == [
            'Floresta Ombrófila, em encostas', 'Vegetação Sobre Afloramentos Rochosos',
        ]
        assert result[0]['source_url'] == 'https://www.gbif.org/species/114698094'

    @patch('catalog.services.requests.get')
    def test_wikipedia_fallback_requires_exact_species_title(self, mock_get):
        wrong_page = MagicMock()
        wrong_page.json.return_value = {
            'type': 'standard', 'namespace': {'id': 0}, 'titles': {'normalized': 'Begonia'},
            'extract': 'Begonia is a large genus of flowering plants with many species.',
        }
        correct_page = MagicMock()
        correct_page.json.return_value = {
            'type': 'standard', 'namespace': {'id': 0}, 'titles': {'normalized': 'Begonia maculata'},
            'extract': 'Begonia maculata is a flowering plant with spotted leaves native to Brazil.',
        }
        mock_get.side_effect = [wrong_page, correct_page]

        result = _wikipedia_description('Begonia maculata')

        assert result['language'] == 'en'
        assert result['source_url'] == 'https://en.wikipedia.org/wiki/Begonia_maculata'
        assert result['license'] == 'CC BY-SA 4.0'
        assert mock_get.call_count == 2

    @patch('catalog.services.requests.get', side_effect=requests.RequestException('Unavailable'))
    def test_wikipedia_failure_returns_no_description(self, mock_get):
        assert _wikipedia_description('Begonia maculata') is None
        assert mock_get.call_count == 2

    @patch('catalog.services._wikipedia_description')
    @patch('catalog.services._gbif_get')
    def test_higher_taxon_skips_descriptions_and_profiles(self, gbif_get, wikipedia_description):
        gbif_get.side_effect = lambda path, params=None: (
            {'key': 2874710, 'canonicalName': 'Begonia', 'rank': 'GENUS'}
            if path == 'species/2874710' else {'results': []}
        )

        result = get_gbif_taxon_profile(2874710)

        assert result['descriptions'] == []
        assert result['profiles'] == []
        assert not any(path.endswith(('/descriptions', '/speciesProfiles')) for path in (call.args[0] for call in gbif_get.call_args_list))
        wikipedia_description.assert_not_called()

    @patch('catalog.services._wikipedia_description')
    @patch('catalog.services._gbif_get')
    def test_uses_wikipedia_when_gbif_has_no_usable_description(self, gbif_get, wikipedia_description):
        gbif_get.side_effect = lambda path, params=None: (
            {'key': 7303476, 'canonicalName': 'Begonia maculata', 'rank': 'SPECIES'}
            if path == 'species/7303476' else {'results': []}
        )
        wikipedia_description.return_value = {
            'text': 'Begonia maculata is a flowering plant with spotted leaves native to Brazil.',
            'source': 'Wikipédia', 'language': 'en',
        }

        result = get_gbif_taxon_profile(7303476)

        assert result['descriptions'] == [wikipedia_description.return_value]
        wikipedia_description.assert_called_once_with('Begonia maculata')
