import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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
  const orders = useTaxonomyLevel('order', null, searches.order);
  const families = useTaxonomyLevel('family', path.order?.key, searches.family, Boolean(path.order || searches.family));
  const genera = useTaxonomyLevel('genus', path.family?.key, searches.genus, Boolean(path.family || searches.genus));
  const species = useTaxonomyLevel('species', path.genus?.key, searches.species, Boolean(path.genus || searches.species));
  const queries = { order: orders, family: families, genus: genera, species };

  const select = (rank, taxon) => {
    const index = LEVELS.indexOf(rank);
    setPath((current) => Object.fromEntries(LEVELS.map((level, levelIndex) => {
      if (levelIndex === index) return [level, taxon];
      if (levelIndex > index) return [level, null];
      const key = taxon[`${level}_key`];
      return [level, key ? { key, scientific_name: taxon[level], rank: level } : current[level]];
    })));
    setSearches((current) => Object.fromEntries(LEVELS.map((level, levelIndex) => [level, levelIndex > index ? '' : current[level]])));
  };

  const selectedTaxon = path.species || path.genus || path.family || path.order;
  const profile = useQuery({ queryKey: queryKeys.taxonomy.profile(selectedTaxon?.key), queryFn: () => fetchTaxonomyProfile(selectedTaxon.key), enabled: Boolean(selectedTaxon) });

  return (
    <PageContainer className="space-y-7">
      <PageHeader
        eyebrow="GBIF Backbone Taxonomy"
        title="Navegador taxonômico"
        description="Percorra a classificação botânica por ordem, família, gênero e espécie. Cada seleção abre o próximo ramo com dados consultados sob demanda."
      />

      <div className="flex min-h-12 flex-wrap items-center gap-2 border-4 border-charcoal bg-primary px-4 py-3 text-offwhite shadow-hard-sm" aria-label="Caminho taxonômico selecionado">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-lime">Plantae</span>
        {LEVELS.map((level) => path[level] && <span key={level} className="contents"><span aria-hidden="true" className="font-mono text-lime">/</span><button type="button" onClick={() => select(level, path[level])} className="border-b-2 border-transparent font-bold hover:border-lime focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime">{path[level].scientific_name}</button></span>)}
        {!path.order && <span className="text-sm text-offwhite/65">Selecione uma ordem para começar.</span>}
      </div>

      <div className="relative grid min-w-0 gap-7 lg:grid-cols-4 lg:gap-5">
        <div aria-hidden="true" className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[4.2rem] hidden h-1 bg-charcoal lg:block" />
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

      {selectedTaxon && <TaxonProfile query={profile} />}

      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal/55">Fonte: GBIF Backbone Taxonomy · resultados paginados e carregados conforme a navegação</p>
    </PageContainer>
  );
}
