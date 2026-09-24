"""Validation and traversal for community identification keys."""

from django.core.cache import cache
from rest_framework.exceptions import ValidationError, APIException
import requests

from catalog.services import _gbif_get


class TaxonomyUnavailable(APIException):
    status_code = 503
    default_detail = 'O catálogo taxonômico está indisponível. O rascunho foi preservado.'


def taxon_detail(key):
    cached = cache.get(f'identification-key-taxon:{key}')
    if cached is not None:
        return cached
    try:
        detail = _gbif_get(f'species/{key}')
    except (requests.RequestException, ValueError) as exc:
        raise TaxonomyUnavailable() from exc
    cache.set(f'identification-key-taxon:{key}', detail, 60 * 60 * 24)
    return detail


def graph_steps(graph):
    return {step['id']: step for step in graph['steps']}


def validate_graph(graph, scope_rank, scope_key, check_taxa=False):
    if isinstance(graph, dict) and graph.get('type') == 'multi_access':
        return _validate_multi_access(graph, scope_rank, scope_key, check_taxa)
    if not isinstance(graph, dict) or not isinstance(graph.get('steps'), list) or not isinstance(graph.get('start'), str):
        raise ValidationError({'graph': 'Informe o passo inicial e uma lista de passos.'})
    steps = graph['steps']
    if not 1 <= len(steps) <= 1000:
        raise ValidationError({'graph': 'A chave deve ter entre 1 e 1000 passos.'})
    ids = [step.get('id') for step in steps if isinstance(step, dict)]
    if len(ids) != len(steps) or not all(isinstance(value, str) and value and len(value) <= 50 for value in ids) or len(set(ids)) != len(ids):
        raise ValidationError({'graph': 'Cada passo precisa de um identificador distinto.'})
    by_id = {step['id']: step for step in steps}
    if graph['start'] not in by_id:
        raise ValidationError({'graph': 'O passo inicial não existe.'})
    targets = []
    expected_rank = 'genus' if scope_rank == 'family' else 'species'
    for step in steps:
        if not isinstance(step.get('prompt'), str) or not step['prompt'].strip() or len(step['prompt']) > 500:
            raise ValidationError({'graph': 'Cada passo precisa de uma característica.'})
        choices = step.get('choices')
        if not isinstance(choices, list) or not 2 <= len(choices) <= 20:
            raise ValidationError({'graph': 'Cada passo precisa de 2 a 20 alternativas.'})
        for choice in choices:
            if not isinstance(choice, dict) or not isinstance(choice.get('text'), str) or not choice['text'].strip() or len(choice['text']) > 500:
                raise ValidationError({'graph': 'Cada alternativa precisa de texto.'})
            has_next = isinstance(choice.get('next'), str) and bool(choice.get('next'))
            has_taxon = isinstance(choice.get('taxon'), dict)
            if has_next == has_taxon:
                raise ValidationError({'graph': 'Cada alternativa deve levar a um passo ou táxon.'})
            if has_next and choice['next'] not in by_id:
                raise ValidationError({'graph': 'Uma alternativa aponta para um passo inexistente.'})
            if has_taxon:
                taxon = choice['taxon']
                if taxon.get('rank') != expected_rank or type(taxon.get('key')) is not int or taxon['key'] < 1 or not isinstance(taxon.get('name'), str) or not taxon['name'].strip() or len(taxon['name']) > 255:
                    raise ValidationError({'graph': f'O resultado deve ser um táxon do nível {expected_rank}.'})
                targets.append(taxon)
    seen = set()
    visiting = set()

    def visit(step_id):
        if step_id in visiting:
            raise ValidationError({'graph': 'A chave não pode conter ciclos.'})
        if step_id in seen:
            return
        visiting.add(step_id)
        for choice in by_id[step_id]['choices']:
            if choice.get('next'):
                visit(choice['next'])
        visiting.remove(step_id)
        seen.add(step_id)

    visit(graph['start'])
    if len(seen) != len(steps) or not targets:
        raise ValidationError({'graph': 'Todos os passos devem ser alcançáveis e levar a um táxon.'})
    if check_taxa:
        _validate_taxa(targets, scope_rank, scope_key, expected_rank)


def _validate_taxa(targets, scope_rank, scope_key, expected_rank):
    scope = taxon_detail(scope_key)
    if scope.get('rank', '').lower() != scope_rank or scope.get('taxonomicStatus') != 'ACCEPTED':
        raise ValidationError({'scope_gbif_key': 'O grupo deve ser um táxon aceito do nível escolhido.'})
    parent_field = 'familyKey' if scope_rank == 'family' else 'genusKey'
    for target in {row['key']: row for row in targets}.values():
        detail = taxon_detail(target['key'])
        if (detail.get('rank', '').lower() != expected_rank or detail.get(parent_field) != scope_key
                or detail.get('taxonomicStatus') != 'ACCEPTED'
                or (detail.get('canonicalName') or detail.get('scientificName')) != target['name']):
            raise ValidationError({'graph': f'O táxon {target["name"]} não pertence ao grupo da chave.'})


def _validate_multi_access(graph, scope_rank, scope_key, check_taxa):
    descriptors = graph.get('descriptors')
    taxa = graph.get('taxa')
    if not isinstance(descriptors, list) or not isinstance(taxa, list):
        raise ValidationError({'graph': 'Informe descritores e táxons da chave de múltiplo acesso.'})
    if not 1 <= len(descriptors) <= 200 or not 2 <= len(taxa) <= 500:
        raise ValidationError({'graph': 'Use entre 1 e 200 descritores e entre 2 e 500 táxons.'})
    descriptor_ids = []
    states_by_descriptor = {}
    for descriptor in descriptors:
        descriptor_id = descriptor.get('id') if isinstance(descriptor, dict) else None
        label = descriptor.get('label') if isinstance(descriptor, dict) else None
        states = descriptor.get('states') if isinstance(descriptor, dict) else None
        if not isinstance(descriptor_id, str) or not descriptor_id or len(descriptor_id) > 80 or not isinstance(label, str) or not label.strip() or len(label) > 500:
            raise ValidationError({'graph': 'Cada descritor precisa de identificador e texto.'})
        if not isinstance(states, list) or not 2 <= len(states) <= 50:
            raise ValidationError({'graph': 'Cada descritor precisa de 2 a 50 estados.'})
        state_ids = []
        for state in states:
            if (not isinstance(state, dict) or not isinstance(state.get('id'), str) or not state['id']
                    or len(state['id']) > 80 or not isinstance(state.get('label'), str)
                    or not state['label'].strip() or len(state['label']) > 500):
                raise ValidationError({'graph': 'Cada estado precisa de identificador e texto.'})
            state_ids.append(state['id'])
        if len(state_ids) != len(set(state_ids)):
            raise ValidationError({'graph': 'Os estados de um descritor precisam ter identificadores distintos.'})
        descriptor_ids.append(descriptor_id)
        states_by_descriptor[descriptor_id] = set(state_ids)
    if len(descriptor_ids) != len(set(descriptor_ids)):
        raise ValidationError({'graph': 'Os descritores precisam ter identificadores distintos.'})
    expected_rank = 'genus' if scope_rank == 'family' else 'species'
    seen_taxa = set()
    for taxon in taxa:
        if (not isinstance(taxon, dict) or type(taxon.get('key')) is not int or taxon['key'] < 1
                or taxon.get('rank') != expected_rank or not isinstance(taxon.get('name'), str)
                or not taxon['name'].strip() or len(taxon['name']) > 255 or not isinstance(taxon.get('states'), dict)):
            raise ValidationError({'graph': f'Cada resultado deve ser um táxon do nível {expected_rank} com seus estados.'})
        if taxon['key'] in seen_taxa:
            raise ValidationError({'graph': 'Cada táxon deve aparecer uma vez na matriz.'})
        seen_taxa.add(taxon['key'])
        for descriptor_id, state_ids in taxon['states'].items():
            if descriptor_id not in states_by_descriptor or not isinstance(state_ids, list) or not state_ids or not set(state_ids) <= states_by_descriptor[descriptor_id]:
                raise ValidationError({'graph': 'A matriz contém referência a descritor ou estado inexistente.'})
    if check_taxa:
        _validate_taxa(taxa, scope_rank, scope_key, expected_rank)


def current_step(graph, answers):
    if graph.get('type') == 'multi_access':
        state = multi_access_state(graph, answers)
        return state['descriptor'], state['result_taxon']
    by_id = graph_steps(graph)
    step_id = graph['start']
    for answer in answers:
        if answer['step_id'] != step_id:
            raise ValidationError({'answers': 'O percurso salvo não corresponde à chave.'})
        choice = by_id[step_id]['choices'][answer['choice_index']]
        if 'taxon' in choice:
            return None, choice['taxon']
        step_id = choice['next']
    return by_id[step_id], None


def multi_access_state(graph, answers):
    descriptors = {row['id']: row for row in graph['descriptors']}
    selected = {}
    for answer in answers:
        descriptor_id = answer.get('descriptor_id')
        state_ids = answer.get('state_ids')
        if descriptor_id not in descriptors or descriptor_id in selected or not isinstance(state_ids, list) or not state_ids:
            raise ValidationError({'answers': 'O percurso salvo não corresponde à matriz da chave.'})
        valid_states = {row['id'] for row in descriptors[descriptor_id]['states']}
        if not set(state_ids) <= valid_states:
            raise ValidationError({'answers': 'O percurso contém um estado inexistente.'})
        selected[descriptor_id] = set(state_ids)
    remaining = []
    for taxon in graph['taxa']:
        compatible = True
        for descriptor_id, chosen in selected.items():
            known = set(taxon['states'].get(descriptor_id, []))
            if known and not known.intersection(chosen):
                compatible = False
                break
        if compatible:
            remaining.append(taxon)
    unanswered = [row for row in graph['descriptors'] if row['id'] not in selected]
    descriptor = unanswered[0] if len(remaining) > 1 and unanswered else None
    result = remaining[0] if len(remaining) == 1 else None
    return {'descriptor': descriptor, 'result_taxon': result, 'remaining_taxa': remaining,
            'answered_descriptor_ids': list(selected)}
