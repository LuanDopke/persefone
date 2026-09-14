"""API views for Specimen and CareLog."""

from django.db.models import Prefetch
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from specimens.models import Specimen, CareLog
from catalog.models import Species
from specimens.serializers import (
    SpecimenListSerializer,
    SpecimenDetailSerializer,
    CareLogSerializer,
    CollectionSpeciesSerializer,
)


class CollectionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 50


def _is_true(value):
    return str(value).lower() in {'1', 'true', 'yes'}


def _collection_item(species):
    """Build the API read model without persisting an aggregate table."""
    specimens = list(species.collection_specimens.all())
    active = [specimen for specimen in specimens if specimen.is_active]
    relevant = active or specimens
    total = len(active)

    def indicator(criterion):
        affected = sum(1 for specimen in active if criterion(specimen))
        return {
            'needs_attention': affected > 0,
            'affected_count': affected,
            'total_count': total,
        }

    care_metadata = species.native_region.get('care', {}) if isinstance(species.native_region, dict) else {}
    image = next((specimen.photo for specimen in relevant if specimen.photo), None)
    return {
        'species_id': species.id,
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

    queryset = Specimen.objects.select_related('species').prefetch_related('care_logs').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nickname', 'species__scientific_name', 'species__common_name']
    ordering_fields = ['acquired_at', 'vitality_index', 'nickname']

    def get_serializer_class(self):
        if self.action == 'list':
            return SpecimenListSerializer
        return SpecimenDetailSerializer

    @action(detail=False, methods=['get'], url_path='collection')
    def collection(self, request):
        """Return a paginated, species-level projection of the collection."""
        species_queryset = (
            Species.objects
            .filter(specimens__isnull=False)
            .distinct()
            .prefetch_related(Prefetch('specimens', queryset=Specimen.objects.all(), to_attr='collection_specimens'))
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
        species = Species.objects.filter(pk=species_id, specimens__isnull=False).distinct().first()
        if species is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        species.is_collection_favorite = favorite
        species.save(update_fields=['is_collection_favorite'])
        species = Species.objects.prefetch_related(Prefetch('specimens', queryset=Specimen.objects.all(), to_attr='collection_specimens')).get(pk=species.pk)
        return Response(CollectionSpeciesSerializer(_collection_item(species)).data)


class CareLogViewSet(viewsets.ModelViewSet):
    """CRUD operations for care log entries."""

    queryset = CareLog.objects.select_related('specimen').all()
    serializer_class = CareLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp']

    def get_queryset(self):
        qs = super().get_queryset()
        specimen_id = self.request.query_params.get('specimen_id')
        if specimen_id:
            qs = qs.filter(specimen_id=specimen_id)
        return qs
