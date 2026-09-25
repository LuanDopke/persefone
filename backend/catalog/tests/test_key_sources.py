import json

import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient

from catalog.key_sources import _parse_keybase, _parse_sdd, _xml_root
from catalog.models import IdentificationKey


def test_parses_multifurcating_keybase_graph():
    data = {
        'first_step': {'root_node_id': '10'},
        'items': [
            {'item_id': '1', 'item_name': 'Begonia alpha'},
            {'item_id': '2', 'item_name': 'Begonia beta'},
            {'item_id': '3', 'item_name': 'Begonia gamma'},
        ],
        'leads': [
            {'parent_id': '10', 'lead_id': '11', 'lead_text': 'Folha lisa', 'item': '1'},
            {'parent_id': '10', 'lead_id': '12', 'lead_text': 'Folha pilosa', 'item': '2'},
            {'parent_id': '10', 'lead_id': '13', 'lead_text': 'Folha cerosa', 'item': '3'},
        ],
    }
    graph = _parse_keybase(data)
    assert graph['type'] == 'branching'
    assert len(graph['steps'][0]['choices']) == 3


def test_parses_sdd_categorical_matrix():
    raw = b'''<?xml version="1.0"?><Datasets xmlns="http://rs.tdwg.org/UBIF/2006/"><Dataset xml:lang="pt"><Representation><Label>Begonias</Label></Representation><TaxonNames><TaxonName id="t1"><Representation><Label>Begonia alpha</Label></Representation></TaxonName><TaxonName id="t2"><Representation><Label>Begonia beta</Label></Representation></TaxonName></TaxonNames><Characters><CategoricalCharacter id="c1"><Representation><Label>Folha</Label></Representation><States><StateDefinition id="s1"><Representation><Label>lisa</Label></Representation></StateDefinition><StateDefinition id="s2"><Representation><Label>pilosa</Label></Representation></StateDefinition></States></CategoricalCharacter></Characters><CodedDescriptions><CodedDescription><Scope><TaxonName ref="t1"/></Scope><SummaryData><Categorical ref="c1"><State ref="s1"/></Categorical></SummaryData></CodedDescription><CodedDescription><Scope><TaxonName ref="t2"/></Scope><SummaryData><Categorical ref="c1"><State ref="s2"/></Categorical></SummaryData></CodedDescription></CodedDescriptions></Dataset></Datasets>'''
    graph, title, _, language = _parse_sdd(_xml_root(raw))
    assert title == 'Begonias'
    assert language == 'pt'
    assert graph['type'] == 'multi_access'
    assert [row['name'] for row in graph['taxa']] == ['Begonia alpha', 'Begonia beta']


@pytest.mark.django_db
def test_import_endpoint_creates_private_review_draft(monkeypatch):
    user = User.objects.create_user(username='importer')
    client = APIClient()
    client.force_authenticate(user=user)
    imported = {
        'title': 'Chave externa', 'coverage': 'Brasil', 'source': 'Fonte',
        'source_metadata': {'kind': 'sdd', 'license': 'CC BY 4.0', 'imported': True},
        'draft_graph': {'type': 'branching', 'start': 's1', 'steps': []},
    }
    monkeypatch.setattr('catalog.key_views.load_external_source', lambda *args, **kwargs: imported)
    monkeypatch.setattr('catalog.key_views.resolve_graph_taxa', lambda graph, rank: graph)
    response = client.post(reverse('identification-key-import'), {
        'source_kind': 'sdd', 'scope_rank': 'genus', 'scope_gbif_key': '200',
        'scope_name': 'Begonia', 'license': 'CC BY 4.0', 'source_url': 'https://app.xper3.fr/key.xml',
    })
    assert response.status_code == 201
    saved = IdentificationKey.objects.get(pk=response.data['id'])
    assert saved.published_version == 0
    assert saved.source_metadata['kind'] == 'sdd'
    assert client.get(reverse('identification-key-list')).data['count'] == 0
