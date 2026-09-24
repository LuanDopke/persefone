"""Public community keys and private identification runs."""

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from uuid import UUID

from catalog.key_service import current_step, multi_access_state, validate_graph
from catalog.key_sources import (KeySourceError, SourceLicenseError, discover_keys,
    load_external_source, resolve_graph_taxa)
from catalog.models import (IdentificationKey, IdentificationKeyReport, IdentificationKeyRun,
    IdentificationKeyRunRevision, IdentificationKeySuggestion, IdentificationKeyVersion,
    Observation, ObservationEvidence, ObservationHypothesis)


def _uuid(value):
    try:
        return UUID(str(value))
    except (ValueError, TypeError, AttributeError):
        return None


def _public_author(user):
    return user.get_full_name().strip() or user.username.split('@', 1)[0]


def _key_json(key, include_graph=False, published_only=False):
    version = key.versions.filter(number=key.published_version).first() if key.published_version else None
    data = {'id': str(key.pk), 'title': version.title if published_only and version else key.title, 'scope_rank': key.scope_rank,
            'scope_gbif_key': key.scope_gbif_key, 'scope_name': key.scope_name,
            'coverage': version.coverage if published_only and version else key.coverage,
            'source': version.source if published_only and version else key.source, 'author': _public_author(key.author),
            'source_metadata': version.source_metadata if published_only and version else key.source_metadata,
            'key_type': ((version.graph if published_only and version else key.draft_graph) or {}).get('type', 'branching'),
            'published_version': key.published_version,
            'archived': bool(key.archived_at), 'updated_at': key.updated_at}
    if include_graph:
        data['graph'] = version.graph if version else None
        data['version_id'] = str(version.pk) if version else None
        data['draft_graph'] = key.draft_graph
    return data


def _key_for_user(request, key_id, author_only=False):
    key = IdentificationKey.objects.select_related('author').filter(pk=_uuid(key_id)).first()
    if key is None or (author_only and key.author_id != request.user.pk):
        return None
    if key.author_id != request.user.pk and (not key.published_version or key.archived_at):
        return None
    return key


def _key_fields(data, existing=None):
    title = str(data.get('title', existing.title if existing else '')).strip()
    scope_rank = data.get('scope_rank', existing.scope_rank if existing else '')
    scope_key = data.get('scope_gbif_key', existing.scope_gbif_key if existing else None)
    scope_name = str(data.get('scope_name', existing.scope_name if existing else '')).strip()
    coverage = str(data.get('coverage', existing.coverage if existing else '')).strip()
    source = str(data.get('source', existing.source if existing else '')).strip()
    source_metadata = data.get('source_metadata', existing.source_metadata if existing else {})
    graph = data.get('draft_graph', existing.draft_graph if existing else {})
    if (not title or len(title) > 160 or scope_rank not in ('family', 'genus')
            or type(scope_key) is not int or scope_key < 1 or not scope_name or len(scope_name) > 255
            or not coverage or not source or len(source) > 500 or not isinstance(graph, dict)
            or not isinstance(source_metadata, dict)):
        raise ValidationError({'detail': 'Informe título, família ou gênero, abrangência, fonte e um rascunho válido.'})
    if existing and existing.published_version and (scope_rank != existing.scope_rank or scope_key != existing.scope_gbif_key or scope_name != existing.scope_name):
        raise ValidationError({'scope_gbif_key': 'O grupo de uma chave publicada não pode ser alterado.'})
    return dict(title=title, scope_rank=scope_rank, scope_gbif_key=scope_key,
                scope_name=scope_name, coverage=coverage, source=source,
                source_metadata=source_metadata, draft_graph=graph)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def keys(request):
    if request.method == 'POST':
        key = IdentificationKey.objects.create(author=request.user, **_key_fields(request.data))
        return Response(_key_json(key, True), status=201)
    queryset = IdentificationKey.objects.select_related('author')
    if request.query_params.get('mine') == '1':
        queryset = queryset.filter(author=request.user)
    else:
        queryset = queryset.filter(published_version__gt=0, archived_at__isnull=True)
    rank = request.query_params.get('scope_rank')
    taxon_key = request.query_params.get('scope_gbif_key')
    term = request.query_params.get('search', '').strip()[:100]
    if rank:
        if rank not in ('family', 'genus'):
            raise ValidationError({'scope_rank': 'Use family ou genus.'})
        queryset = queryset.filter(scope_rank=rank)
    if taxon_key:
        try:
            queryset = queryset.filter(scope_gbif_key=int(taxon_key))
        except ValueError as exc:
            raise ValidationError({'scope_gbif_key': 'Informe um número.'}) from exc
    if term:
        queryset = queryset.filter(Q(title__icontains=term) | Q(scope_name__icontains=term))
    try:
        page = max(int(request.query_params.get('page', 1)), 1)
    except ValueError as exc:
        raise ValidationError({'page': 'Informe um número.'}) from exc
    count = queryset.count()
    rows = queryset.order_by('-updated_at', '-id')[(page - 1) * 20:page * 20]
    return Response({'count': count, 'next': page + 1 if page * 20 < count else None,
                     'results': [_key_json(item, published_only=not request.query_params.get('mine') == '1') for item in rows]})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def discover_external(request):
    term = request.query_params.get('search', '')
    if len(term.strip()) < 2:
        raise ValidationError({'search': 'Informe ao menos dois caracteres.'})
    return Response(discover_keys(term))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_external(request):
    source_kind = str(request.data.get('source_kind', '')).strip()
    scope_rank = request.data.get('scope_rank')
    try:
        scope_key = int(request.data.get('scope_gbif_key'))
    except (TypeError, ValueError) as exc:
        raise ValidationError({'scope_gbif_key': 'Selecione o grupo taxonômico no GBIF.'}) from exc
    scope_name = str(request.data.get('scope_name', '')).strip()
    if scope_rank not in ('family', 'genus') or not scope_name:
        raise ValidationError({'scope_rank': 'Selecione uma família ou um gênero.'})
    try:
        imported = load_external_source(
            source_kind,
            external_id=request.data.get('external_id'),
            uploaded=request.FILES.get('file'),
            source_url=str(request.data.get('source_url', '')).strip(),
            declared_license=str(request.data.get('license', '')).strip(),
        )
        expected_rank = 'genus' if scope_rank == 'family' else 'species'
        imported['draft_graph'] = resolve_graph_taxa(imported['draft_graph'], expected_rank)
    except SourceLicenseError as exc:
        return Response({'detail': str(exc), 'code': 'license_required'}, status=400)
    except KeySourceError as exc:
        raise ValidationError({'detail': str(exc)}) from exc
    imported.update({
        'scope_rank': scope_rank,
        'scope_gbif_key': scope_key,
        'scope_name': scope_name,
        'coverage': str(request.data.get('coverage', '')).strip() or imported['coverage'],
    })
    key = IdentificationKey.objects.create(author=request.user, **_key_fields(imported))
    return Response(_key_json(key, True), status=201)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def key_detail(request, key_id):
    key = _key_for_user(request, key_id, author_only=request.method == 'PATCH')
    if key is None:
        return Response(status=404)
    if request.method == 'PATCH':
        for field, value in _key_fields(request.data, key).items():
            setattr(key, field, value)
        key.save()
    result = _key_json(key, True, published_only=key.author_id != request.user.pk)
    result['is_author'] = key.author_id == request.user.pk
    if key.author_id != request.user.pk:
        result.pop('draft_graph')
    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def publish_key(request, key_id):
    key = _key_for_user(request, key_id, author_only=True)
    if key is None:
        return Response(status=404)
    draft_graph = key.draft_graph
    validate_graph(draft_graph, key.scope_rank, key.scope_gbif_key, check_taxa=True)
    with transaction.atomic():
        key = IdentificationKey.objects.select_for_update().get(pk=key.pk)
        if key.draft_graph != draft_graph:
            return Response({'detail': 'O rascunho mudou. Revise a chave antes de publicar.'}, status=409)
        number = key.published_version + 1
        IdentificationKeyVersion.objects.create(key=key, number=number, graph=draft_graph,
            title=key.title, coverage=key.coverage, source=key.source,
            source_metadata=key.source_metadata)
        key.published_version = number
        key.archived_at = None
        key.save(update_fields=['published_version', 'archived_at', 'updated_at'])
    return Response(_key_json(key, True))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def archive_key(request, key_id):
    key = _key_for_user(request, key_id)
    if key is None or (key.author_id != request.user.pk and not request.user.is_staff):
        return Response(status=404)
    key.archived_at = timezone.now()
    key.save(update_fields=['archived_at', 'updated_at'])
    return Response(_key_json(key))


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def suggestions(request, key_id):
    key = _key_for_user(request, key_id)
    if key is None:
        return Response(status=404)
    if request.method == 'GET':
        if key.author_id != request.user.pk:
            return Response(status=404)
        base_graphs = {version.number: version.graph for version in key.versions.all()}
        return Response([{'id': str(row.pk), 'author': _public_author(row.author), 'base_version': row.base_version,
                          'base_graph': base_graphs.get(row.base_version),
                          'graph': row.graph, 'note': row.note, 'status': row.status, 'created_at': row.created_at}
                         for row in key.suggestions.select_related('author').all()])
    if key.author_id == request.user.pk or not key.published_version or key.archived_at:
        raise ValidationError({'detail': 'Selecione uma chave pública de outro autor.'})
    graph = request.data.get('graph')
    validate_graph(graph, key.scope_rank, key.scope_gbif_key)
    note = request.data.get('note', '')
    if not isinstance(note, str) or len(note) > 2000:
        raise ValidationError({'note': 'Informe uma nota de até 2000 caracteres.'})
    row = IdentificationKeySuggestion.objects.create(key=key, author=request.user,
        base_version=key.published_version, graph=graph, note=note.strip())
    return Response({'id': str(row.pk), 'status': row.status}, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decide_suggestion(request, key_id, suggestion_id):
    key = _key_for_user(request, key_id, author_only=True)
    if key is None:
        return Response(status=404)
    suggestion = key.suggestions.filter(pk=_uuid(suggestion_id)).first()
    if suggestion is None:
        return Response(status=404)
    decision = request.data.get('decision')
    if decision not in ('accepted', 'rejected') or suggestion.status != 'pending':
        raise ValidationError({'decision': 'Escolha uma sugestão pendente para aceitar ou rejeitar.'})
    if decision == 'accepted':
        if suggestion.base_version != key.published_version:
            return Response({'detail': 'A chave mudou. Solicite uma sugestão para a versão atual.'}, status=409)
        published = key.versions.get(number=key.published_version)
        if (key.draft_graph != published.graph or key.title != published.title
                or key.coverage != published.coverage or key.source != published.source):
            return Response({'detail': 'Publique ou descarte seu rascunho antes de aceitar a sugestão.'}, status=409)
        validate_graph(suggestion.graph, key.scope_rank, key.scope_gbif_key, check_taxa=True)
    with transaction.atomic():
        key = IdentificationKey.objects.select_for_update().get(pk=key.pk)
        suggestion = IdentificationKeySuggestion.objects.select_for_update().get(pk=suggestion.pk)
        if suggestion.status != 'pending':
            return Response({'detail': 'A sugestão já foi decidida.'}, status=409)
        if decision == 'accepted':
            if suggestion.base_version != key.published_version:
                return Response({'detail': 'A chave mudou. Solicite uma sugestão para a versão atual.'}, status=409)
            published = key.versions.get(number=key.published_version)
            if (key.draft_graph != published.graph or key.title != published.title
                    or key.coverage != published.coverage or key.source != published.source):
                return Response({'detail': 'Publique ou descarte seu rascunho antes de aceitar a sugestão.'}, status=409)
            number = key.published_version + 1
            current_version = key.versions.get(number=key.published_version)
            IdentificationKeyVersion.objects.create(key=key, number=number, graph=suggestion.graph,
                title=current_version.title, coverage=current_version.coverage, source=current_version.source,
                source_metadata=current_version.source_metadata)
            key.draft_graph = suggestion.graph
            key.published_version = number
            key.save(update_fields=['draft_graph', 'published_version', 'updated_at'])
        suggestion.status = decision
        suggestion.decided_at = timezone.now()
        suggestion.save(update_fields=['status', 'decided_at'])
    return Response({'id': str(suggestion.pk), 'status': decision, 'published_version': key.published_version})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_key(request, key_id):
    key = _key_for_user(request, key_id)
    if key is None or not key.published_version:
        return Response(status=404)
    reason = request.data.get('reason')
    if not isinstance(reason, str) or not 5 <= len(reason.strip()) <= 2000:
        raise ValidationError({'reason': 'Descreva o problema em 5 a 2000 caracteres.'})
    IdentificationKeyReport.objects.create(key=key, author=request.user, reason=reason.strip())
    return Response({'detail': 'Relato registrado.'}, status=201)


def _observation(request, observation_id):
    return Observation.objects.filter(pk=_uuid(observation_id), owner=request.user).first()


def _run_json(run):
    graph = run.version.graph
    if graph.get('type') == 'multi_access':
        matrix = multi_access_state(graph, run.answers)
        step, taxon = matrix['descriptor'], matrix['result_taxon']
        remaining = [{'key': row['key'], 'rank': row['rank'], 'name': row['name']}
                     for row in matrix['remaining_taxa']]
    else:
        step, taxon = current_step(graph, run.answers)
        remaining = None
    return {'id': str(run.pk), 'key_id': str(run.version.key_id), 'key_title': run.version.title,
            'version_id': str(run.version_id), 'version_number': run.version.number,
            'graph': graph, 'key_type': graph.get('type', 'branching'),
            'scope_rank': run.version.key.scope_rank, 'scope_name': run.version.key.scope_name,
            'status': run.status, 'answers': run.answers, 'pending_note': run.pending_note,
            'step': step, 'remaining_taxa': remaining, 'result_taxon': run.result_taxon or taxon,
            'result_hypothesis': str(run.result_hypothesis_id) if run.result_hypothesis_id else None,
            'parent_run': str(run.parent_run_id) if run.parent_run_id else None,
            'revisions': [{'id': str(row.pk), 'before': row.before, 'after': row.after, 'created_at': row.created_at}
                          for row in run.revisions.all()]}


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def observation_runs(request, observation_id):
    observation = _observation(request, observation_id)
    if observation is None:
        return Response(status=404)
    if request.method == 'GET':
        rows = observation.key_runs.select_related('version__key', 'result_hypothesis').prefetch_related('revisions')
        return Response([_run_json(row) for row in rows])
    version = IdentificationKeyVersion.objects.select_related('key').filter(pk=_uuid(request.data.get('version_id'))).first()
    if version is None or version.key.archived_at or version.key.published_version != version.number:
        raise ValidationError({'version_id': 'Selecione a versão pública atual da chave.'})
    parent_id = request.data.get('parent_run')
    parent = observation.key_runs.filter(pk=_uuid(parent_id), status='completed').first() if parent_id else None
    if parent_id and (not parent or not parent.result_taxon or parent.result_taxon['rank'] != 'genus'
                      or version.key.scope_rank != 'genus' or version.key.scope_gbif_key != parent.result_taxon['key']):
        raise ValidationError({'parent_run': 'A chave escolhida não continua o gênero encontrado.'})
    run = IdentificationKeyRun.objects.create(observation=observation, version=version, parent_run=parent)
    observation.save(update_fields=['updated_at'])
    return Response(_run_json(run), status=201)


@api_view(['POST', 'PATCH'])
@permission_classes([IsAuthenticated])
def run_answers(request, observation_id, run_id):
    observation = _observation(request, observation_id)
    if observation is None:
        return Response(status=404)
    run = observation.key_runs.select_related('version__key').filter(pk=_uuid(run_id)).first()
    if run is None:
        return Response(status=404)
    if run.status == 'superseded':
        raise ValidationError({'detail': 'Este percurso foi substituído após a correção de uma resposta anterior.'})
    index = request.data.get('index', len(run.answers))
    if type(index) is not int or index < 0 or index > len(run.answers) or (request.method == 'POST' and index != len(run.answers)) or (request.method == 'PATCH' and index == len(run.answers)):
        raise ValidationError({'index': 'Escolha uma resposta existente ou o próximo passo.'})
    if run.status == 'completed' and request.method == 'POST':
        return Response(_run_json(run))
    if run.version.graph.get('type') == 'multi_access':
        return _multi_access_answer(request, observation, run, index)
    prefix = run.answers[:index]
    step, result = current_step(run.version.graph, prefix)
    if result or not step or request.data.get('step_id') != step['id']:
        raise ValidationError({'step_id': 'O passo não corresponde ao percurso.'})
    choice_index = request.data.get('choice_index')
    if choice_index is not None and (type(choice_index) is not int or not 0 <= choice_index < len(step['choices'])):
        raise ValidationError({'choice_index': 'Escolha uma alternativa disponível.'})
    if choice_index is None and request.method == 'PATCH':
        raise ValidationError({'choice_index': 'Escolha uma alternativa para corrigir.'})
    evidence_id = request.data.get('evidence_id')
    evidence = ObservationEvidence.objects.filter(pk=_uuid(evidence_id), observation=observation).first() if evidence_id else None
    if evidence_id and evidence is None:
        raise ValidationError({'evidence_id': 'Selecione uma evidência desta observação.'})
    note = request.data.get('note', '')
    if not isinstance(note, str) or len(note) > 2000:
        raise ValidationError({'note': 'Informe uma nota de até 2000 caracteres.'})
    if choice_index is None:
        run.status = 'paused'
        run.pending_note = note.strip()
        run.save(update_fields=['status', 'pending_note', 'updated_at'])
        observation.save(update_fields=['updated_at'])
        return Response(_run_json(run))
    answer = {'step_id': step['id'], 'choice_index': choice_index,
              'evidence_id': str(evidence.pk) if evidence else None, 'note': note.strip()}
    path_changed = request.method == 'PATCH' and choice_index != run.answers[index]['choice_index']
    new_answers = prefix + [answer] + (run.answers[index + 1:] if request.method == 'PATCH' and not path_changed else [])
    _, terminal = current_step(run.version.graph, new_answers)
    before = {'answers': run.answers, 'result_taxon': run.result_taxon}
    with transaction.atomic():
        run = IdentificationKeyRun.objects.select_for_update().get(pk=run.pk)
        if run.answers != before['answers']:
            return Response({'detail': 'O percurso mudou. Atualize a ficha antes de responder.'}, status=409)
        descendants = []
        frontier = [run.pk] if path_changed else []
        while frontier:
            children = list(IdentificationKeyRun.objects.filter(parent_run_id__in=frontier).exclude(status='superseded'))
            descendants.extend(children)
            frontier = [child.pk for child in children]
        affected = [run, *descendants]
        if path_changed and any(observation.confirmed_hypothesis_id == item.result_hypothesis_id for item in affected if item.result_hypothesis_id):
            raise ValidationError({'detail': 'Reabra a identificação antes de corrigir este percurso.'})
        for child in descendants:
            if child.result_hypothesis_id and child.created_hypothesis and not IdentificationKeyRun.objects.filter(result_hypothesis_id=child.result_hypothesis_id, status='completed').exclude(pk=child.pk).exists():
                child.result_hypothesis.discarded_at = timezone.now()
                child.result_hypothesis.save(update_fields=['discarded_at'])
            child.status = 'superseded'
            child.save(update_fields=['status', 'updated_at'])
        if path_changed and run.result_hypothesis_id and run.created_hypothesis:
            if not IdentificationKeyRun.objects.filter(result_hypothesis_id=run.result_hypothesis_id, status='completed').exclude(pk=run.pk).exists():
                run.result_hypothesis.discarded_at = timezone.now()
                run.result_hypothesis.save(update_fields=['discarded_at'])
        run.answers = new_answers
        if request.method == 'POST' or path_changed:
            run.pending_note = ''
            run.status = 'completed' if terminal else 'active'
            run.result_taxon = terminal
            run.result_hypothesis = None
            run.created_hypothesis = False
        if terminal and (request.method == 'POST' or path_changed):
            hypothesis = observation.hypotheses.filter(source='catalog', gbif_key=terminal['key'], discarded_at__isnull=True).first()
            if hypothesis is None:
                hypothesis = ObservationHypothesis.objects.create(observation=observation, source='catalog',
                    rank=terminal['rank'], gbif_key=terminal['key'], name=terminal['name'],
                    notes=f'Resultado da chave {run.version.title}, versão {run.version.number}.')
                run.created_hypothesis = True
            run.result_hypothesis = hypothesis
        run.save()
        if request.method == 'PATCH':
            IdentificationKeyRunRevision.objects.create(run=run, before=before,
                after={'answers': new_answers, 'result_taxon': terminal})
        observation.save(update_fields=['updated_at'])
    return Response(_run_json(run))


def _multi_access_answer(request, observation, run, index):
    prefix = run.answers[:index]
    state = multi_access_state(run.version.graph, prefix)
    descriptor = state['descriptor']
    if state['result_taxon'] or descriptor is None or request.data.get('descriptor_id') != descriptor['id']:
        raise ValidationError({'descriptor_id': 'O descritor não corresponde ao percurso.'})
    state_ids = request.data.get('state_ids')
    if state_ids is not None and (not isinstance(state_ids, list) or not state_ids
            or not all(isinstance(value, str) for value in state_ids)):
        raise ValidationError({'state_ids': 'Escolha ao menos um estado do descritor.'})
    if state_ids is None and request.method == 'PATCH':
        raise ValidationError({'state_ids': 'Escolha um estado para corrigir.'})
    evidence_id = request.data.get('evidence_id')
    evidence = ObservationEvidence.objects.filter(pk=_uuid(evidence_id), observation=observation).first() if evidence_id else None
    if evidence_id and evidence is None:
        raise ValidationError({'evidence_id': 'Selecione uma evidência desta observação.'})
    note = request.data.get('note', '')
    if not isinstance(note, str) or len(note) > 2000:
        raise ValidationError({'note': 'Informe uma nota de até 2000 caracteres.'})
    if state_ids is None:
        run.status = 'paused'
        run.pending_note = note.strip()
        run.save(update_fields=['status', 'pending_note', 'updated_at'])
        observation.save(update_fields=['updated_at'])
        return Response(_run_json(run))
    valid_states = {row['id'] for row in descriptor['states']}
    if not set(state_ids) <= valid_states:
        raise ValidationError({'state_ids': 'O descritor não contém um dos estados escolhidos.'})
    answer = {'descriptor_id': descriptor['id'], 'state_ids': list(dict.fromkeys(state_ids)),
              'evidence_id': str(evidence.pk) if evidence else None, 'note': note.strip()}
    old_answer = run.answers[index] if index < len(run.answers) else None
    path_changed = request.method == 'PATCH' and (
        old_answer.get('descriptor_id') != answer['descriptor_id']
        or old_answer.get('state_ids') != answer['state_ids']
    )
    new_answers = prefix + [answer] + (run.answers[index + 1:] if request.method == 'PATCH' and not path_changed else [])
    terminal = multi_access_state(run.version.graph, new_answers)['result_taxon']
    before = {'answers': run.answers, 'result_taxon': run.result_taxon}
    with transaction.atomic():
        run = IdentificationKeyRun.objects.select_for_update().get(pk=run.pk)
        if run.answers != before['answers']:
            return Response({'detail': 'O percurso mudou. Atualize a ficha antes de responder.'}, status=409)
        descendants = []
        frontier = [run.pk] if path_changed else []
        while frontier:
            children = list(IdentificationKeyRun.objects.filter(parent_run_id__in=frontier).exclude(status='superseded'))
            descendants.extend(children)
            frontier = [child.pk for child in children]
        affected = [run, *descendants]
        if path_changed and any(observation.confirmed_hypothesis_id == item.result_hypothesis_id for item in affected if item.result_hypothesis_id):
            raise ValidationError({'detail': 'Reabra a identificação antes de corrigir este percurso.'})
        for child in descendants:
            if child.result_hypothesis_id and child.created_hypothesis and not IdentificationKeyRun.objects.filter(result_hypothesis_id=child.result_hypothesis_id, status='completed').exclude(pk=child.pk).exists():
                child.result_hypothesis.discarded_at = timezone.now()
                child.result_hypothesis.save(update_fields=['discarded_at'])
            child.status = 'superseded'
            child.save(update_fields=['status', 'updated_at'])
        if path_changed and run.result_hypothesis_id and run.created_hypothesis:
            if not IdentificationKeyRun.objects.filter(result_hypothesis_id=run.result_hypothesis_id, status='completed').exclude(pk=run.pk).exists():
                run.result_hypothesis.discarded_at = timezone.now()
                run.result_hypothesis.save(update_fields=['discarded_at'])
        run.answers = new_answers
        if request.method == 'POST' or path_changed:
            run.pending_note = ''
            run.status = 'completed' if terminal else 'active'
            run.result_taxon = terminal
            run.result_hypothesis = None
            run.created_hypothesis = False
        if terminal and (request.method == 'POST' or path_changed):
            hypothesis = observation.hypotheses.filter(source='catalog', gbif_key=terminal['key'], discarded_at__isnull=True).first()
            if hypothesis is None:
                hypothesis = ObservationHypothesis.objects.create(observation=observation, source='catalog',
                    rank=terminal['rank'], gbif_key=terminal['key'], name=terminal['name'],
                    notes=f'Resultado da chave {run.version.title}, versão {run.version.number}.')
                run.created_hypothesis = True
            run.result_hypothesis = hypothesis
        run.save()
        if request.method == 'PATCH':
            IdentificationKeyRunRevision.objects.create(run=run, before=before,
                after={'answers': new_answers, 'result_taxon': terminal})
        observation.save(update_fields=['updated_at'])
    return Response(_run_json(run))
