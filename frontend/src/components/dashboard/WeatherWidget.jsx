/**
 * WeatherWidget — Dashboard climate & weather status card.
 * Constitution Principle I: Neobrutalist styling with Chlorophyll Noir tokens.
 * Constitution Principle IV: Displays cached weather data from local DB.
 */

import { useQuery } from '@tanstack/react-query';
import { Card } from '../ui/Card';
import apiClient from '../../services/apiClient';

const WEATHER_CODES = {
  0: { label: 'Clear Sky', icon: '☀️' },
  1: { label: 'Mainly Clear', icon: '🌤️' },
  2: { label: 'Partly Cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Rime Fog', icon: '🌫️' },
  51: { label: 'Light Drizzle', icon: '🌦️' },
  53: { label: 'Moderate Drizzle', icon: '🌧️' },
  55: { label: 'Dense Drizzle', icon: '🌧️' },
  61: { label: 'Slight Rain', icon: '🌧️' },
  63: { label: 'Moderate Rain', icon: '🌧️' },
  65: { label: 'Heavy Rain', icon: '🌧️' },
  80: { label: 'Rain Showers', icon: '🌦️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
};

function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { label: 'Unknown', icon: '❓' };
}

export default function WeatherWidget({ lat = -23.55, lon = -46.63 }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['weather', lat, lon],
    queryFn: () =>
      apiClient.get('/api/weather/current/', { params: { lat, lon } }).then((r) => r.data),
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card title="Climate">
        <p className="text-xs font-bold uppercase tracking-wider text-charcoal/40 animate-pulse">
          Fetching weather...
        </p>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card title="Climate">
        <p className="text-xs font-bold uppercase tracking-wider text-red-500">
          Weather data unavailable
        </p>
      </Card>
    );
  }

  const weather = getWeatherInfo(data.weather_code);

  return (
    <Card title="Climate" className={data.stale ? 'opacity-70' : ''}>
      <div className="grid grid-cols-3 gap-4">
        {/* Temperature */}
        <div className="text-center">
          <p className="text-4xl font-extrabold text-charcoal">
            {data.temperature_c?.toFixed(1)}°
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 mt-1">
            Temperature
          </p>
        </div>

        {/* Humidity */}
        <div className="text-center">
          <p className="text-4xl font-extrabold text-charcoal">
            {data.humidity_pct}%
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 mt-1">
            Humidity
          </p>
        </div>

        {/* Condition */}
        <div className="text-center">
          <p className="text-4xl">{weather.icon}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 mt-1">
            {weather.label}
          </p>
        </div>
      </div>

      {data.cached && (
        <p className="text-[9px] font-bold uppercase tracking-widest text-charcoal/30 mt-3 text-right">
          {data.stale ? '⚠ Stale Cache' : '✓ Cached'}
        </p>
      )}
    </Card>
  );
}
