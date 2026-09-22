import pytest
from io import BytesIO
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework.test import APIClient

from catalog.models import Observation, Species
from specimens.models import Specimen
from datetime import date
from unittest.mock import patch


@pytest.fixture
def api_client(db):
    user = User.objects.create_user(username='catalog-api-user')
    client = APIClient()
    client.force_authenticate(user=user)
    client.user = user
    return client


def observation_image():
    stream = BytesIO()
    Image.new('RGB', (40, 30), color='green').save(stream, format='PNG')
    return SimpleUploadedFile('observation.png', stream.getvalue(), content_type='image/png')


@pytest.mark.django_db
class TestLocalSpeciesAPI:
    def test_creates_begonia_sp_with_inferred_genus(self, api_client):
        response = api_client.post(reverse('species-local'), {'scientific_name': 'Begonia sp.'}, format='json')

        assert response.status_code == 201
        assert response.data['scientific_name'] == 'Begonia sp.'
        assert response.data['genus'] == 'Begonia'
        assert response.data['created'] is True

    def test_reuses_normalized_existing_species(self, api_client):
        existing = Species.objects.create(scientific_name='Begonia sp.', genus='Begonia')

        response = api_client.post(reverse('species-local'), {'scientific_name': '  BEGONIA   SP.  '}, format='json')

        assert response.status_code == 200
        assert response.data['id'] == existing.id
        assert response.data['created'] is False
        assert Species.objects.count() == 1

    def test_rejects_empty_name(self, api_client):
        response = api_client.post(reverse('species-local'), {'scientific_name': '  '}, format='json')

        assert response.status_code == 400
        assert 'scientific_name' in response.data

    def test_repeated_creation_converges_on_one_row(self, api_client):
        first = api_client.post(reverse('species-local'), {'scientific_name': 'Ficus elastica'}, format='json')
        second = api_client.post(reverse('species-local'), {'scientific_name': 'ficus   ELASTICA'}, format='json')

        assert first.data['id'] == second.data['id']
        assert Species.objects.filter(normalized_name='ficus elastica').count() == 1

    def test_catalog_is_owned_is_scoped_to_authenticated_user(self, api_client):
        species = Species.objects.create(scientific_name='Calathea orbifolia')
        other = User.objects.create_user(username='other-catalog-user')
        Specimen.objects.create(
            owner=other,
            species=species,
            nickname='Alheio',
            acquired_at=date(2024, 1, 1),
        )

        listed = api_client.get(reverse('species-list'))
        owned = api_client.get(reverse('species-list'), {'is_owned': 'true'})

        assert listed.data['results'][0]['is_owned'] is False
        assert owned.data['count'] == 0


@pytest.mark.django_db
class TestTaxonomyBrowseAPI:
    @patch('catalog.views.browse_gbif_taxa')
    def test_browses_the_next_taxonomic_level(self, browse, api_client):
        browse.return_value = {'count': 1, 'results': [{'key': 14, 'scientific_name': 'Araceae'}]}

        response = api_client.get(reverse('taxonomy-browse'), {'rank': 'family', 'parent_key': 1350})

        assert response.status_code == 200
        assert response.data['results'][0]['scientific_name'] == 'Araceae'
        browse.assert_called_once_with('FAMILY', parent_key=1350, limit=24, offset=0, query='')

    def test_requires_parent_for_levels_below_order(self, api_client):
        response = api_client.get(reverse('taxonomy-browse'), {'rank': 'genus'})

        assert response.status_code == 400

    @patch('catalog.views.browse_gbif_taxa')
    def test_allows_global_search_at_any_rank(self, browse, api_client):
        browse.return_value = {'count': 1, 'results': [{'key': 2874710, 'scientific_name': 'Begonia'}]}

        response = api_client.get(reverse('taxonomy-browse'), {'rank': 'genus', 'q': 'Begonia'})

        assert response.status_code == 200
        browse.assert_called_once_with('GENUS', parent_key=None, limit=24, offset=0, query='Begonia')

    @patch('catalog.views.get_gbif_taxon_profile')
    def test_returns_aggregated_taxonomy_profile(self, profile, api_client):
        profile.return_value = {'taxon': {'key': 7303475}, 'images': [], 'literature': []}

        response = api_client.get(reverse('taxonomy-profile', args=[7303475]))

        assert response.status_code == 200
        assert response.data['taxon']['key'] == 7303475


@pytest.mark.django_db
class TestObservationAPI:
    def test_creates_observation_with_photo_and_taxonomic_context(self, api_client, settings, tmp_path):
        settings.MEDIA_ROOT = tmp_path
        observed = Species.objects.create(scientific_name='Begonia maculata', order='Cucurbitales', family='Begoniaceae', genus='Begonia')
        related = Species.objects.create(scientific_name='Begonia rex', order='Cucurbitales', family='Begoniaceae', genus='Begonia')

        response = api_client.post(reverse('observation-list'), {'species': observed.pk, 'image': observation_image()}, format='multipart')

        assert response.status_code == 201
        assert response.data['species_detail']['order'] == 'Cucurbitales'
        assert response.data['related_species'][0]['id'] == related.pk
        assert response.data['image'].endswith('.avif')

    def test_lists_only_the_authenticated_users_observations(self, api_client):
        species = Species.objects.create(scientific_name='Ficus lyrata', order='Rosales', family='Moraceae', genus='Ficus')
        Observation.objects.create(owner=api_client.user, species=species)
        other = User.objects.create_user(username='other-observer')
        Observation.objects.create(owner=other, species=species)

        response = api_client.get(reverse('observation-list'))

        assert response.status_code == 200
        assert response.data['count'] == 1
