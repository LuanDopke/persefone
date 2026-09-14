"""API views for Weather endpoints."""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from weather.services import get_current_weather


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_weather(request):
    """Get current weather for a location (cached)."""
    lat = request.query_params.get('lat')
    lon = request.query_params.get('lon')

    if not lat or not lon:
        return Response(
            {'error': 'Query parameters "lat" and "lon" are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        lat = float(lat)
        lon = float(lon)
    except ValueError:
        return Response(
            {'error': '"lat" and "lon" must be numeric values.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    weather_data = get_current_weather(lat, lon)
    if weather_data is None:
        return Response(
            {'error': 'Unable to fetch weather data.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(weather_data)
