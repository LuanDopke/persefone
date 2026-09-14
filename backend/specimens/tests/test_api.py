"""API contract tests for Specimen and CareLog endpoints."""

import pytest
from datetime import date
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth.models import User

from catalog.models import Species
from specimens.models import Specimen, CareLog


@pytest.fixture
def api_client(db):
    user = User.objects.create_user(username='testuser', password='testpass123')
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def species(db):
    return Species.objects.create(
        scientific_name='Monstera deliciosa',
        common_name='Swiss Cheese Plant',
        family='Araceae',
        genus='Monstera',
    )


@pytest.fixture
def specimen(species):
    return Specimen.objects.create(
        species=species,
        nickname='Monsterina',
        location_in_home='Living Room',
        acquired_at=date(2024, 6, 1),
    )


@pytest.mark.django_db
class TestSpecimenAPI:
    """Contract tests for Specimen CRUD endpoints."""

    def test_list_specimens(self, api_client, specimen):
        url = reverse('specimen-list')
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['nickname'] == 'Monsterina'

    def test_create_specimen(self, api_client, species):
        url = reverse('specimen-list')
        data = {
            'species': species.pk,
            'nickname': 'New Plant',
            'acquired_at': '2024-07-01',
        }
        response = api_client.post(url, data)
        assert response.status_code == 201
        assert response.data['nickname'] == 'New Plant'

    def test_retrieve_specimen_detail(self, api_client, specimen):
        url = reverse('specimen-detail', kwargs={'pk': str(specimen.pk)})
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data['nickname'] == 'Monsterina'
        assert 'species_detail' in response.data
        assert 'care_logs' in response.data

    def test_update_specimen_vitals(self, api_client, specimen):
        url = reverse('specimen-detail', kwargs={'pk': str(specimen.pk)})
        response = api_client.patch(url, {'vitality_index': 85})
        assert response.status_code == 200
        assert response.data['vitality_index'] == 85

    def test_delete_specimen(self, api_client, specimen):
        url = reverse('specimen-detail', kwargs={'pk': str(specimen.pk)})
        response = api_client.delete(url)
        assert response.status_code == 204
        assert Specimen.objects.count() == 0


@pytest.mark.django_db
class TestCollectionAPI:
    def make_specimen(self, species, nickname, **values):
        return Specimen.objects.create(
            species=species, nickname=nickname, acquired_at=date(2024, 6, 1), **values,
        )

    def test_collection_groups_active_species_paginates_and_uses_specimen_photo(self, api_client, species):
        second = Species.objects.create(scientific_name='Ficus elastica', common_name='Rubber plant')
        self.make_specimen(species, 'One', photo='https://example.test/monstera.jpg')
        self.make_specimen(species, 'Two')
        self.make_specimen(second, 'Three')
        response = api_client.get(reverse('specimen-collection'), {'page_size': 1})
        assert response.status_code == 200
        assert response.data['count'] == 2
        assert len(response.data['results']) == 1
        item = response.data['results'][0]
        assert item['specimen_count'] == 2
        assert item['image_url'] == 'https://example.test/monstera.jpg'
        assert item['is_archived'] is False

    def test_collection_puts_archived_species_after_active(self, api_client, species):
        archived = self.make_specimen(species, 'Old', is_active=False)
        active_species = Species.objects.create(scientific_name='Ficus elastica')
        self.make_specimen(active_species, 'Current')
        response = api_client.get(reverse('specimen-collection'), {'page_size': 10})
        assert response.status_code == 200
        assert [item['species_id'] for item in response.data['results']] == [active_species.id, archived.species_id]
        assert response.data['results'][1]['is_archived'] is True

    def test_collection_exposes_independent_care_indicators(self, api_client, species):
        self.make_specimen(species, 'Dry', soil_moisture=20, lux_intensity=1000)
        self.make_specimen(species, 'Dark', soil_moisture=60, lux_intensity=100)
        self.make_specimen(species, 'Fine', soil_moisture=60, lux_intensity=1000)
        response = api_client.get(reverse('specimen-collection'))
        care = response.data['results'][0]['care']
        assert care['water'] == {'needs_attention': True, 'affected_count': 1, 'total_count': 3}
        assert care['light'] == {'needs_attention': True, 'affected_count': 1, 'total_count': 3}
        assert care['nutrients'] == {'needs_attention': False, 'affected_count': 0, 'total_count': 3}

    def test_collection_filters_and_updates_favorite(self, api_client, species):
        self.make_specimen(species, 'Dry', soil_moisture=20)
        other = Species.objects.create(scientific_name='Ficus elastica', common_name='Rubber plant')
        self.make_specimen(other, 'Rubber')
        filtered = api_client.get(reverse('specimen-collection'), {'search': 'monstera', 'attention': 'true'})
        assert [item['species_id'] for item in filtered.data['results']] == [species.id]
        favorite = api_client.patch(
            reverse('specimen-collection-favorite', kwargs={'species_id': species.id}),
            {'is_favorite': True}, format='json',
        )
        assert favorite.status_code == 200
        assert favorite.data['is_favorite'] is True
        assert api_client.get(reverse('specimen-collection'), {'favorite': 'true'}).data['count'] == 1


@pytest.mark.django_db
class TestCareLogAPI:
    """Contract tests for CareLog endpoints."""

    def test_create_care_log(self, api_client, specimen):
        url = reverse('carelog-list')
        data = {
            'specimen': str(specimen.pk),
            'type': 'watering',
            'notes': '200ml filtered water',
        }
        response = api_client.post(url, data)
        assert response.status_code == 201
        assert response.data['type'] == 'watering'

    def test_list_care_logs_filtered_by_specimen(self, api_client, specimen):
        CareLog.objects.create(specimen=specimen, type='watering')
        CareLog.objects.create(specimen=specimen, type='fertilizing')

        url = reverse('carelog-list')
        response = api_client.get(url, {'specimen_id': str(specimen.pk)})
        assert response.status_code == 200
        assert len(response.data['results']) == 2
