"""URL routing for Specimen and CareLog API."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from specimens.views import SpecimenViewSet, CareLogViewSet

router = DefaultRouter()
router.register(r'specimens', SpecimenViewSet, basename='specimen')
router.register(r'care-logs', CareLogViewSet, basename='carelog')

urlpatterns = [
    path('', include(router.urls)),
]
