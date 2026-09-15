import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient

from catalog.models import Species
from specimens.models import Specimen
from datetime import date


@pytest.fixture
def api_client(db):
    user = User.objects.create_user(username='catalog-api-user')
    client = APIClient()
    client.force_authenticate(user=user)
    return client


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
