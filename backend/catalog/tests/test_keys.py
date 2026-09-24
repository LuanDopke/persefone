import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient

from catalog.models import (IdentificationKeyRun, IdentificationKeyRunRevision,
    IdentificationKeyVersion, Observation, ObservationHypothesis)


@pytest.fixture
def client(db):
    user = User.objects.create_user(username='key-author')
    api = APIClient()
    api.force_authenticate(user=user)
    api.user = user
    return api


@pytest.fixture
def taxa(monkeypatch):
    details = {
        100: {'rank': 'FAMILY', 'taxonomicStatus': 'ACCEPTED', 'canonicalName': 'Begoniaceae'},
        200: {'rank': 'GENUS', 'taxonomicStatus': 'ACCEPTED', 'canonicalName': 'Begonia', 'familyKey': 100},
        300: {'rank': 'GENUS', 'taxonomicStatus': 'ACCEPTED', 'canonicalName': 'Hillebrandia', 'familyKey': 100},
        400: {'rank': 'SPECIES', 'taxonomicStatus': 'ACCEPTED', 'canonicalName': 'Begonia maculata', 'genusKey': 200},
        401: {'rank': 'SPECIES', 'taxonomicStatus': 'ACCEPTED', 'canonicalName': 'Begonia venosa', 'genusKey': 200},
    }
    monkeypatch.setattr('catalog.key_service.taxon_detail', lambda key: details[key])
    return details


def graph(rank='genus'):
    first = {'key': 200, 'rank': 'genus', 'name': 'Begonia'} if rank == 'genus' else {'key': 400, 'rank': 'species', 'name': 'Begonia maculata'}
    second = {'key': 300, 'rank': 'genus', 'name': 'Hillebrandia'} if rank == 'genus' else {'key': 401, 'rank': 'species', 'name': 'Begonia venosa'}
    return {'start': 's1', 'steps': [{'id': 's1', 'prompt': 'Como são as folhas?', 'choices': [
        {'text': 'Alternas', 'taxon': first}, {'text': 'Opostas', 'taxon': second}]}]}


def create_key(client, rank='family', scope_key=100, draft=None):
    return client.post(reverse('identification-key-list'), {
        'title': 'Chave de campo', 'scope_rank': rank, 'scope_gbif_key': scope_key,
        'scope_name': 'Begoniaceae' if rank == 'family' else 'Begonia',
        'coverage': 'Espécies observadas no sul do Brasil', 'source': 'Elaboração própria',
        'draft_graph': draft or graph('genus' if rank == 'family' else 'species'),
    }, format='json')


def multi_graph():
    return {'type': 'multi_access', 'descriptors': [
        {'id': 'leaf', 'label': 'Manchas nas folhas', 'states': [
            {'id': 'present', 'label': 'Presentes'}, {'id': 'absent', 'label': 'Ausentes'},
        ]},
    ], 'taxa': [
        {'key': 400, 'rank': 'species', 'name': 'Begonia maculata', 'states': {'leaf': ['present']}},
        {'key': 401, 'rank': 'species', 'name': 'Begonia venosa', 'states': {'leaf': ['absent']}},
    ]}


@pytest.mark.django_db
class TestIdentificationKeys:
    def test_multi_access_key_filters_taxa_and_saves_result(self, client, taxa):
        key = create_key(client, 'genus', 200, multi_graph())
        published = client.post(reverse('identification-key-publish', args=[key.data['id']]))
        assert published.status_code == 200
        observation = Observation.objects.create(owner=client.user, title='Folhas pintadas')
        run = client.post(reverse('observation-key-runs', args=[observation.pk]),
            {'version_id': published.data['version_id']}, format='json')
        assert run.data['key_type'] == 'multi_access'
        assert len(run.data['remaining_taxa']) == 2
        result = client.post(reverse('observation-key-run-answers', args=[observation.pk, run.data['id']]),
            {'descriptor_id': 'leaf', 'state_ids': ['present']}, format='json')
        assert result.status_code == 200
        assert result.data['status'] == 'completed'
        assert result.data['result_taxon']['name'] == 'Begonia maculata'
        assert result.data['result_hypothesis']

    def test_publication_and_saved_family_to_species_path(self, client, taxa):
        family = create_key(client)
        assert family.status_code == 201
        assert client.get(reverse('identification-key-list')).data['count'] == 0
        published = client.post(reverse('identification-key-publish', args=[family.data['id']]))
        assert published.status_code == 200
        assert published.data['published_version'] == 1
        genus = create_key(client, 'genus', 200)
        genus_published = client.post(reverse('identification-key-publish', args=[genus.data['id']]))
        observation = Observation.objects.create(owner=client.user, title='Planta da praça')
        start = client.post(reverse('observation-key-runs', args=[observation.pk]), {'version_id': published.data['version_id']}, format='json')
        assert start.status_code == 201
        paused = client.post(reverse('observation-key-run-answers', args=[observation.pk, start.data['id']]),
            {'step_id': 's1', 'choice_index': None, 'note': 'Aguardar floração'}, format='json')
        assert paused.data['status'] == 'paused'
        assert paused.data['pending_note'] == 'Aguardar floração'
        result = client.post(reverse('observation-key-run-answers', args=[observation.pk, start.data['id']]),
            {'step_id': 's1', 'choice_index': 0}, format='json')
        assert result.data['result_taxon']['name'] == 'Begonia'
        assert result.data['result_hypothesis']
        continuation = client.post(reverse('observation-key-runs', args=[observation.pk]),
            {'version_id': genus_published.data['version_id'], 'parent_run': start.data['id']}, format='json')
        assert continuation.status_code == 201
        species = client.post(reverse('observation-key-run-answers', args=[observation.pk, continuation.data['id']]),
            {'step_id': 's1', 'choice_index': 0}, format='json')
        assert species.data['result_taxon']['name'] == 'Begonia maculata'
        observation.refresh_from_db()
        assert observation.species_id is None
        assert ObservationHypothesis.objects.filter(observation=observation).count() == 2

    def test_author_controls_suggestions_and_versions_are_immutable(self, client, taxa):
        key = create_key(client)
        client.post(reverse('identification-key-publish', args=[key.data['id']]))
        other = User.objects.create_user(username='key-reader')
        reader = APIClient()
        reader.force_authenticate(user=other)
        assert reader.patch(reverse('identification-key-detail', args=[key.data['id']]), {'title': 'Alterada'}, format='json').status_code == 404
        proposal = reader.post(reverse('identification-key-suggestions', args=[key.data['id']]),
            {'graph': graph(), 'note': 'Rever caracteres.'}, format='json')
        assert proposal.status_code == 201
        assert reader.get(reverse('identification-key-suggestions', args=[key.data['id']])).status_code == 404
        accepted = client.post(reverse('identification-key-suggestion-decision', args=[key.data['id'], proposal.data['id']]),
            {'decision': 'accepted'}, format='json')
        assert accepted.data['published_version'] == 2
        assert IdentificationKeyVersion.objects.filter(key_id=key.data['id']).count() == 2
        assert IdentificationKeyVersion.objects.get(key_id=key.data['id'], number=1).graph == graph()

    def test_rejects_cycle_and_wrong_group(self, client, taxa):
        cyclic = graph()
        cyclic['steps'][0]['choices'][0] = {'text': 'Alternas', 'next': 's1'}
        key = create_key(client, draft=cyclic)
        assert client.post(reverse('identification-key-publish', args=[key.data['id']])).status_code == 400
        wrong = graph('species')
        assert client.patch(reverse('identification-key-detail', args=[key.data['id']]), {'draft_graph': wrong}, format='json').status_code == 200
        assert client.post(reverse('identification-key-publish', args=[key.data['id']])).status_code == 400

    def test_correction_preserves_history_and_owner_isolation(self, client, taxa):
        key = create_key(client, 'genus', 200)
        published = client.post(reverse('identification-key-publish', args=[key.data['id']]))
        observation = Observation.objects.create(owner=client.user, title='Planta')
        run = client.post(reverse('observation-key-runs', args=[observation.pk]), {'version_id': published.data['version_id']}, format='json')
        url = reverse('observation-key-run-answers', args=[observation.pk, run.data['id']])
        client.post(url, {'step_id': 's1', 'choice_index': 0}, format='json')
        corrected = client.patch(url, {'index': 0, 'step_id': 's1', 'choice_index': 1}, format='json')
        assert corrected.status_code == 200
        assert corrected.data['result_taxon']['name'] == 'Begonia venosa'
        assert IdentificationKeyRunRevision.objects.filter(run_id=run.data['id']).count() == 1
        assert ObservationHypothesis.objects.filter(observation=observation, discarded_at__isnull=False).count() == 1
        other = User.objects.create_user(username='observation-reader')
        reader = APIClient()
        reader.force_authenticate(user=other)
        assert reader.get(reverse('observation-key-runs', args=[observation.pk])).status_code == 404
        assert reader.patch(url, {'index': 0, 'step_id': 's1', 'choice_index': 0}, format='json').status_code == 404

    def test_parent_correction_substitutes_child_without_changing_old_version(self, client, taxa):
        family = create_key(client)
        family_published = client.post(reverse('identification-key-publish', args=[family.data['id']]))
        genus = create_key(client, 'genus', 200)
        genus_published = client.post(reverse('identification-key-publish', args=[genus.data['id']]))
        observation = Observation.objects.create(owner=client.user, title='Rua')
        parent = client.post(reverse('observation-key-runs', args=[observation.pk]),
            {'version_id': family_published.data['version_id']}, format='json')
        parent_url = reverse('observation-key-run-answers', args=[observation.pk, parent.data['id']])
        client.post(parent_url, {'step_id': 's1', 'choice_index': 0}, format='json')
        child = client.post(reverse('observation-key-runs', args=[observation.pk]),
            {'version_id': genus_published.data['version_id'], 'parent_run': parent.data['id']}, format='json')
        child_url = reverse('observation-key-run-answers', args=[observation.pk, child.data['id']])
        client.post(child_url, {'step_id': 's1', 'choice_index': 0}, format='json')
        modified = graph()
        modified['steps'][0]['prompt'] = 'Folhas e caule?'
        client.patch(reverse('identification-key-detail', args=[family.data['id']]), {'draft_graph': modified}, format='json')
        client.post(reverse('identification-key-publish', args=[family.data['id']]))
        saved_parent = IdentificationKeyRun.objects.get(pk=parent.data['id'])
        assert saved_parent.version.number == 1
        assert saved_parent.version.graph['steps'][0]['prompt'] == 'Como são as folhas?'
        note_only = client.patch(parent_url, {'index': 0, 'step_id': 's1', 'choice_index': 0, 'note': 'Conferido na segunda visita'}, format='json')
        assert note_only.status_code == 200
        assert note_only.data['answers'][0]['note'] == 'Conferido na segunda visita'
        assert IdentificationKeyRun.objects.get(pk=child.data['id']).status == 'completed'
        corrected = client.patch(parent_url, {'index': 0, 'step_id': 's1', 'choice_index': 1}, format='json')
        assert corrected.status_code == 200
        saved_child = IdentificationKeyRun.objects.get(pk=child.data['id'])
        assert saved_child.status == 'superseded'
        assert client.post(child_url, {'step_id': 's1', 'choice_index': 1}, format='json').status_code == 400
        assert ObservationHypothesis.objects.filter(observation=observation, discarded_at__isnull=False).count() == 2

    def test_report_and_archive_hide_key_from_public_list(self, client, taxa):
        key = create_key(client)
        client.post(reverse('identification-key-publish', args=[key.data['id']]))
        reader_user = User.objects.create_user(username='reporter')
        reader = APIClient()
        reader.force_authenticate(user=reader_user)
        report = reader.post(reverse('identification-key-report', args=[key.data['id']]), {'reason': 'Uma alternativa apresenta um táxon incorreto.'}, format='json')
        assert report.status_code == 201
        client.post(reverse('identification-key-archive', args=[key.data['id']]))
        assert reader.get(reverse('identification-key-list')).data['count'] == 0
        assert reader.get(reverse('identification-key-detail', args=[key.data['id']])).status_code == 404
        assert client.get(reverse('identification-key-detail', args=[key.data['id']])).status_code == 200

    def test_public_author_does_not_expose_login_email(self, client, taxa):
        client.user.username = 'ana@example.com'
        client.user.save(update_fields=['username'])
        key = create_key(client)
        client.post(reverse('identification-key-publish', args=[key.data['id']]))
        public = client.get(reverse('identification-key-list')).data['results'][0]
        assert public['author'] == 'ana'
        assert 'author_id' not in public

    def test_taxonomy_failure_keeps_draft(self, client, monkeypatch):
        from catalog.key_service import TaxonomyUnavailable
        monkeypatch.setattr('catalog.key_service.taxon_detail', lambda key: (_ for _ in ()).throw(TaxonomyUnavailable()))
        key = create_key(client)
        response = client.post(reverse('identification-key-publish', args=[key.data['id']]))
        assert response.status_code == 503
        detail = client.get(reverse('identification-key-detail', args=[key.data['id']])).data
        assert detail['published_version'] == 0
        assert detail['draft_graph'] == graph()
