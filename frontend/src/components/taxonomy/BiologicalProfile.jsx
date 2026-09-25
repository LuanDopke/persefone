import { Icon } from '../ui/Icon';

const FIELDS = [
  { key: 'lifeForm', label: 'Forma de vida', headingClass: 'bg-lime/60' },
  { key: 'habitat', label: 'Habitat', headingClass: 'bg-mint/70' },
  { key: 'vegetationType', label: 'Vegetação', headingClass: 'bg-lilac/70' },
];
const INDICATORS = { extinct: 'Extinto', hybrid: 'Híbrido', aquatic: 'Aquático' };

function normalized(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function iconFor(field, value) {
  const text = normalized(value);
  if (field === 'lifeForm') {
    if (/arvore|tree/.test(text)) return 'tree';
    if (/subarbusto|arbusto|subshrub|shrub/.test(text)) return 'shrub';
    if (/erva|herb/.test(text)) return 'herb';
    if (/trepadeira|liana|vine|climber/.test(text)) return 'vine';
    if (/epifita|epiphyte/.test(text)) return 'epiphyte';
    if (/aquatic/.test(text)) return 'aquaticPlant';
    if (/rupicola|rock/.test(text)) return 'rocky';
    return 'leaf';
  }
  if (/aquatic|agua|freshwater|marine/.test(text)) return 'aquaticPlant';
  if (/rupicola|roch|afloramento|rock/.test(text)) return 'rocky';
  if (/epifita|epiphyte/.test(text)) return 'epiphyte';
  if (/floresta|forest/.test(text)) return 'forest';
  if (/campo|grassland|savana|savanna/.test(text)) return 'grassland';
  if (/brejo|pantanal|mangue|wetland/.test(text)) return 'wetland';
  if (field === 'habitat' && /terrestre|terricola|terrestrial/.test(text)) return 'ground';
  return 'landscape';
}

function itemsFor(profile, key) {
  const items = profile.value_items?.[key];
  if (Array.isArray(items)) return items.filter((item) => typeof item === 'string' && item.trim());
  const value = profile.values?.[key];
  return typeof value === 'string' && value.trim() ? [value] : [];
}

export default function BiologicalProfile({ profile }) {
  const fields = FIELDS.map((field) => ({ ...field, items: itemsFor(profile, field.key) }))
    .filter((field) => field.items.length > 0);
  const indicators = Object.entries(INDICATORS)
    .filter(([key]) => typeof profile.values?.[key] === 'boolean');
  const twoColumns = fields.some((field) => field.key === 'lifeForm') && fields.some((field) => field.key === 'habitat');

  if (!fields.length) return null;

  return (
    <div className="mt-3">
      <div className={`grid gap-3 ${twoColumns ? 'sm:grid-cols-2' : ''}`}>
        {fields.map((field) => (
          <article key={field.key} className={`min-w-0 border-2 border-charcoal bg-surface ${field.key === 'vegetationType' && twoColumns ? 'sm:col-span-2' : ''}`}>
            <h4 className={`border-b-2 border-charcoal px-3 py-2 font-mono text-xs font-bold uppercase tracking-wide ${field.headingClass}`}>{field.label}</h4>
            <ul className={`grid gap-2 p-3 ${field.key === 'vegetationType' && field.items.length > 1 ? 'md:grid-cols-2' : ''}`}>
              {field.items.map((value, index) => (
                <li key={`${value}-${index}`} className="flex min-w-0 items-center gap-3 py-1">
                  <Icon name={iconFor(field.key, value)} size={30} className="shrink-0" />
                  <span className="min-w-0 break-words text-sm font-semibold leading-snug">{value}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      {indicators.length > 0 && <ul className="mt-3 flex flex-wrap gap-2 text-xs">{indicators.map(([key, label]) => <li key={key} className="border border-charcoal/35 bg-offwhite px-2 py-1"><span className="text-charcoal/65">{label}:</span> <strong>{profile.values[key] ? 'Sim' : 'Não'}</strong></li>)}</ul>}
      {profile.source && <p className="mt-3 break-words font-mono text-[10px] text-charcoal/60">{profile.source_url ? <a href={profile.source_url} target="_blank" rel="noreferrer" className="underline">Fonte: {profile.source} ↗</a> : <>Fonte: {profile.source}</>}</p>}
    </div>
  );
}
