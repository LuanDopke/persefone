import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';

const POINT_STYLES = {
  native: { color: '#197A50', fillColor: '#65D6AD' },
  introduced: { color: '#9A3412', fillColor: '#FF6B4A' },
  observed: { color: '#3730A3', fillColor: '#C8B6FF' },
};

export function distributionStatus(establishmentMeans = '') {
  const rawValue = typeof establishmentMeans === 'string' ? establishmentMeans : establishmentMeans?.concept || '';
  const value = rawValue.split(/[/#]/).at(-1).toUpperCase();
  if (value.startsWith('NATIVE')) return 'native';
  if (value.startsWith('INTRODUCED') || value.includes('INVASIVE') || value.includes('NATURALI')) return 'introduced';
  return 'observed';
}

const STATUS_LABELS = {
  native: 'Nativa',
  introduced: 'Introduzida',
  observed: 'Observada (origem não informada)',
};

export default function TaxonDistributionMap({ points, scientificName }) {
  if (!points.length) return null;

  const bounds = points.map((point) => [point.latitude, point.longitude]);

  return (
    <figure className="mt-4 border-2 border-charcoal bg-offwhite p-2" aria-label={`Mapa de distribuição de ${scientificName}`}>
      <MapContainer
        key={`${scientificName}-${points.length}`}
        bounds={bounds}
        boundsOptions={{ padding: [24, 24], maxZoom: 6 }}
        scrollWheelZoom={false}
        className="h-72 w-full border border-charcoal md:h-96"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point, index) => {
          const status = distributionStatus(point.establishment_means);
          const location = [point.locality, point.state_province, point.country].filter(Boolean).join(', ');
          return (
            <CircleMarker
              key={point.key || `${point.latitude}-${point.longitude}-${index}`}
              center={[point.latitude, point.longitude]}
              radius={6}
              pathOptions={{ ...POINT_STYLES[status], fillOpacity: 0.8, weight: 2 }}
            >
              <Popup>
                <strong>{STATUS_LABELS[status]}</strong><br />
                {location || 'Localidade não informada'}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-2 p-3 font-mono text-[10px] font-bold uppercase">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <span key={status} className="inline-flex items-center gap-2">
            <span className="h-3 w-3 border-2 border-charcoal" style={{ backgroundColor: POINT_STYLES[status].fillColor }} aria-hidden="true" />
            {label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
