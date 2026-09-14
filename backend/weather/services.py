"""
Open-Meteo weather service with local database caching.
Constitution Principle IV: Local-first caching with 1-hour TTL.
"""

import requests
import logging
from datetime import timedelta
from django.utils import timezone

from weather.models import WeatherCache

logger = logging.getLogger(__name__)

OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast'
CACHE_TTL = timedelta(hours=1)


def _make_location_key(lat, lon):
    return f'lat_{lat}_lon_{lon}'


def get_current_weather(lat, lon):
    """
    Get current weather for a location.
    Returns cached data if available and fresh (<1 hour).
    Otherwise fetches from Open-Meteo API and caches.
    """
    location_key = _make_location_key(lat, lon)

    # Check cache
    cached = WeatherCache.objects.filter(location_key=location_key).first()
    if cached and (timezone.now() - cached.cached_at) < CACHE_TTL:
        logger.info(f'Weather cache hit for {location_key}')
        return {
            'temperature_c': cached.temperature_c,
            'humidity_pct': cached.humidity_pct,
            'weather_code': cached.weather_code,
            'cached': True,
        }

    # Fetch from API
    try:
        response = requests.get(
            OPEN_METEO_API,
            params={
                'latitude': lat,
                'longitude': lon,
                'current_weather': True,
                'hourly': 'relative_humidity_2m',
            },
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        logger.error(f'Open-Meteo API error: {exc}')
        # Return stale cache if available
        if cached:
            return {
                'temperature_c': cached.temperature_c,
                'humidity_pct': cached.humidity_pct,
                'weather_code': cached.weather_code,
                'cached': True,
                'stale': True,
            }
        return None

    current = data.get('current_weather', {})
    humidity_values = data.get('hourly', {}).get('relative_humidity_2m', [])
    humidity = humidity_values[0] if humidity_values else 0

    # Update or create cache entry
    WeatherCache.objects.update_or_create(
        location_key=location_key,
        defaults={
            'temperature_c': current.get('temperature', 0),
            'humidity_pct': humidity,
            'weather_code': current.get('weathercode', 0),
        },
    )

    return {
        'temperature_c': current.get('temperature', 0),
        'humidity_pct': humidity,
        'weather_code': current.get('weathercode', 0),
        'cached': False,
    }
