import { useState } from 'react';

function Branch({ label, caption, children, defaultOpen = false, tone = 'bg-surface-variant' }) {
  const [open, setOpen] = useState(defaultOpen);
  return <li className="relative">
    <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={`flex min-h-11 w-full items-center gap-3 border-2 border-charcoal px-3 py-2 text-left font-bold shadow-hard-sm transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${tone}`}>
      <span aria-hidden="true" className="font-mono text-lg">{open ? '−' : '+'}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-charcoal/60">{caption}</span>
    </button>
    {open && <ul className="ml-4 mt-3 space-y-3 border-l-4 border-charcoal pl-4" role="group">{children}</ul>}
  </li>;
}

function SpeciesLeaf({ species }) {
  return <li className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-2 border-charcoal p-3 shadow-hard-sm ${species.observed ? 'bg-lime' : 'bg-surface'}`}>
    {species.image ? <img src={species.image} alt="" className="h-12 w-12 border-2 border-charcoal object-cover" /> : <span aria-hidden="true" className={`grid h-12 w-12 place-items-center border-2 border-charcoal font-mono font-bold ${species.observed ? 'bg-primary text-offwhite' : 'bg-lilac'}`}>SP</span>}
    <span className="min-w-0"><span className="block break-words font-bold italic">{species.scientific_name}</span>{species.common_name && <span className="block text-sm text-charcoal/70">{species.common_name}</span>}</span>
    <span className={`border-2 border-charcoal px-2 py-1 font-mono text-[9px] font-bold uppercase ${species.observed ? 'bg-coral' : 'bg-surface-variant'}`}>{species.observed ? `${species.count} observação${species.count === 1 ? '' : 'ões'}` : 'Mesmo gênero'}</span>
  </li>;
}

export default function TaxonomyTree({ observations }) {
  const orders = new Map();
  observations.forEach((observation) => {
    const species = observation.species_detail;
    const orderName = species.order || 'Ordem não informada';
    const familyName = species.family || 'Família não informada';
    const genusName = species.genus || species.scientific_name.split(' ')[0] || 'Gênero não informado';
    if (!orders.has(orderName)) orders.set(orderName, new Map());
    const families = orders.get(orderName);
    if (!families.has(familyName)) families.set(familyName, new Map());
    const genera = families.get(familyName);
    if (!genera.has(genusName)) genera.set(genusName, new Map());
    const speciesMap = genera.get(genusName);
    const current = speciesMap.get(species.id);
    speciesMap.set(species.id, { ...species, observed: true, count: (current?.count || 0) + 1, image: current?.image || observation.image });
    observation.related_species.forEach((related) => {
      if (!speciesMap.has(related.id)) speciesMap.set(related.id, { ...related, observed: false, count: 0, image: null });
    });
  });

  if (!observations.length) return <div className="border-4 border-dashed border-charcoal bg-surface p-8 text-center"><p className="text-xl font-extrabold uppercase">Nenhuma observação registrada</p><p className="mt-2 text-charcoal/70">Informe uma espécie para iniciar sua árvore taxonômica.</p></div>;

  return <ul className="space-y-4" aria-label="Árvore taxonômica de observações">
    {[...orders.entries()].sort().map(([orderName, families]) => <Branch key={orderName} label={orderName} caption="Ordem" defaultOpen tone="bg-coral">
      {[...families.entries()].sort().map(([familyName, genera]) => <Branch key={familyName} label={familyName} caption="Família" defaultOpen tone="bg-surface-variant">
        {[...genera.entries()].sort().map(([genusName, speciesMap]) => <Branch key={genusName} label={genusName} caption="Gênero" defaultOpen tone="bg-mint">
          {[...speciesMap.values()].sort((a, b) => a.scientific_name.localeCompare(b.scientific_name)).map((species) => <SpeciesLeaf key={species.id} species={species} />)}
        </Branch>)}
      </Branch>)}
    </Branch>)}
  </ul>;
}
