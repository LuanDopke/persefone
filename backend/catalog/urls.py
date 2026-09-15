"""URL routing for Species catalog API."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from catalog.views import SpeciesViewSet, search_gbif, create_local_species

router = DefaultRouter()
router.register(r'', SpeciesViewSet, basename='species')

urlpatterns = [
    path('search-gbif/', search_gbif, name='species-search-gbif'),
    path('local/', create_local_species, name='species-local'),
    path('', include(router.urls)),
]
