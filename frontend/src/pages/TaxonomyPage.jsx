import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import TaxonomyColumn from '../components/taxonomy/TaxonomyColumn';
import TaxonProfile from '../components/taxonomy/TaxonProfile';
import { browseTaxonomy, fetchTaxonomyProfile, queryKeys } from '../services/apiClient';

const LEVELS = ['order', 'family', 'genus', 'species'];

function useTaxonomyLevel(rank, parentKey, search, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.taxonomy.browse(rank, parentKey, search),
    queryFn: ({ pageParam }) => browseTaxonomy({ rank, parentKey, search, offset: pageParam }),
    initialPageParam: 0,
    enabled,
    getNextPageParam: (lastPage) => lastPage.end_of_records ? undefined : lastPage.offset + lastPage.limit,
  });
}

export default function TaxonomyPage() {
  const [path, setPath] = useState({ order: null, family: null, genus: null, species: null });
  const [searches, setSearches] = useState({ order: '', family: '', genus: '', species: '' });
  const [taxonomyExpanded, setTaxonomyExpanded] = useState(true);
  const [speciesListOpen, setSpeciesListOpen] = useState(false);
  const profileRef = useRef(null);
  const orders = useTaxonomyLevel('order', null, searches.order);
  const families = useTaxonomyLevel('family', path.order?.key, searches.family, Boolean(path.order || searches.family));
  const genera = useTaxonomyLevel('genus', path.family?.key, searches.genus, Boolean(path.family || searches.genus));
  const species = useTaxonomyLevel('species', path.genus?.key, searches.species, Boolean(path.genus || searches.species));
  const queries = { order: orders, family: families, genus: genera, species };

  const select = (rank, taxon) => {
    const index = LEVELS.indexOf(rank);
    setTaxonomyExpanded(rank !== 'species');
    setSpeciesListOpen(false);
    setPath((current) => Object.fromEntries(LEVELS.map((level, levelIndex) => {
      if (levelIndex === index) return [level, taxon];
      if (levelIndex > index) return [level, null];
      const key = taxon[`${level}_key`];
      return [level, key ? { key, scientific_name: taxon[level], rank: level } : current[level]];
    })));
    setSearches((current) => Object.fromEntries(LEVELS.map((level, levelIndex) => [level, levelIndex > index ? '' : current[level]])));
  };

  const selectedTaxon = path.species || path.genus || path.family || path.order;
  const focusedSpecies = Boolean(path.species) && !taxonomyExpanded;
  const selectedSpeciesKey = path.species?.key;
  useEffect(() => {
    if (focusedSpecies) profileRef.current?.scrollIntoView?.({ block: 'start', behavior: 'auto' });
  }, [focusedSpecies, selectedSpeciesKey]);
  const profile = useQuery({ queryKey: queryKeys.taxonomy.profile(selectedTaxon?.key), queryFn: () => fetchTaxonomyProfile(selectedTaxon.key), enabled: Boolean(selectedTaxon) });

  return (
    <PageContainer className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="GBIF Backbone Taxonomy"
        title={focusedSpecies ? 'Explorar espécies' : 'Navegador taxonômico'}
        titleClassName={focusedSpecies ? '!text-2xl md:!text-3xl' : ''}
        className={focusedSpecies ? 'pb-3' : ''}
        description={focusedSpecies ? null : 'Explore as plantas por ordem, família e gênero. Selecione uma espécie para ver seus detalhes.'}
      />

      <nav className="flex min-h-12 flex-wrap items-center gap-x-2 gap-y-1 border-l-4 border-charcoal bg-surface px-4 py-2 text-sm shadow-hard-sm" aria-label="Caminho taxonômico selecionado">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-charcoal/55">Plantae</span>
        {LEVELS.map((level) => path[level] && <span key={level} className="contents"><span aria-hidden="true" className="text-charcoal/35">/</span><button type="button" onClick={() => select(level, path[level])} className={`break-words border-b-2 border-transparent font-bold hover:border-charcoal ${level === 'species' ? 'italic text-primary' : ''}`}>{path[level].scientific_name}</button></span>)}
        {!path.order && <span className="text-charcoal/55">/ Selecione uma ordem para começar</span>}
      </nav>

      <div className="flex flex-wrap items-center gap-3 border-l-4 border-primary bg-mint/30 px-4 py-3 text-sm"><span className="font-bold">Chaves de identificação</span><Link to={selectedTaxon && ['family', 'genus'].includes(selectedTaxon.rank) ? `/keys?scope_rank=${selectedTaxon.rank}&scope_gbif_key=${selectedTaxon.key}&search=${encodeURIComponent(selectedTaxon.scientific_name)}` : '/keys'} className="font-bold underline">{selectedTaxon && ['family', 'genus'].includes(selectedTaxon.rank) ? `Buscar chaves de ${selectedTaxon.scientific_name}` : 'Explorar chaves de identificação'} →</Link></div>

      {focusedSpecies ? (
        <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)] lg:gap-6" aria-label="Espécie selecionada">
          <aside className="min-w-0 space-y-3 lg:sticky lg:top-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-primary bg-mint/30 px-4 py-3 lg:block">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-charcoal/55">Outras espécies de</p>
                <p className="break-words text-base font-extrabold italic">{path.genus?.scientific_name || 'Plantae'}</p>
              </div>
              <button type="button" className="border-b-2 border-charcoal text-xs font-bold uppercase lg:hidden" aria-expanded={speciesListOpen} aria-controls="taxonomy-species-list" onClick={() => setSpeciesListOpen((open) => !open)}>{speciesListOpen ? 'Ocultar lista' : 'Trocar espécie'}</button>
              <button
                type="button"
                className="font-mono text-[10px] font-bold uppercase underline decoration-2 underline-offset-4 hover:text-primary lg:mt-3"
                aria-expanded="false"
                onClick={() => setTaxonomyExpanded(true)}
              >
                Mostrar taxonomia completa
              </button>
            </div>
            <div id="taxonomy-species-list" className={speciesListOpen ? 'block' : 'hidden lg:block'}>
              <TaxonomyColumn
                rank="species"
                query={species}
                selected={path.species}
                onSelect={(taxon) => select('species', taxon)}
                enabled
                parentName={path.genus?.scientific_name}
                search={searches.species}
                onSearch={(value) => setSearches((current) => ({ ...current, species: value }))}
                compact
              />
            </div>
          </aside>
          <div ref={profileRef} className="min-w-0 scroll-mt-4">
            <TaxonProfile query={profile} />
          </div>
        </div>
      ) : (
        <>
          <div className="grid min-w-0 items-start gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Explorar classificação">
            {LEVELS.map((level, index) => (
              <TaxonomyColumn
                key={level}
                rank={level}
                query={queries[level]}
                selected={path[level]}
                onSelect={(taxon) => select(level, taxon)}
                enabled={index === 0 || Boolean(path[LEVELS[index - 1]]) || Boolean(searches[level])}
                parentName={index > 0 ? path[LEVELS[index - 1]]?.scientific_name : 'Plantae'}
                search={searches[level]}
                onSearch={(value) => setSearches((current) => ({ ...current, [level]: value }))}
              />
            ))}
          </div>
          {selectedTaxon && <div className="min-w-0"><TaxonProfile query={profile} /></div>}
        </>
      )}

      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal/55">Fonte: GBIF Backbone Taxonomy · resultados carregados conforme a navegação</p>
    </PageContainer>
  );
}
