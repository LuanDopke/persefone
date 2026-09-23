import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import TaxonDistributionMap, { distributionStatus } from './TaxonDistributionMap';

const RANK_LABELS = { order: 'Ordem', family: 'Família', genus: 'Gênero', species: 'Espécie' };
const FACT_LABELS = { lifeForm: 'Forma de vida', habitat: 'Habitat', vegetationType: 'Vegetação', extinct: 'Extinto', hybrid: 'Híbrido', aquatic: 'Aquático' };
const PORTUGUESE_CODES = new Set(['por', 'pt', 'pt-br', 'pt-pt']);
const ENGLISH_CODES = new Set(['eng', 'en', 'en-us', 'en-gb']);
const IUCN_LEVELS = [
  { code: 'LC', label: 'Pouco preocupante', color: 'bg-lime text-charcoal' },
  { code: 'NT', label: 'Quase ameaçada', color: 'bg-amber text-charcoal' },
  { code: 'VU', label: 'Vulnerável', color: 'bg-coral text-charcoal' },
  { code: 'EN', label: 'Em perigo', color: 'bg-critical text-white' },
  { code: 'CR', label: 'Criticamente em perigo', color: 'bg-red-700 text-white' },
  { code: 'EW', label: 'Extinta na natureza', color: 'bg-slate-700 text-white' },
  { code: 'EX', label: 'Extinta', color: 'bg-charcoal text-white' },
  { code: 'DD', label: 'Dados insuficientes', color: 'bg-gray-400 text-charcoal' },
  { code: 'NE', label: 'Não avaliada', color: 'bg-offwhite text-charcoal' },
];

function displayValue(value) {
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return value;
}

function languagePriority(language = '') {
  const code = (language || '').toLowerCase();
  if (PORTUGUESE_CODES.has(code)) return 0;
  if (ENGLISH_CODES.has(code)) return 1;
  return 2;
}

function languageLabel(language = '') {
  const priority = languagePriority(language);
  if (priority === 0) return 'Português';
  if (priority === 1) return 'English';
  return language || 'Idioma não informado';
}

function iucnCode(conservation) {
  if (conservation?.code) return conservation.code.toUpperCase();
  const normalized = (conservation?.category || '').toUpperCase().replaceAll(' ', '_');
  return {
    EXTINCT: 'EX', EXTINCT_IN_THE_WILD: 'EW', CRITICALLY_ENDANGERED: 'CR', ENDANGERED: 'EN',
    VULNERABLE: 'VU', NEAR_THREATENED: 'NT', LEAST_CONCERN: 'LC', DATA_DEFICIENT: 'DD', NOT_EVALUATED: 'NE',
  }[normalized] || '';
}

function ConservationScale({ conservation }) {
  const selectedCode = iucnCode(conservation);
  const selectedLevel = IUCN_LEVELS.find((level) => level.code === selectedCode);
  return (
    <div className="border-l-4 border-charcoal bg-surface px-3 py-2" aria-label="Risco IUCN">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal/60">Risco IUCN</span>
        {selectedLevel ? <strong className={`border-2 border-charcoal px-1.5 py-0.5 font-mono text-xs ${selectedLevel.color}`}>{selectedLevel.code} · {selectedLevel.label}</strong> : <span className="text-xs font-bold">Sem avaliação disponível</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1" aria-label="Níveis de risco IUCN">
        {IUCN_LEVELS.map((level) => {
          const selected = level.code === selectedCode;
          return (
            <span
              key={level.code}
              title={`${level.code} — ${level.label}`}
              className={`border border-charcoal/50 px-1 py-0.5 font-mono text-[9px] font-bold ${level.color} ${selected ? 'opacity-100' : 'opacity-45'}`}
              aria-label={`${level.code}: ${level.label}${selected ? ', classificação atual' : ''}`}
              aria-current={selected ? 'true' : undefined}
            >
              {level.code}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Classification({ taxon }) {
  const rows = [['Reino', taxon.kingdom], ['Filo', taxon.phylum], ['Classe', taxon.class_name], ['Ordem', taxon.order], ['Família', taxon.family], ['Gênero', taxon.genus]];
  return (
    <div className="border-t-4 border-charcoal/20 bg-mint/20 p-5">
      <h3 className="text-sm font-bold uppercase">Classificação taxonômica</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.filter(([, value]) => value).map(([label, value]) => (
          <div key={label} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3 border-b-2 border-charcoal/20 pb-2">
            <dt className="text-charcoal/60">{label}</dt>
            <dd className="break-words text-right font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Distribution({ distributions, points, occurrenceCount, scientificName }) {
  const groupedLocations = useMemo(() => distributions.reduce((groups, item) => {
    groups[distributionStatus(item.establishment_means)].push(item);
    return groups;
  }, { native: [], introduced: [], observed: [] }), [distributions]);
  const groups = [['native', 'Regiões nativas'], ['introduced', 'Regiões introduzidas'], ['observed', 'Outros registros de distribuição']];

  if (!distributions.length && !points.length && typeof occurrenceCount !== 'number') return null;

  return (
    <section className="border-t-2 border-charcoal/25 p-5 md:p-6" aria-labelledby="distribution-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest">Distribuição geográfica</p>
          <h3 id="distribution-heading" className="text-2xl font-extrabold uppercase">Onde ocorre</h3>
        </div>
        {typeof occurrenceCount === 'number' && (
          <div className="border-2 border-charcoal bg-lilac/50 px-4 py-2 text-right">
            <strong className="block text-xl">{occurrenceCount.toLocaleString('pt-BR')}</strong>
            <span className="font-mono text-[9px] font-bold uppercase">ocorrências no GBIF</span>
          </div>
        )}
      </div>

      {points.length > 0 ? <TaxonDistributionMap points={points} scientificName={scientificName} /> : <p className="mt-4 border-2 border-dashed border-charcoal/40 bg-offwhite p-4 text-sm">Não há coordenadas disponíveis para desenhar o mapa desta espécie.</p>}

      {distributions.length > 0 && (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {groups.map(([status, title]) => groupedLocations[status].length > 0 && (
            <div key={status} className="border-2 border-charcoal bg-offwhite p-3">
              <h4 className="text-sm font-bold uppercase">{title}</h4>
              <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-2 text-sm">
                {groupedLocations[status].map((item) => <li key={item.locality} className="border-b border-charcoal/20 pb-1">{item.locality}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-charcoal/60">A categoria depende do campo de estabelecimento informado ao GBIF. Registros sem esse dado aparecem apenas como observados.</p>
    </section>
  );
}

export default function TaxonProfile({ query }) {
  const [expandedImage, setExpandedImage] = useState(null);
  const [visibleImageCount, setVisibleImageCount] = useState(5);
  const taxonKey = query.data?.taxon?.key;
  useEffect(() => {
    setVisibleImageCount(5);
    setExpandedImage(null);
  }, [taxonKey]);

  if (query.isLoading) return <section className="border-4 border-charcoal bg-surface p-5 shadow-hard" role="status">Carregando perfil taxonômico…</section>;
  if (query.isError) return <section className="border-4 border-critical bg-red-50 p-5" role="alert"><p className="font-bold">Não foi possível carregar os metadados deste táxon.</p><Button size="sm" className="mt-3" onClick={() => query.refetch()}>Tentar novamente</Button></section>;
  if (!query.data) return null;

  const { taxon, descriptions = [], profiles = [], vernacular_names: names = [], distributions = [], occurrence_points: occurrencePoints = [], images = [], literature = [], warnings = [], conservation, occurrence_count: occurrenceCount, image_count: imageCount } = query.data;
  const sortedNames = [...names].sort((a, b) => languagePriority(a.language) - languagePriority(b.language) || a.name.localeCompare(b.name));
  const visibleImages = images.slice(0, visibleImageCount);

  return (
    <section className="min-w-0 border-2 border-charcoal bg-surface shadow-hard-sm" aria-label="Perfil taxonômico">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b-2 border-charcoal bg-mint/30 p-5 md:p-7">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Ficha de {RANK_LABELS[taxon.rank] || taxon.rank} <span aria-hidden="true">·</span> GBIF {taxon.key}</p>
          <h2 className={`mt-2 break-words text-3xl font-extrabold leading-tight md:text-4xl ${taxon.rank === 'species' ? 'italic' : ''}`}>{taxon.scientific_name}</h2>
          {taxon.authorship && <p className="mt-1 text-sm text-charcoal/65">{taxon.authorship}</p>}
          {sortedNames.length > 0 && <p className="mt-3 text-sm font-semibold text-charcoal/75">{sortedNames[0].name}</p>}
          {taxon.published_in && <p className="mt-2 max-w-3xl text-xs text-charcoal/55">Publicado em: {taxon.published_in}</p>}
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:min-w-[17rem] sm:max-w-[22rem]">
          {taxon.rank === 'species' && <ConservationScale conservation={conservation} />}
          <a href={`https://www.gbif.org/species/${taxon.key}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center border-2 border-charcoal bg-lime px-4 py-2 text-sm font-bold uppercase shadow-hard-sm hover:bg-offwhite">Abrir no GBIF ↗</a>
        </div>
      </header>

      <div className="grid min-w-0 xl:grid-cols-[minmax(0,1.2fr)_minmax(15rem,0.8fr)]">
        <div className="min-w-0 space-y-5 p-5 md:p-6">
          <section>
            <h3 className="inline-block border-2 border-charcoal bg-coral px-3 py-1 font-bold uppercase">Características disponíveis</h3>
            {descriptions.length ? descriptions.map((item, index) => <blockquote key={`${item.source}-${index}`} className="mt-3 border-l-4 border-charcoal pl-4"><p className="leading-relaxed">{item.text}</p>{item.source && <cite className="mt-2 block font-mono text-[10px] not-italic uppercase text-charcoal/55">Fonte: {item.source}</cite>}</blockquote>) : <p className="mt-3 text-charcoal/65">O GBIF não possui descrição textual para este táxon.</p>}
          </section>

          {profiles.length > 0 && <section><h3 className="font-bold uppercase">Perfil biológico</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{profiles.map((profile, index) => <article key={`${profile.source}-${index}`} className="border-2 border-charcoal bg-mint/40 p-3">{Object.entries(profile.values).map(([key, value]) => <p key={key} className="text-sm"><strong>{FACT_LABELS[key] || key}:</strong> {displayValue(value)}</p>)}{profile.source && <p className="mt-2 font-mono text-[9px] uppercase text-charcoal/55">{profile.source}</p>}</article>)}</div></section>}

        </div>

        <aside className="min-w-0 border-t-2 border-charcoal/25 xl:border-l-2 xl:border-t-0">
          <Classification taxon={taxon} />
          {sortedNames.length > 0 && <div className="border-t-2 border-charcoal/20 bg-lilac/25 p-5"><h3 className="text-sm font-bold uppercase">Nomes populares</h3><p className="mt-1 font-mono text-[9px] uppercase text-charcoal/55">Português, inglês e demais idiomas</p><ul className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-2 text-sm">{sortedNames.map((item) => <li key={`${item.language}-${item.name}`} className="border-b border-charcoal/20 pb-1"><strong>{item.name}</strong><span className="ml-2 font-mono text-[9px] uppercase text-charcoal/55">{languageLabel(item.language)}</span></li>)}</ul></div>}
        </aside>
      </div>

      {taxon.rank === 'species' && (
        <section className="border-t-2 border-charcoal/25 p-5 md:p-6" aria-labelledby="taxonomy-photos-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-charcoal/55">Galeria</p>
              <h3 id="taxonomy-photos-heading" className="text-xl font-extrabold uppercase">Fotografias de ocorrências</h3>
            </div>
            {typeof imageCount === 'number' && <span className="font-mono text-[10px] font-bold uppercase text-charcoal/60">{imageCount} registros com imagem</span>}
          </div>
          {images.length ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-5">
                {visibleImages.map((image, index) => (
                  <figure key={image.url} className="min-w-0 border-2 border-charcoal bg-offwhite p-1">
                    <button type="button" onClick={() => setExpandedImage(image)} aria-label={`Ampliar fotografia ${index + 1} de ${taxon.scientific_name}`} className="block w-full cursor-zoom-in">
                      <img src={image.url} alt={`Ocorrência de ${taxon.scientific_name}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    </button>
                    <figcaption className="p-2 font-mono text-[9px] leading-relaxed"><span className="block font-bold">{image.creator || image.publisher || 'Autoria não informada'}</span>{image.license && <span className="mt-1 block break-all text-charcoal/55">{image.license}</span>}</figcaption>
                  </figure>
                ))}
              </div>
              {visibleImageCount < images.length && <Button type="button" size="sm" variant="secondary" className="mt-4" onClick={() => setVisibleImageCount((count) => count + 5)}>Carregar mais imagens</Button>}
            </>
          ) : <p className="mt-3 text-charcoal/65">Nenhuma fotografia de ocorrência foi encontrada.</p>}
        </section>
      )}

      {taxon.rank === 'species' && <Distribution distributions={distributions} points={occurrencePoints} occurrenceCount={occurrenceCount} scientificName={taxon.scientific_name} />}

      <section className="border-t-2 border-charcoal/25 p-5 md:p-6" aria-labelledby="taxonomy-literature-heading">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest">GBIF Literature API</p><h3 id="taxonomy-literature-heading" className="text-2xl font-extrabold uppercase">Literatura relacionada</h3></div><span className="border-2 border-charcoal bg-lime px-2 py-1 font-mono text-[10px] font-bold">{literature.length} referências</span></div>
        {literature.length ? <div className="mt-4 grid gap-4 lg:grid-cols-2">{literature.map((item) => <article key={item.id} className="min-w-0 border-2 border-charcoal bg-offwhite p-4"><div className="flex flex-wrap gap-2 font-mono text-[9px] font-bold uppercase">{item.peer_review && <span className="bg-mint px-2 py-1">Revisado por pares</span>}{item.open_access && <span className="bg-lime px-2 py-1">Acesso aberto</span>}{item.year && <span className="bg-lilac px-2 py-1">{item.year}</span>}</div><h4 className="mt-3 break-words text-lg font-extrabold leading-tight">{item.title}</h4>{(item.authors || []).length > 0 && <p className="mt-2 text-sm text-charcoal/70">{item.authors.join(', ')}</p>}{item.source && <p className="mt-1 font-mono text-[10px] uppercase text-charcoal/55">{item.source}</p>}{item.abstract && <p className="mt-3 text-sm leading-relaxed">{item.abstract}</p>}{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-4 inline-block border-b-2 border-charcoal font-bold">Abrir publicação ↗</a>}</article>)}</div> : <p className="mt-4 border-2 border-dashed border-charcoal/40 p-4">Nenhuma publicação associada ou encontrada pelo nome científico.</p>}
      </section>

      {warnings.length > 0 && <p className="px-5 pb-5 font-mono text-[10px] uppercase text-charcoal/55">Algumas fontes do GBIF não responderam: {warnings.join(', ')}.</p>}

      <Modal open={Boolean(expandedImage)} onClose={() => setExpandedImage(null)} title={`Fotografia — ${taxon.scientific_name}`} className="max-w-5xl">
        {expandedImage && <figure><div className="flex max-h-[70vh] items-center justify-center bg-charcoal p-2"><img src={expandedImage.url} alt={`Fotografia ampliada de ${taxon.scientific_name}`} className="max-h-[66vh] w-full object-contain" /></div><figcaption className="mt-3 text-sm"><strong>{expandedImage.creator || expandedImage.publisher || 'Autoria não informada'}</strong>{expandedImage.license && <span className="ml-2 break-all text-charcoal/60">{expandedImage.license}</span>}{expandedImage.references && <a href={expandedImage.references} target="_blank" rel="noreferrer" className="mt-2 block font-bold underline">Abrir registro original ↗</a>}</figcaption></figure>}
      </Modal>
    </section>
  );
}
