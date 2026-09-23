import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import Input from '../ui/Input';

const TONES = {
  order: 'bg-coral',
  family: 'bg-amber',
  genus: 'bg-mint',
  species: 'bg-lilac',
};

const LABELS = {
  order: 'Ordens',
  family: 'Famílias',
  genus: 'Gêneros',
  species: 'Espécies',
};

const SEARCH_LABELS = {
  order: 'ordens',
  family: 'famílias',
  genus: 'gêneros',
  species: 'espécies',
};

const STEP_NUMBERS = { order: '01', family: '02', genus: '03', species: '04' };

export default function TaxonomyColumn({ rank, query, selected, onSelect, enabled, parentName, search, onSearch, compact = false }) {
  const [draft, setDraft] = useState(search);
  const [searchError, setSearchError] = useState('');
  useEffect(() => setDraft(search), [search]);
  const pages = query.data?.pages || [];
  const taxa = pages.flatMap((page) => page.results);
  const count = pages[0]?.count;
  const submitSearch = (event) => {
    event.preventDefault();
    const value = draft.trim();
    if (value.length === 1) { setSearchError('Digite pelo menos 2 caracteres.'); return; }
    setSearchError('');
    onSearch(value);
  };

  return (
    <section aria-labelledby={`taxonomy-${rank}`} className="min-w-0 border-2 border-charcoal bg-surface shadow-hard-sm">
      <div className={`border-b-2 border-charcoal px-4 py-3 ${TONES[rank]}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest">Etapa {STEP_NUMBERS[rank]}</p>
          {typeof count === 'number' && <span className="border-2 border-charcoal bg-surface px-2 py-0.5 font-mono text-[10px] font-bold" aria-label={`${count} resultados`}>{count}</span>}
        </div>
        <h2 id={`taxonomy-${rank}`} className="mt-1 text-lg font-extrabold uppercase">{LABELS[rank]}</h2>
      </div>

      <form onSubmit={submitSearch} className="space-y-2 border-b-2 border-charcoal/15 p-4">
        <label htmlFor={`taxonomy-search-${rank}`} className="font-mono text-[10px] font-bold uppercase tracking-wider">Buscar {SEARCH_LABELS[rank]}</label>
        <div className="flex gap-2">
          <Input id={`taxonomy-search-${rank}`} type="search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Ex.: ${rank === 'genus' ? 'Begonia' : rank === 'species' ? 'Begonia maculata' : rank === 'family' ? 'Begoniaceae' : 'Cucurbitales'}`} className="min-w-0 py-2 text-sm shadow-hard-sm" aria-invalid={Boolean(searchError)} />
          <Button type="submit" size="sm" variant="primary" aria-label={`Executar busca de ${SEARCH_LABELS[rank]}`}>⌕</Button>
        </div>
        {searchError && <p role="alert" className="text-xs font-bold text-critical">{searchError}</p>}
        {search && <button type="button" onClick={() => { setDraft(''); setSearchError(''); onSearch(''); }} className="font-mono text-[10px] font-bold uppercase underline">Limpar busca</button>}
      </form>

      <div className={`min-h-32 p-3 ${compact ? 'max-h-[25rem]' : 'max-h-[28rem]'} overflow-y-auto overscroll-contain`}>
        {!enabled && (
          <div className="border-4 border-dashed border-charcoal/40 bg-surface/70 p-4 text-sm font-semibold text-charcoal/55">
            Selecione {rank === 'family' ? 'uma ordem' : rank === 'genus' ? 'uma família' : 'um gênero'} para abrir este ramo.
          </div>
        )}
        {enabled && <p className="mb-2 truncate px-1 font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal/60">{search ? `Resultados para “${search}”` : `Ramo de ${parentName}`}</p>}
        {enabled && query.isLoading && <p role="status" className="border-4 border-charcoal bg-surface p-4 font-bold shadow-hard-sm">Consultando GBIF…</p>}
        {enabled && query.isError && (
          <div role="alert" className="border-4 border-critical bg-red-50 p-4">
            <p className="font-bold">Não foi possível abrir este ramo.</p>
            <Button size="sm" className="mt-3" onClick={() => query.refetch()}>Tentar novamente</Button>
          </div>
        )}
        {enabled && !query.isLoading && !query.isError && taxa.length === 0 && <p className="border-4 border-dashed border-charcoal bg-surface p-4 font-semibold">Nenhum táxon encontrado neste nível.</p>}
        {enabled && taxa.length > 0 && (
          <div className="space-y-2">
            {taxa.map((taxon) => {
              const isSelected = selected?.key === taxon.key;
              return (
                <button
                  key={taxon.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(taxon)}
                  className={`group w-full border-2 border-charcoal px-3 py-2.5 text-left transition-colors focus-visible:relative ${isSelected ? 'bg-lime' : 'bg-offwhite hover:bg-mint/40'}`}
                >
                  <span className="flex items-start gap-3">
                    <span aria-hidden="true" className={`mt-1 h-3 w-3 shrink-0 border-2 border-charcoal ${isSelected ? 'bg-charcoal' : TONES[rank]}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block break-words font-extrabold ${rank === 'species' ? 'italic' : ''}`}>{taxon.scientific_name}</span>
                      {taxon.vernacular_name && <span className="mt-1 block text-xs text-charcoal/65">{taxon.vernacular_name}</span>}
                      {taxon.num_descendants > 0 && rank !== 'species' && <span className="mt-2 block font-mono text-[9px] font-bold uppercase text-charcoal/55">{taxon.num_descendants} descendentes</span>}
                    </span>
                    {rank !== 'species' && <span aria-hidden="true" className="font-mono text-xl font-black">→</span>}
                  </span>
                </button>
              );
            })}
            {query.hasNextPage && <Button size="sm" variant="secondary" className="w-full" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}</Button>}
          </div>
        )}
      </div>
    </section>
  );
}
