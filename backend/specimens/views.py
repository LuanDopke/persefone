"""API views for Specimen and CareLog."""

import uuid

from django.db import transaction
from django.db.models import Prefetch
from rest_framework import viewsets, filters, status
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from specimens.models import Specimen, CareLog, VisualEntry
from catalog.models import Species
from specimens.serializers import (
    SpecimenListSerializer,
    SpecimenDetailSerializer,
    SpecimenCreateSerializer,
    CareLogSerializer,
    CollectionSpeciesSerializer,
    VisualEntrySerializer,
    VisualEntryCreateSerializer,
    SpecimenUpdateSerializer,
)


class SpecimenConflict(Exception):
    pass


class CollectionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 50


def _is_true(value):
    return str(value).lower() in {'1', 'true', 'yes'}


def _collection_item(species):
    """Build the API read model without persisting an aggregate table."""
    specimens = list(species.collection_specimens)
    active = [specimen for specimen in specimens if specimen.is_active]
    relevant = active or specimens
    representative = relevant[0] if relevant else None
    total = len(active)

    def indicator(criterion):
        affected = sum(1 for specimen in active if criterion(specimen))
        return {
            'needs_attention': affected > 0,
            'affected_count': affected,
            'total_count': total,
        }

    care_metadata = species.native_region.get('care', {}) if isinstance(species.native_region, dict) else {}
    image = None
    for specimen in relevant:
        first_visual = next(iter(specimen.visual_entries.all()), None)
        if first_visual is not None:
            image = first_visual.image.url
            break
        if specimen.photo:
            image = specimen.photo
            break
    return {
        'species_id': species.id,
        'specimen_id': str(representative.id) if representative else None,
        'common_name': species.common_name,
        'scientific_name': species.scientific_name,
        'image_url': image,
        'specimen_count': total,
        'is_archived': not bool(active),
        'is_favorite': species.is_collection_favorite,
        'care': {
            'water': indicator(lambda specimen: specimen.soil_moisture <= 30),
            'nutrients': indicator(lambda specimen: specimen.vitality_index <= 30),
            'light': indicator(lambda specimen: specimen.lux_intensity <= 300),
        },
        'care_reference': {
            'light': care_metadata.get('light'),
            'water': care_metadata.get('water'),
        },
    }


class SpecimenViewSet(viewsets.ModelViewSet):
    """CRUD operations for user plant specimens."""

    queryset = Specimen.objects.select_related('species').all()
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nickname', 'species__scientific_name', 'species__common_name']
    ordering_fields = ['acquired_at', 'vitality_index', 'nickname']

    def get_serializer_class(self):
        if self.action == 'create':
            return SpecimenCreateSerializer
        if self.action == 'list':
            return SpecimenListSerializer
        if self.action in ('update', 'partial_update'):
            return SpecimenUpdateSerializer
        return SpecimenDetailSerializer

    def get_queryset(self):
        return super().get_queryset().filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        expected = serializer.validated_data.get('expected_updated_at')
        with transaction.atomic():
            locked = self.get_queryset().select_for_update().get(pk=serializer.instance.pk)
            if expected is not None and locked.updated_at != expected:
                error = ValidationError({'detail': 'O exemplar foi alterado em outra sessão.', 'updated_at': locked.updated_at})
                error.status_code = 409
                raise error
            serializer.instance = locked
            serializer.save()

    @action(detail=False, methods=['get'], url_path='collection')
    def collection(self, request):
        """Return a paginated, species-level projection of the collection."""
        species_queryset = (
            Species.objects
            .filter(specimens__owner=request.user)
            .distinct()
            .prefetch_related(Prefetch('specimens', queryset=Specimen.objects.filter(owner=request.user).prefetch_related('visual_entries'), to_attr='collection_specimens'))
        )
        items = [_collection_item(species) for species in species_queryset]
        search = request.query_params.get('search', '').strip().casefold()
        if search:
            items = [item for item in items if search in item['common_name'].casefold() or search in item['scientific_name'].casefold()]
        if _is_true(request.query_params.get('attention')):
            items = [item for item in items if any(value['needs_attention'] for value in item['care'].values())]
        if _is_true(request.query_params.get('favorite')):
            items = [item for item in items if item['is_favorite']]
        for care_name in ('water', 'light'):
            if _is_true(request.query_params.get(care_name)):
                items = [item for item in items if item['care'][care_name]['needs_attention']]
        if 'archived' in request.query_params:
            archived = _is_true(request.query_params.get('archived'))
            items = [item for item in items if item['is_archived'] is archived]
        items.sort(key=lambda item: (item['is_archived'], item['scientific_name'].casefold()))
        paginator = CollectionPagination()
        page = paginator.paginate_queryset(items, request)
        serializer = CollectionSpeciesSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @action(detail=False, methods=['patch'], url_path=r'collection/(?P<species_id>[^/.]+)/favorite')
    def collection_favorite(self, request, species_id=None):
        favorite = request.data.get('is_favorite')
        if not isinstance(favorite, bool):
            return Response({'is_favorite': ['This field must be a boolean.']}, status=status.HTTP_400_BAD_REQUEST)
        species = Species.objects.filter(pk=species_id, specimens__owner=request.user).distinct().first()
        if species is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        species.is_collection_favorite = favorite
        species.save(update_fields=['is_collection_favorite'])
        species = Species.objects.prefetch_related(Prefetch('specimens', queryset=Specimen.objects.filter(owner=request.user).prefetch_related('visual_entries'), to_attr='collection_specimens')).get(pk=species.pk)
        return Response(CollectionSpeciesSerializer(_collection_item(species)).data)


class CareLogViewSet(viewsets.ModelViewSet):
    """CRUD operations for care log entries."""

    queryset = CareLog.objects.select_related('specimen').all()
    serializer_class = CareLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['occurred_at', 'created_at']
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset().filter(specimen__owner=self.request.user)
        specimen_id = self.request.query_params.get('specimen_id')
        if not specimen_id:
            raise ValidationError({'specimen_id': ['Este filtro é obrigatório.']})
        try:
            uuid.UUID(str(specimen_id))
        except (ValueError, AttributeError, TypeError):
            raise ValidationError({'specimen_id': ['UUID inválido.']})
        scoped = Specimen.objects.filter(pk=specimen_id, owner=self.request.user).exists()
        if not scoped:
            raise NotFound('Exemplar não encontrado.')
        qs = qs.filter(specimen_id=specimen_id)
        return qs

    def perform_create(self, serializer):
        specimen = serializer.validated_data['specimen']
        if specimen.owner_id != self.request.user.id:
            raise ValidationError({'specimen': ['Exemplar não encontrado.']})
        serializer.save()


class VisualEntryViewSet(viewsets.ModelViewSet):
    queryset = VisualEntry.objects.select_related('specimen').all()
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_serializer_class(self):
        return VisualEntryCreateSerializer if self.action == 'create' else VisualEntrySerializer

    def get_queryset(self):
        qs = super().get_queryset().filter(specimen__owner=self.request.user)
        specimen_id = self.request.query_params.get('specimen_id')
        if not specimen_id:
            raise ValidationError({'specimen_id': ['Este filtro é obrigatório.']})
        try:
            uuid.UUID(str(specimen_id))
        except (ValueError, AttributeError, TypeError):
            raise ValidationError({'specimen_id': ['UUID inválido.']})
        if not Specimen.objects.filter(pk=specimen_id, owner=self.request.user).exists():
            raise NotFound('Exemplar não encontrado.')
        return qs.filter(specimen_id=specimen_id)

    def perform_create(self, serializer):
        specimen = serializer.validated_data['specimen']
        if specimen.owner_id != self.request.user.id:
            raise ValidationError({'specimen': ['Exemplar não encontrado.']})
        serializer.save()
