"""Tests for Weather service cache handler."""

import pytest
from unittest.mock import patch, MagicMock
from datetime import timedelta
from django.utils import timezone

from weather.models import WeatherCache
from weather.services import get_current_weather


@pytest.mark.django_db
class TestWeatherService:
    """Tests for Open-Meteo integration with local DB caching."""

    def test_cache_hit_returns_cached_data(self):
        """Returns cached weather when TTL is valid."""
        WeatherCache.objects.create(
            location_key='lat_-23.55_lon_-46.63',
            temperature_c=25.0,
            humidity_pct=65,
            weather_code=1,
        )
        result = get_current_weather(-23.55, -46.63)
        assert result is not None
        assert result['temperature_c'] == 25.0
        assert result['cached'] is True

    @patch('weather.services.requests.get')
    def test_api_call_when_cache_expired(self, mock_get):
        """Fetches from API when cached data is older than TTL."""
        old_time = timezone.now() - timedelta(hours=2)
        cache_entry = WeatherCache.objects.create(
            location_key='lat_-23.55_lon_-46.63',
            temperature_c=20.0,
            humidity_pct=50,
            weather_code=0,
        )
        # Force old timestamp
        WeatherCache.objects.filter(pk=cache_entry.pk).update(cached_at=old_time)

        mock_response = MagicMock()
        mock_response.json.return_value = {
            'current_weather': {
                'temperature': 28.0,
                'weathercode': 2,
            },
            'hourly': {
                'relative_humidity_2m': [72],
            },
        }
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        result = get_current_weather(-23.55, -46.63)
        assert result is not None
        assert result['temperature_c'] == 28.0
        assert result['cached'] is False

    @patch('weather.services.requests.get')
    def test_stale_cache_on_api_failure(self, mock_get):
        """Returns stale cached data when API is unavailable."""
        import requests as req
        mock_get.side_effect = req.RequestException('API down')

        WeatherCache.objects.create(
            location_key='lat_-23.55_lon_-46.63',
            temperature_c=22.0,
            humidity_pct=55,
            weather_code=1,
        )
        # Force old timestamp to make it stale
        old_time = timezone.now() - timedelta(hours=3)
        WeatherCache.objects.filter(location_key='lat_-23.55_lon_-46.63').update(cached_at=old_time)

        result = get_current_weather(-23.55, -46.63)
        assert result is not None
        assert result['temperature_c'] == 22.0
        assert result.get('stale') is True

    @patch('weather.services.requests.get')
    def test_returns_none_when_no_cache_and_api_fails(self, mock_get):
        """Returns None when no cache exists and API fails."""
        import requests as req
        mock_get.side_effect = req.RequestException('API down')

        result = get_current_weather(0.0, 0.0)
        assert result is None

    def test_cache_lookup_performance(self):
        """Cache lookup must return in under 100ms."""
        import time
        WeatherCache.objects.create(
            location_key='lat_0.0_lon_0.0',
            temperature_c=30.0,
            humidity_pct=80,
            weather_code=0,
        )
        start = time.time()
        result = get_current_weather(0.0, 0.0)
        elapsed_ms = (time.time() - start) * 1000

        assert result is not None
        assert elapsed_ms < 100, f'Cache lookup took {elapsed_ms:.1f}ms, expected <100ms'
