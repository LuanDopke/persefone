import pytest
from io import BytesIO
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework.test import APIClient

from catalog.models import Observation, ObservationEvidence, ObservationHypothesis, ObservationRevision, Species
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

    def test_creates_unidentified_record_and_adds_comparison_evidence(self, api_client, settings, tmp_path):
        settings.MEDIA_ROOT = tmp_path
        created = api_client.post(reverse('observation-list'), {'title': 'Planta na praça', 'initial_notes': 'Folhas serradas'}, format='multipart')
        assert created.status_code == 201
        assert created.data['species'] is None
        assert created.data['evidence'][0]['notes'] == 'Folhas serradas'
        observation_id = created.data['id']

        evidence = api_client.post(reverse('observation-evidence', args=[observation_id]), {
            'subject': 'comparison', 'notes': 'Outro indivíduo com flores',
            'image': observation_image(), 'latitude': '-23.550520', 'longitude': '-46.633308',
        }, format='multipart')
        assert evidence.status_code == 201
        assert evidence.data['subject'] == 'comparison'
        assert evidence.data['image'].endswith('.avif')
        assert ObservationEvidence.objects.filter(observation_id=observation_id).count() == 2

    def test_hypotheses_and_confirmation_history(self, api_client):
        observation = Observation.objects.create(owner=api_client.user, title='Planta desconhecida')
        genus = api_client.post(reverse('observation-hypotheses', args=[observation.pk]), {
            'source': 'manual', 'rank': 'genus', 'name': 'Begonia', 'notes': 'Folhas assimétricas',
        }, format='json')
        assert genus.status_code == 201
        denied = api_client.post(reverse('observation-confirm', args=[observation.pk]), {'hypothesis_id': genus.data['id']}, format='json')
        assert denied.status_code == 400
        discarded = api_client.patch(reverse('observation-hypothesis-status', args=[observation.pk, genus.data['id']]), {'status': 'discarded'}, format='json')
        assert discarded.status_code == 200
        assert discarded.data['discarded_at']

        species = Species.objects.create(scientific_name='Begonia maculata', genus='Begonia')
        candidate = api_client.post(reverse('observation-hypotheses', args=[observation.pk]), {
            'source': 'catalog', 'species': species.pk,
        }, format='json')
        assert candidate.status_code == 201
        confirmed = api_client.post(reverse('observation-confirm', args=[observation.pk]), {'hypothesis_id': candidate.data['id']}, format='json')
        assert confirmed.status_code == 200
        assert confirmed.data['species'] == species.pk
        reopened = api_client.post(reverse('observation-reopen', args=[observation.pk]), {'notes': 'Nova floração'}, format='json')
        assert reopened.status_code == 200
        assert reopened.data['species'] is None
        assert [event['action'] for event in reopened.data['identification_events']] == ['reopen', 'confirm']

    def test_rejects_incomplete_location_and_other_users_records(self, api_client):
        invalid = api_client.post(reverse('observation-list'), {'title': 'Rua A', 'latitude': '-23.55'}, format='json')
        assert invalid.status_code == 400
        other = User.objects.create_user(username='other-observer-2')
        observation = Observation.objects.create(owner=other, title='Privada')
        assert api_client.get(reverse('observation-detail', args=[observation.pk])).status_code == 404
        assert api_client.post(reverse('observation-evidence', args=[observation.pk]), {'notes': 'Teste'}, format='json').status_code == 404
        assert api_client.post(reverse('observation-hypotheses', args=[observation.pk]), {'source': 'manual', 'name': 'Ficus'}, format='json').status_code == 404

    def test_rejects_placeholder_as_final_species(self, api_client):
        observation = Observation.objects.create(owner=api_client.user, title='Incerta')
        species = Species.objects.create(scientific_name='Begonia sp.')
        assert api_client.post(reverse('observation-list'), {'species': species.pk}, format='json').status_code == 400
        candidate = api_client.post(reverse('observation-hypotheses', args=[observation.pk]), {
            'source': 'catalog', 'species': species.pk,
        }, format='json')
        assert candidate.status_code == 201
        assert api_client.post(reverse('observation-confirm', args=[observation.pk]), {'hypothesis_id': candidate.data['id']}, format='json').status_code == 400

    @patch('catalog.views.get_species_by_gbif_key')
    @patch('catalog.views.get_gbif_taxon_profile')
    def test_gbif_confirmation_checks_actual_rank(self, profile, cache_species, api_client):
        observation = Observation.objects.create(owner=api_client.user, title='Planta na calçada')
        candidate = api_client.post(reverse('observation-hypotheses', args=[observation.pk]), {
            'source': 'catalog', 'rank': 'species', 'name': 'Begonia maculata', 'gbif_key': 7303475,
        }, format='json')
        assert candidate.status_code == 201
        url = reverse('observation-confirm', args=[observation.pk])
        profile.return_value = {'taxon': {'rank': 'genus'}}
        assert api_client.post(url, {'hypothesis_id': candidate.data['id']}, format='json').status_code == 400
        cache_species.assert_not_called()
        profile.return_value = {'taxon': {'rank': 'species'}}
        cache_species.return_value = Species.objects.create(scientific_name='Begonia maculata', gbif_key=7303475)
        confirmed = api_client.post(url, {'hypothesis_id': candidate.data['id']}, format='json')
        assert confirmed.status_code == 200
        assert confirmed.data['species'] == cache_species.return_value.pk

    def test_invalid_hypothesis_identifier_is_rejected(self, api_client):
        observation = Observation.objects.create(owner=api_client.user, title='Sem identificação')
        assert api_client.post(reverse('observation-confirm', args=[observation.pk]), {'hypothesis_id': 'invalid'}, format='json').status_code == 400
        assert api_client.patch(reverse('observation-hypothesis-status', args=[observation.pk, 'invalid']), {'status': 'discarded'}, format='json').status_code == 404

    def test_list_filters_before_pagination_and_searches_hypotheses(self, api_client):
        identified_species = Species.objects.create(scientific_name='Begonia maculata')
        confirmed = Observation.objects.create(owner=api_client.user, title='Vaso da rua', species=identified_species)
        pending = Observation.objects.create(owner=api_client.user, title='Arbusto da praça')
        ObservationHypothesis.objects.create(observation=pending, name='Ficus', source='manual')
        other = User.objects.create_user(username='other-search-user')
        Observation.objects.create(owner=other, title='Ficus privado')
        url = reverse('observation-list')
        result = api_client.get(url, {'status': 'pending', 'search': 'ficus'})
        assert result.status_code == 200
        assert [row['id'] for row in result.data['results']] == [str(pending.pk)]
        assert result.data['results'][0]['active_hypotheses_count'] == 1
        assert api_client.get(url, {'status': 'confirmed'}).data['results'][0]['id'] == str(confirmed.pk)
        assert api_client.get(url, {'status': 'bad'}).status_code == 400

    def test_edits_evidence_and_hypothesis_with_revision_history(self, api_client):
        observation = Observation.objects.create(owner=api_client.user, title='Rua das Flores')
        evidence = ObservationEvidence.objects.create(observation=observation, notes='Folha verde')
        hypothesis = ObservationHypothesis.objects.create(observation=observation, source='manual', name='Begonia', notes='Folha')
        evidence_url = reverse('observation-evidence-detail', args=[observation.pk, evidence.pk])
        response = api_client.patch(evidence_url, {
            'notes': 'Folha verde e serrada', 'subject': 'comparison',
            'latitude': '-23.550520', 'longitude': '-46.633308',
        }, format='json')
        assert response.status_code == 200
        assert response.data['revisions'][0]['before']['notes'] == 'Folha verde'
        assert response.data['revisions'][0]['after']['subject'] == 'comparison'
        assert api_client.patch(evidence_url, {'notes': ''}, format='json').status_code == 400
        hypothesis_url = reverse('observation-hypothesis-status', args=[observation.pk, hypothesis.pk])
        updated = api_client.patch(hypothesis_url, {'notes': 'Folha assimétrica'}, format='json')
        assert updated.status_code == 200
        assert updated.data['revisions'][0]['before']['notes'] == 'Folha'
        assert ObservationRevision.objects.filter(observation=observation).count() == 2
        observation.refresh_from_db()
        assert observation.updated_at > observation.created_at

    def test_other_user_cannot_edit_evidence_or_hypothesis(self, api_client):
        other = User.objects.create_user(username='other-editor')
        observation = Observation.objects.create(owner=other, title='Privada')
        evidence = ObservationEvidence.objects.create(observation=observation, notes='Nota')
        hypothesis = ObservationHypothesis.objects.create(observation=observation, name='Ficus', source='manual')
        assert api_client.patch(reverse('observation-evidence-detail', args=[observation.pk, evidence.pk]), {'notes': 'Alterada'}, format='json').status_code == 404
        assert api_client.patch(reverse('observation-hypothesis-status', args=[observation.pk, hypothesis.pk]), {'notes': 'Alterada'}, format='json').status_code == 404
