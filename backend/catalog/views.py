"""API views for Species catalog and GBIF search."""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from catalog.models import Species
from catalog.serializers import SpeciesSerializer, SpeciesListSerializer
from catalog.services import search_gbif_species


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
                qs = qs.filter(specimens__isnull=False).distinct()
            elif is_owned.lower() in ('false', '0'):
                qs = qs.filter(specimens__isnull=True)
        return qs


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
