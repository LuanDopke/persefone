"""URL routing for Species catalog API."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from catalog.views import SpeciesViewSet, browse_taxonomy, create_local_species, search_gbif, taxonomy_profile

router = DefaultRouter()
router.register(r'', SpeciesViewSet, basename='species')

urlpatterns = [
    path('taxonomy/', browse_taxonomy, name='taxonomy-browse'),
    path('taxonomy/<int:taxon_key>/profile/', taxonomy_profile, name='taxonomy-profile'),
    path('search-gbif/', search_gbif, name='species-search-gbif'),
    path('local/', create_local_species, name='species-local'),
    path('', include(router.urls)),
]
