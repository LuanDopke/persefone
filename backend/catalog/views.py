"""API views for Species catalog and GBIF search."""

from django.db import IntegrityError, transaction
from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from catalog.models import Observation, Species
from catalog.serializers import ObservationSerializer, SpeciesSerializer, SpeciesListSerializer, LocalSpeciesCreateSerializer
from catalog.services import GBIFServiceError, browse_gbif_taxa, get_gbif_taxon_profile, search_gbif_species


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
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        return Observation.objects.filter(owner=self.request.user).select_related('species')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


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
