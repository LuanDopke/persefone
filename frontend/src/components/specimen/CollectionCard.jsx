import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import MediaFrame from '../ui/MediaFrame';
import CareIndicator from './CareIndicator';

const EMPTY_CARE = { water: { needs_attention: false, affected_count: 0, total_count: 0 }, nutrients: { needs_attention: false, affected_count: 0, total_count: 0 }, light: { needs_attention: false, affected_count: 0, total_count: 0 } };

export default function CollectionCard({ item, onFavorite }) {
  const care = item.care || EMPTY_CARE;
  const displayName = item.common_name || item.nickname || item.scientific_name || item.species_name;
  const scientificName = item.scientific_name || item.species_name || displayName;
  const detailTarget = item.specimen_id ? `/specimens/instances/${item.specimen_id}` : `/specimens/${item.species_id}`;
  return (
    <article className={`collection-card ${item.is_archived ? 'opacity-70' : ''}`}>
      <Card className="analog-hover tape-mark relative h-full">
        <div className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-start gap-4">
          <MediaFrame className="h-20 w-20" aspect="square" src={item.image_url} alt={`Imagem de ${displayName}`} />
          <div className="min-w-0">
            <Link to={detailTarget} aria-label={`Abrir detalhes de ${displayName}`} className="after:absolute after:inset-0 focus-visible:ring-4 focus-visible:ring-lime">
              <h2 className="truncate text-lg font-extrabold uppercase" title={displayName}>{displayName}</h2>
            </Link>
            <p className="truncate text-sm italic text-charcoal/70" title={scientificName}>{scientificName}</p>
            <p className="mt-2 text-sm font-bold">{item.specimen_count === 1 ? '1 exemplar' : `${item.specimen_count} exemplares`}</p>
            {item.is_archived && <span className="mt-1 inline-block text-xs font-bold">ARQUIVADA</span>}
          </div>
          <button type="button" aria-label={`${item.is_favorite ? 'Desfavoritar' : 'Favoritar'} ${displayName}`} onClick={() => onFavorite(item)} className="relative z-10 flex min-h-11 min-w-11 rotate-2 items-center justify-center border-2 border-charcoal bg-surface-variant font-bold shadow-hard-sm transition-transform hover:-rotate-3 focus-visible:ring-4 focus-visible:ring-lime active:translate-x-0.5 active:translate-y-0.5 active:shadow-none" aria-pressed={item.is_favorite}><Icon name="favorite" className={item.is_favorite ? 'fill-coral text-charcoal' : ''} /></button>
        </div>
        <div className="relative z-10 mt-4 flex flex-wrap gap-2">{Object.entries(care).map(([name, value]) => <CareIndicator key={name} name={name} value={value} />)}</div>
        {(item.care_reference?.light || item.care_reference?.water) && <p className="mt-3 text-xs text-charcoal/70">{item.care_reference.light && `Luz: ${item.care_reference.light}`}{item.care_reference.light && item.care_reference.water && ' · '}{item.care_reference.water && `Rega: ${item.care_reference.water}`}</p>}
      </Card>
    </article>
  );
}
