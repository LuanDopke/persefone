import { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Button } from '../ui/Button';

function MapControls({ latitude, longitude, onChange }) {
  const map = useMap();
  useMapEvents({ click: (event) => onChange({ latitude: event.latlng.lat.toFixed(6), longitude: event.latlng.lng.toFixed(6) }) });
  useEffect(() => {
    if (latitude === '' || longitude === '') return;
    const point = [Number(latitude), Number(longitude)];
    if (Number.isFinite(point[0]) && Number.isFinite(point[1])) map.setView(point, 13);
  }, [latitude, longitude, map]);
  return latitude !== '' && longitude !== '' && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
    ? <CircleMarker center={[Number(latitude), Number(longitude)]} radius={8} pathOptions={{ color: '#1A1A1A', fillColor: '#BDFF00', fillOpacity: 1 }} />
    : null;
}

export default function LocationPicker({ value, onChange, id = 'location' }) {
  const [error, setError] = useState('');
  const latitude = value.latitude ?? '';
  const longitude = value.longitude ?? '';
  const useGPS = () => {
    setError('');
    if (!navigator.geolocation) { setError('O dispositivo não oferece localização. Marque o ponto no mapa.'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => onChange({ latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) }),
      () => setError('Não foi possível obter a localização. Marque o ponto no mapa.'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-3"><Button size="sm" onClick={useGPS}>Usar meu GPS</Button><Button size="sm" variant="secondary" onClick={() => onChange({ latitude: '', longitude: '' })}>Limpar ponto</Button></div>
    {error && <p role="alert" className="font-semibold text-critical">{error}</p>}
    <p className="text-sm text-charcoal/70">Toque no mapa para marcar ou ajustar o ponto. A posição é opcional.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-bold" htmlFor={`${id}-latitude`}>Latitude<input id={`${id}-latitude`} type="number" step="0.000001" min="-90" max="90" value={latitude} onChange={(event) => onChange({ latitude: event.target.value, longitude })} className="mt-1 w-full border-2 border-charcoal bg-offwhite px-3 py-2" /></label>
      <label className="text-sm font-bold" htmlFor={`${id}-longitude`}>Longitude<input id={`${id}-longitude`} type="number" step="0.000001" min="-180" max="180" value={longitude} onChange={(event) => onChange({ latitude, longitude: event.target.value })} className="mt-1 w-full border-2 border-charcoal bg-offwhite px-3 py-2" /></label>
    </div>
    <MapContainer center={latitude !== '' && longitude !== '' ? [Number(latitude), Number(longitude)] : [-14, -52]} zoom={latitude !== '' && longitude !== '' ? 13 : 4} scrollWheelZoom={false} className="h-64 w-full border-2 border-charcoal" aria-label="Mapa para marcar localização">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapControls latitude={latitude} longitude={longitude} onChange={onChange} />
    </MapContainer>
  </div>;
}
