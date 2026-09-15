"""API contract tests for Specimen and CareLog endpoints."""

import pytest
from io import BytesIO
from datetime import date
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth.models import User

from catalog.models import Species
from specimens.models import Specimen, CareLog, VisualEntry


def image_upload(name='initial.png'):
    stream = BytesIO()
    Image.new('RGB', (40, 30), color='green').save(stream, format='PNG')
    return SimpleUploadedFile(name, stream.getvalue(), content_type='image/png')


@pytest.fixture
def user(db):
    return User.objects.create_user(username='testuser', password='testpass123')


@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    client.user = user
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
def specimen(species, user):
    return Specimen.objects.create(
        owner=user,
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
            'initial_soil': 'Substrato drenante',
            'initial_light': 'Meia sombra',
            'client_timezone': 'America/Sao_Paulo',
        }
        response = api_client.post(url, data)
        assert response.status_code == 201
        assert response.data['nickname'] == 'New Plant'

    def test_create_requires_registration_fields(self, api_client):
        response = api_client.post(reverse('specimen-list'), {}, format='json')

        assert response.status_code == 400
        assert {'species', 'acquired_at', 'initial_soil', 'initial_light'} <= set(response.data)

    def test_create_rejects_invalid_light_and_future_local_date(self, api_client, species):
        payload = {
            'species': species.pk,
            'acquired_at': '2999-01-01',
            'initial_soil': 'Solo',
            'initial_light': 'Luz indireta',
            'client_timezone': 'America/Sao_Paulo',
        }
        response = api_client.post(reverse('specimen-list'), payload, format='json')

        assert response.status_code == 400
        assert 'initial_light' in response.data
        payload['initial_light'] = 'Sol pleno'
        future_response = api_client.post(reverse('specimen-list'), payload, format='json')
        assert future_response.status_code == 400
        assert 'acquired_at' in future_response.data

    def test_create_generates_owner_scoped_default_name(self, api_client, species):
        payload = {
            'species': species.pk,
            'acquired_at': '2024-07-01',
            'initial_soil': 'Solo',
            'initial_light': 'Sombra',
            'client_timezone': 'America/Sao_Paulo',
        }

        first = api_client.post(reverse('specimen-list'), payload, format='json')
        second = api_client.post(reverse('specimen-list'), payload, format='json')

        assert first.status_code == second.status_code == 201
        assert first.data['nickname'] == 'Monstera deliciosa #1'
        assert second.data['nickname'] == 'Monstera deliciosa #2'
        assert Specimen.objects.filter(owner=api_client.user).count() == 2

    def test_other_users_specimens_are_not_visible(self, api_client, species):
        other = User.objects.create_user(username='other-user')
        hidden = Specimen.objects.create(
            owner=other,
            species=species,
            nickname='Oculto',
            acquired_at=date(2024, 1, 1),
            initial_soil='Solo',
            initial_light='Sol pleno',
        )

        assert api_client.get(reverse('specimen-list')).data['count'] == 0
        assert api_client.get(reverse('specimen-detail', kwargs={'pk': hidden.pk})).status_code == 404

    def test_create_with_photo_creates_one_visual_entry(self, api_client, species, settings, tmp_path):
        settings.MEDIA_ROOT = tmp_path
        response = api_client.post(reverse('specimen-list'), {
            'species': species.pk,
            'nickname': 'Com foto',
            'acquired_at': '2024-07-01',
            'initial_soil': 'Solo',
            'initial_light': 'Meia sombra',
            'client_timezone': 'America/Sao_Paulo',
            'initial_photo': image_upload(),
        }, format='multipart')

        assert response.status_code == 201
        assert VisualEntry.objects.filter(specimen_id=response.data['id']).count() == 1
        entry = VisualEntry.objects.get(specimen_id=response.data['id'])
        assert entry.image.name.endswith('.avif')
        assert entry.image.size <= settings.INITIAL_PHOTO_TARGET_BYTES
        assert response.data['initial_visual_entry']['image'].endswith('.avif')
        with Image.open(entry.image.path) as stored:
            assert stored.format == 'AVIF'

    def test_create_without_photo_has_no_visual_entry(self, api_client, species):
        response = api_client.post(reverse('specimen-list'), {
            'species': species.pk,
            'acquired_at': '2024-07-01',
            'initial_soil': 'Solo',
            'initial_light': 'Sombra',
        }, format='multipart')

        assert response.status_code == 201
        assert response.data['initial_visual_entry'] is None
        assert VisualEntry.objects.count() == 0

    def test_rejects_invalid_and_oversized_photo(self, api_client, species, settings):
        base = {
            'species': species.pk,
            'acquired_at': '2024-07-01',
            'initial_soil': 'Solo',
            'initial_light': 'Sol pleno',
        }
        invalid = api_client.post(reverse('specimen-list'), {
            **base,
            'initial_photo': SimpleUploadedFile('notes.txt', b'not an image', content_type='text/plain'),
        }, format='multipart')
        oversized = api_client.post(reverse('specimen-list'), {
            **base,
            'initial_photo': SimpleUploadedFile('large.png', b'x' * (settings.INITIAL_PHOTO_MAX_BYTES + 1), content_type='image/png'),
        }, format='multipart')

        assert invalid.status_code == oversized.status_code == 400
        assert 'initial_photo' in invalid.data
        assert 'initial_photo' in oversized.data
        assert Specimen.objects.count() == 0

    def test_visual_entry_failure_rolls_back_specimen(self, api_client, species, settings, tmp_path, monkeypatch):
        settings.MEDIA_ROOT = tmp_path

        original_save = VisualEntry.save

        def fail_save(instance, *args, **kwargs):
            original_save(instance, *args, **kwargs)
            raise RuntimeError('storage failure')

        monkeypatch.setattr(VisualEntry, 'save', fail_save)
        with pytest.raises(RuntimeError):
            api_client.post(reverse('specimen-list'), {
                'species': species.pk,
                'acquired_at': '2024-07-01',
                'initial_soil': 'Solo',
                'initial_light': 'Sombra',
                'initial_photo': image_upload(),
            }, format='multipart')

        assert Specimen.objects.count() == 0
        assert [path for path in tmp_path.rglob('*') if path.is_file()] == []

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
    def make_specimen(self, api_client, species, nickname, **values):
        return Specimen.objects.create(
            owner=api_client.user, species=species, nickname=nickname, acquired_at=date(2024, 6, 1), **values,
        )

    def test_collection_groups_active_species_paginates_and_uses_specimen_photo(self, api_client, species):
        second = Species.objects.create(scientific_name='Ficus elastica', common_name='Rubber plant')
        self.make_specimen(api_client, species, 'One', photo='https://example.test/monstera.jpg')
        self.make_specimen(api_client, species, 'Two')
        self.make_specimen(api_client, second, 'Three')
        response = api_client.get(reverse('specimen-collection'), {'page_size': 10})
        assert response.status_code == 200
        assert response.data['count'] == 2
        item = next(item for item in response.data['results'] if item['species_id'] == species.id)
        assert item['specimen_count'] == 2
        assert item['image_url'] == 'https://example.test/monstera.jpg'
        assert item['is_archived'] is False

    def test_collection_puts_archived_species_after_active(self, api_client, species):
        archived = self.make_specimen(api_client, species, 'Old', is_active=False)
        active_species = Species.objects.create(scientific_name='Ficus elastica')
        self.make_specimen(api_client, active_species, 'Current')
        response = api_client.get(reverse('specimen-collection'), {'page_size': 10})
        assert response.status_code == 200
        assert [item['species_id'] for item in response.data['results']] == [active_species.id, archived.species_id]
        assert response.data['results'][1]['is_archived'] is True

    def test_collection_exposes_independent_care_indicators(self, api_client, species):
        self.make_specimen(api_client, species, 'Dry', soil_moisture=20, lux_intensity=1000)
        self.make_specimen(api_client, species, 'Dark', soil_moisture=60, lux_intensity=100)
        self.make_specimen(api_client, species, 'Fine', soil_moisture=60, lux_intensity=1000)
        response = api_client.get(reverse('specimen-collection'))
        care = response.data['results'][0]['care']
        assert care['water'] == {'needs_attention': True, 'affected_count': 1, 'total_count': 3}
        assert care['light'] == {'needs_attention': True, 'affected_count': 1, 'total_count': 3}
        assert care['nutrients'] == {'needs_attention': False, 'affected_count': 0, 'total_count': 3}

    def test_collection_filters_and_updates_favorite(self, api_client, species):
        self.make_specimen(api_client, species, 'Dry', soil_moisture=20)
        other = Species.objects.create(scientific_name='Ficus elastica', common_name='Rubber plant')
        self.make_specimen(api_client, other, 'Rubber')
        filtered = api_client.get(reverse('specimen-collection'), {'search': 'monstera', 'attention': 'true'})
        assert [item['species_id'] for item in filtered.data['results']] == [species.id]
        favorite = api_client.patch(
            reverse('specimen-collection-favorite', kwargs={'species_id': species.id}),
            {'is_favorite': True}, format='json',
        )
        assert favorite.status_code == 200
        assert favorite.data['is_favorite'] is True
        assert api_client.get(reverse('specimen-collection'), {'favorite': 'true'}).data['count'] == 1

    def test_collection_uses_first_visual_entry_as_cover(self, api_client, species, settings, tmp_path):
        settings.MEDIA_ROOT = tmp_path
        specimen = self.make_specimen(api_client, species, 'Visual')
        VisualEntry.objects.create(specimen=specimen, image='specimens/initial/cover.jpg')

        response = api_client.get(reverse('specimen-collection'))

        assert response.data['results'][0]['image_url'].endswith('/media/specimens/initial/cover.jpg')


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
