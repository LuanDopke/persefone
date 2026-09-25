from rest_framework.routers import SimpleRouter

from catalog.views import ObservationViewSet
from catalog.key_views import observation_runs, run_answers
from django.urls import path


router = SimpleRouter()
router.register(r'', ObservationViewSet, basename='observation')
urlpatterns = [
    path('<uuid:observation_id>/key-runs/', observation_runs, name='observation-key-runs'),
    path('<uuid:observation_id>/key-runs/<uuid:run_id>/answers/', run_answers, name='observation-key-run-answers'),
] + router.urls
