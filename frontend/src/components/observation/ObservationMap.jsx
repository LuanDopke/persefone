import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';

export default function ObservationMap({ observation }) {
  const points = [];
  if (observation.latitude != null && observation.longitude != null) {
    points.push({ id: 'main', latitude: observation.latitude, longitude: observation.longitude, label: 'Planta principal' });
  }
  observation.evidence.forEach((item) => {
    if (item.latitude != null && item.longitude != null) {
      points.push({ id: item.id, latitude: item.latitude, longitude: item.longitude,
        label: item.subject === 'comparison' ? 'Outro indivíduo' : 'Evidência da planta principal' });
    }
  });
  if (!points.length) return null;
  const bounds = points.map((item) => [Number(item.latitude), Number(item.longitude)]);
  return <section className="space-y-3" aria-label="Localizações da observação">
    <h2 className="inline-block border-4 border-charcoal bg-lilac px-4 py-2 text-lg font-bold uppercase shadow-hard-sm">Localizações</h2>
    <MapContainer bounds={bounds} boundsOptions={{ padding: [24, 24], maxZoom: 14 }} scrollWheelZoom={false} className="h-64 w-full border-2 border-charcoal md:h-80">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.map((item) => <CircleMarker key={item.id} center={[Number(item.latitude), Number(item.longitude)]} radius={8} pathOptions={{ color: '#1A1A1A', fillColor: item.id === 'main' ? '#BDFF00' : '#FF6B4A', fillOpacity: 1 }}><Popup>{item.label}</Popup></CircleMarker>)}
    </MapContainer>
    <p className="text-xs text-charcoal/65">Os pontos são privados à sua conta. O mapa carrega imagens do OpenStreetMap.</p>
  </section>;
}
