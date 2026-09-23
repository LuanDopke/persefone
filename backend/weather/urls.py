"""URL routing for Weather API."""

from django.urls import path
from weather.views import current_weather

urlpatterns = [
    path('current/', current_weather, name='weather-current'),
]
