"""API views for Species catalog and GBIF search."""

from django.db import IntegrityError, transaction
from django.db.models import Q
from uuid import UUID
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.utils import timezone
from catalog.models import Observation, ObservationEvidence, ObservationHypothesis, ObservationIdentificationEvent, ObservationRevision, Species
from catalog.serializers import (ObservationSerializer, ObservationEvidenceSerializer,
    ObservationHypothesisSerializer, ObservationListSerializer, SpeciesSerializer, SpeciesListSerializer, LocalSpeciesCreateSerializer)
from catalog.services import (GBIFServiceError, browse_gbif_taxa, get_gbif_taxon_profile,
    get_species_by_gbif_key, search_gbif_species)


class SpeciesViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for cached species catalog."""

    queryset = Species.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['scientific_name', 'common_name', 'genus', 'family']
    ordering_fields = ['scientific_name', 'family']

    def get_serializer_class(self):
        if self.action == 'list':
            return SpeciesListSerializer
        return SpeciesSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        is_owned = self.request.query_params.get('is_owned')
        if is_owned is not None:
            if is_owned.lower() in ('true', '1'):
                qs = qs.filter(specimens__owner=self.request.user).distinct()
            elif is_owned.lower() in ('false', '0'):
                qs = qs.exclude(specimens__owner=self.request.user)
        return qs


class ObservationViewSet(viewsets.ModelViewSet):
    serializer_class = ObservationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_serializer_class(self):
        return ObservationListSerializer if self.action == 'list' else ObservationSerializer

    def list(self, request, *args, **kwargs):
        if request.query_params.get('status', '') not in ('', 'pending', 'confirmed'):
            return Response({'status': 'Use pending ou confirmed.'}, status=400)
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        queryset = Observation.objects.filter(owner=self.request.user)
        if self.action == 'list':
            term = self.request.query_params.get('search', '').strip()[:100]
            if term:
                queryset = queryset.filter(Q(title__icontains=term) | Q(species__scientific_name__icontains=term) | Q(hypotheses__name__icontains=term)).distinct()
            state = self.request.query_params.get('status')
            if state == 'pending':
                queryset = queryset.filter(species__isnull=True)
            elif state == 'confirmed':
                queryset = queryset.filter(species__isnull=False)
            queryset = queryset.order_by('-updated_at', '-created_at', '-id')
        if self.action == 'list':
            return queryset.select_related('species').prefetch_related('evidence', 'hypotheses')
        return (queryset
                .select_related('species', 'confirmed_hypothesis')
                .prefetch_related('evidence__revisions', 'hypotheses__revisions', 'identification_events'))

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def _hypothesis(self, observation, raw_id):
        try:
            return observation.hypotheses.filter(pk=UUID(str(raw_id))).first()
        except (ValueError, TypeError, AttributeError):
            return None

    def _evidence(self, observation, raw_id):
        try:
            return observation.evidence.filter(pk=UUID(str(raw_id))).first()
        except (ValueError, TypeError, AttributeError):
            return None

    @staticmethod
    def _evidence_state(item):
        return {
            'notes': item.notes,
            'subject': item.subject,
            'observed_at': item.observed_at.isoformat(),
            'latitude': str(item.latitude) if item.latitude is not None else None,
            'longitude': str(item.longitude) if item.longitude is not None else None,
        }

    @staticmethod
    def _hypothesis_state(item):
        return {'notes': item.notes, 'discarded_at': item.discarded_at.isoformat() if item.discarded_at else None}

    @action(detail=True, methods=['post'])
    def evidence(self, request, pk=None):
        observation = self.get_object()
        serializer = ObservationEvidenceSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        evidence = serializer.save(observation=observation)
        observation.save(update_fields=['updated_at'])
        return Response(ObservationEvidenceSerializer(evidence, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path=r'evidence/(?P<evidence_id>[^/.]+)')
    def evidence_detail(self, request, pk=None, evidence_id=None):
        observation = self.get_object()
        evidence = self._evidence(observation, evidence_id)
        if evidence is None:
            return Response(status=404)
        allowed = {'notes', 'subject', 'observed_at', 'latitude', 'longitude'}
        if not request.data or set(request.data) - allowed:
            return Response({'detail': 'Corrija apenas nota, data, indivíduo ou localização.'}, status=400)
        serializer = ObservationEvidenceSerializer(evidence, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        before = self._evidence_state(evidence)
        with transaction.atomic():
            evidence = serializer.save()
            after = self._evidence_state(evidence)
            if before != after:
                ObservationRevision.objects.create(observation=observation, evidence=evidence, before=before, after=after)
                observation.save(update_fields=['updated_at'])
        updated = ObservationEvidence.objects.get(pk=evidence.pk)
        return Response(ObservationEvidenceSerializer(updated, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def hypotheses(self, request, pk=None):
        observation = self.get_object()
        serializer = ObservationHypothesisSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        hypothesis = serializer.save(observation=observation)
        observation.save(update_fields=['updated_at'])
        return Response(ObservationHypothesisSerializer(hypothesis).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path=r'hypotheses/(?P<hypothesis_id>[^/.]+)')
    def hypothesis_status(self, request, pk=None, hypothesis_id=None):
        observation = self.get_object()
        hypothesis = self._hypothesis(observation, hypothesis_id)
        if hypothesis is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        allowed = {'status', 'notes'}
        if not request.data or set(request.data) - allowed:
            return Response({'detail': 'Corrija apenas a justificativa ou o estado.'}, status=400)
        if 'status' in request.data and str(observation.confirmed_hypothesis_id) == str(hypothesis.pk):
            return Response({'status': 'Reabra a identificação antes de descartar a hipótese confirmada.'}, status=400)
        if 'status' in request.data and request.data['status'] not in ('active', 'discarded'):
            return Response({'status': 'Use active ou discarded.'}, status=400)
        if 'notes' in request.data and not isinstance(request.data['notes'], str):
            return Response({'notes': 'Informe uma justificativa em texto.'}, status=400)
        before = self._hypothesis_state(hypothesis)
        changed_fields = []
        if 'status' in request.data:
            hypothesis.discarded_at = timezone.now() if request.data['status'] == 'discarded' else None
            changed_fields.append('discarded_at')
        if 'notes' in request.data:
            hypothesis.notes = request.data['notes'].strip()
            changed_fields.append('notes')
        with transaction.atomic():
            hypothesis.save(update_fields=changed_fields)
            after = self._hypothesis_state(hypothesis)
            if before != after:
                ObservationRevision.objects.create(observation=observation, hypothesis=hypothesis, before=before, after=after)
                observation.save(update_fields=['updated_at'])
        updated = ObservationHypothesis.objects.get(pk=hypothesis.pk)
        return Response(ObservationHypothesisSerializer(updated).data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        observation = self.get_object()
        hypothesis = self._hypothesis(observation, request.data.get('hypothesis_id'))
        if not hypothesis or hypothesis.discarded_at:
            return Response({'hypothesis_id': 'Selecione uma hipótese ativa desta observação.'}, status=400)
        if hypothesis.source != 'catalog' or hypothesis.rank != 'species':
            return Response({'hypothesis_id': 'Selecione uma espécie do catálogo.'}, status=400)
        species = hypothesis.species
        if species is None:
            if not hypothesis.gbif_key:
                return Response({'hypothesis_id': 'Selecione uma espécie do catálogo.'}, status=400)
            try:
                profile = get_gbif_taxon_profile(hypothesis.gbif_key)
            except GBIFServiceError:
                return Response({'hypothesis_id': 'O catálogo está indisponível. Tente novamente.'}, status=503)
            if profile.get('taxon', {}).get('rank', '').lower() != 'species':
                return Response({'hypothesis_id': 'O táxon selecionado não é uma espécie.'}, status=400)
            species = get_species_by_gbif_key(hypothesis.gbif_key)
            if species is None:
                return Response({'hypothesis_id': 'Não foi possível consultar a espécie.'}, status=503)
        elif len(species.scientific_name.split()) < 2 or species.scientific_name.lower().endswith((' sp.', ' spp.')):
            return Response({'hypothesis_id': 'Selecione uma espécie, não apenas um gênero.'}, status=400)
        notes = request.data.get('notes', '')
        if not isinstance(notes, str):
            return Response({'notes': 'Informe uma nota em texto.'}, status=400)
        with transaction.atomic():
            observation = Observation.objects.select_for_update().get(pk=observation.pk)
            if observation.species_id:
                return Response({'hypothesis_id': 'Reabra a identificação antes de confirmar outra espécie.'}, status=400)
            if hypothesis.species_id is None:
                hypothesis.species = species
                hypothesis.name = species.scientific_name
                hypothesis.save(update_fields=['species', 'name'])
            observation.species = species
            observation.confirmed_hypothesis = hypothesis
            observation.save(update_fields=['species', 'confirmed_hypothesis', 'updated_at'])
            ObservationIdentificationEvent.objects.create(observation=observation,
                hypothesis=hypothesis, action='confirm', notes=notes.strip())
        return Response(ObservationSerializer(observation, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        observation = self.get_object()
        notes = request.data.get('notes', '')
        if not isinstance(notes, str):
            return Response({'notes': 'Informe uma nota em texto.'}, status=400)
        with transaction.atomic():
            observation = Observation.objects.select_for_update().get(pk=observation.pk)
            if not observation.species_id:
                return Response({'status': 'A identificação já está aberta.'}, status=400)
            former = observation.confirmed_hypothesis
            ObservationIdentificationEvent.objects.create(observation=observation,
                hypothesis=former, action='reopen', notes=notes.strip())
            observation.species = None
            observation.confirmed_hypothesis = None
            observation.save(update_fields=['species', 'confirmed_hypothesis', 'updated_at'])
        return Response(ObservationSerializer(observation, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def browse_taxonomy(request):
    rank = request.query_params.get('rank', 'order').upper()
    parent_key = request.query_params.get('parent_key')
    query = request.query_params.get('q', '').strip()
    try:
        parent_key = int(parent_key) if parent_key else None
        limit = int(request.query_params.get('limit', 24))
        offset = int(request.query_params.get('offset', 0))
        if query and len(query) < 2:
            raise ValueError
        data = browse_gbif_taxa(rank, parent_key=parent_key, limit=limit, offset=offset, query=query)
    except (TypeError, ValueError):
        return Response({'error': 'Parâmetros taxonômicos inválidos.'}, status=status.HTTP_400_BAD_REQUEST)
    except GBIFServiceError:
        return Response({'error': 'O catálogo taxonômico está temporariamente indisponível.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def taxonomy_profile(request, taxon_key):
    try:
        return Response(get_gbif_taxon_profile(taxon_key))
    except GBIFServiceError:
        return Response({'error': 'O perfil taxonômico está temporariamente indisponível.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_gbif(request):
    """Search GBIF API for a species by name, caching results locally."""
    name = request.query_params.get('name', '').strip()
    if not name:
        return Response(
            {'error': 'Query parameter "name" is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    species = search_gbif_species(name)
    if species is None:
        return Response(
            {'error': f'No species found matching "{name}".'},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = SpeciesSerializer(species)
    return Response(serializer.data)


def get_or_create_local_species(values):
    normalized_name = values['normalized_name']
    existing = Species.objects.filter(normalized_name=normalized_name).first()
    if existing is not None:
        return existing, False
    try:
        with transaction.atomic():
            return Species.objects.create(
                scientific_name=values['scientific_name'],
                genus=values['genus'],
            ), True
    except IntegrityError:
        return Species.objects.get(normalized_name=normalized_name), False


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_local_species(request):
    serializer = LocalSpeciesCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    species, created = get_or_create_local_species(serializer.validated_species_values())
    data = dict(SpeciesListSerializer(species, context={'request': request}).data)
    data['created'] = created
    return Response(data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
