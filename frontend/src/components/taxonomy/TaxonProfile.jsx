import { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

const RANK_LABELS = { order: 'Ordem', family: 'Família', genus: 'Gênero', species: 'Espécie' };
const FACT_LABELS = { lifeForm: 'Forma de vida', habitat: 'Habitat', vegetationType: 'Vegetação', extinct: 'Extinto', hybrid: 'Híbrido', aquatic: 'Aquático' };

function displayValue(value) {
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return value;
}

export default function TaxonProfile({ query }) {
  const [expandedImage, setExpandedImage] = useState(null);
  if (query.isLoading) return <section className="border-4 border-charcoal bg-surface p-5 shadow-hard" role="status">Carregando perfil taxonômico…</section>;
  if (query.isError) return <section className="border-4 border-critical bg-red-50 p-5" role="alert"><p className="font-bold">Não foi possível carregar os metadados deste táxon.</p><Button size="sm" className="mt-3" onClick={() => query.refetch()}>Tentar novamente</Button></section>;
  if (!query.data) return null;

  const { taxon, descriptions, profiles, vernacular_names: names, distributions, images, literature } = query.data;
  return (
    <section className="space-y-6 border-4 border-charcoal bg-surface p-5 shadow-hard" aria-label="Perfil taxonômico">
      <header className="grid gap-4 border-b-4 border-charcoal pb-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest">{RANK_LABELS[taxon.rank] || taxon.rank} · GBIF {taxon.key}</p>
          <h2 className={`mt-2 text-3xl font-extrabold ${taxon.rank === 'species' ? 'italic' : ''}`}>{taxon.scientific_name}</h2>
          {taxon.authorship && <p className="mt-1 text-sm text-charcoal/65">{taxon.authorship}</p>}
          {taxon.published_in && <p className="mt-2 max-w-3xl text-xs text-charcoal/55">Publicado em: {taxon.published_in}</p>}
        </div>
        <a href={`https://www.gbif.org/species/${taxon.key}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center border-4 border-charcoal bg-lime px-5 py-2 font-bold uppercase shadow-hard-sm hover:bg-lilac">Abrir no GBIF ↗</a>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <div className="space-y-5">
          <section>
            <h3 className="inline-block border-2 border-charcoal bg-coral px-3 py-1 font-bold uppercase">Características disponíveis</h3>
            {descriptions.length ? descriptions.map((item, index) => <blockquote key={`${item.source}-${index}`} className="mt-3 border-l-4 border-charcoal pl-4"><p className="leading-relaxed">{item.text}</p>{item.source && <cite className="mt-2 block font-mono text-[10px] not-italic uppercase text-charcoal/55">Fonte: {item.source}</cite>}</blockquote>) : <p className="mt-3 text-charcoal/65">O GBIF não possui descrição textual para este táxon.</p>}
          </section>

          {profiles.length > 0 && <section><h3 className="font-bold uppercase">Perfil biológico</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{profiles.map((profile, index) => <article key={`${profile.source}-${index}`} className="border-2 border-charcoal bg-mint/40 p-3">{Object.entries(profile.values).map(([key, value]) => <p key={key} className="text-sm"><strong>{FACT_LABELS[key] || key}:</strong> {displayValue(value)}</p>)}{profile.source && <p className="mt-2 font-mono text-[9px] uppercase text-charcoal/55">{profile.source}</p>}</article>)}</div></section>}

          {taxon.rank === 'species' && <section><div className="flex flex-wrap items-end justify-between gap-2"><h3 className="font-bold uppercase">Fotografias de ocorrências</h3>{typeof query.data.image_count === 'number' && <span className="font-mono text-[10px] font-bold uppercase">{query.data.image_count} registros com imagem</span>}</div>{images.length ? <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">{images.map((image, index) => <figure key={image.url} className="border-4 border-charcoal bg-offwhite p-1 shadow-hard-sm"><button type="button" onClick={() => setExpandedImage(image)} aria-label={`Ampliar fotografia ${index + 1} de ${taxon.scientific_name}`} className="block w-full cursor-zoom-in"><img src={image.url} alt={`Ocorrência de ${taxon.scientific_name}`} loading="lazy" className="aspect-square w-full object-cover" /></button><figcaption className="p-2 font-mono text-[9px] leading-relaxed"><span className="block font-bold">{image.creator || image.publisher || 'Autoria não informada'}</span>{image.license && <span className="mt-1 block break-all text-charcoal/55">{image.license}</span>}</figcaption></figure>)}</div> : <p className="mt-3 text-charcoal/65">Nenhuma fotografia de ocorrência foi encontrada.</p>}</section>}
        </div>

        <aside className="space-y-5">
          <div className="border-4 border-charcoal bg-primary p-4 text-offwhite shadow-hard-sm"><h3 className="font-bold uppercase text-lime">Classificação</h3><dl className="mt-3 space-y-2 text-sm">{[['Reino', taxon.kingdom], ['Filo', taxon.phylum], ['Classe', taxon.class_name], ['Ordem', taxon.order], ['Família', taxon.family], ['Gênero', taxon.genus]].filter(([, value]) => value).map(([label, value]) => <div key={label} className="flex justify-between gap-3 border-b border-offwhite/25 pb-1"><dt className="text-offwhite/60">{label}</dt><dd className="text-right font-bold">{value}</dd></div>)}</dl>{query.data.conservation?.category && <p className="mt-4 border-2 border-coral px-2 py-1 font-mono text-xs font-bold">IUCN: {query.data.conservation.category} ({query.data.conservation.code})</p>}{typeof query.data.occurrence_count === 'number' && <p className="mt-2 border-2 border-lime px-2 py-1 font-mono text-xs font-bold">{query.data.occurrence_count} ocorrências no GBIF</p>}</div>
          {names.length > 0 && <div className="border-4 border-charcoal bg-lilac p-4"><h3 className="font-bold uppercase">Nomes populares</h3><ul className="mt-2 space-y-1 text-sm">{names.map((item) => <li key={`${item.language}-${item.name}`}><strong>{item.name}</strong>{item.language && <span className="ml-2 font-mono text-[9px] uppercase text-charcoal/55">{item.language}</span>}</li>)}</ul></div>}
          {distributions.length > 0 && <div className="border-4 border-charcoal bg-amber p-4"><h3 className="font-bold uppercase">Distribuição registrada</h3><ul className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-2 text-sm">{distributions.map((item) => <li key={item.locality} className="border-b-2 border-charcoal/20 pb-2"><strong>{item.locality}</strong>{item.establishment_means && <span className="ml-2 font-mono text-[9px] uppercase">{item.establishment_means}</span>}</li>)}</ul></div>}
        </aside>
      </div>

      <section className="border-t-4 border-charcoal pt-5" aria-labelledby="taxonomy-literature-heading">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest">GBIF Literature API</p><h3 id="taxonomy-literature-heading" className="text-2xl font-extrabold uppercase">Literatura relacionada</h3></div><span className="border-2 border-charcoal bg-lime px-2 py-1 font-mono text-[10px] font-bold">{literature.length} referências</span></div>
        {literature.length ? <div className="mt-4 grid gap-4 lg:grid-cols-2">{literature.map((item) => <article key={item.id} className="border-4 border-charcoal bg-offwhite p-4 shadow-hard-sm"><div className="flex flex-wrap gap-2 font-mono text-[9px] font-bold uppercase">{item.peer_review && <span className="bg-mint px-2 py-1">Revisado por pares</span>}{item.open_access && <span className="bg-lime px-2 py-1">Acesso aberto</span>}{item.year && <span className="bg-lilac px-2 py-1">{item.year}</span>}</div><h4 className="mt-3 text-lg font-extrabold leading-tight">{item.title}</h4>{item.authors.length > 0 && <p className="mt-2 text-sm text-charcoal/70">{item.authors.join(', ')}</p>}{item.source && <p className="mt-1 font-mono text-[10px] uppercase text-charcoal/55">{item.source}</p>}{item.abstract && <p className="mt-3 text-sm leading-relaxed">{item.abstract}</p>}{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-4 inline-block border-b-2 border-charcoal font-bold">Abrir publicação ↗</a>}</article>)}</div> : <p className="mt-4 border-4 border-dashed border-charcoal p-4">Nenhuma publicação associada ou encontrada pelo nome científico.</p>}
      </section>

      {query.data.warnings.length > 0 && <p className="font-mono text-[10px] uppercase text-charcoal/55">Algumas fontes do GBIF não responderam: {query.data.warnings.join(', ')}.</p>}

      <Modal open={Boolean(expandedImage)} onClose={() => setExpandedImage(null)} title={`Fotografia — ${taxon.scientific_name}`} className="max-w-5xl">
        {expandedImage && <figure><div className="flex max-h-[70vh] items-center justify-center bg-charcoal p-2"><img src={expandedImage.url} alt={`Fotografia ampliada de ${taxon.scientific_name}`} className="max-h-[66vh] w-full object-contain" /></div><figcaption className="mt-3 text-sm"><strong>{expandedImage.creator || expandedImage.publisher || 'Autoria não informada'}</strong>{expandedImage.license && <span className="ml-2 break-all text-charcoal/60">{expandedImage.license}</span>}{expandedImage.references && <a href={expandedImage.references} target="_blank" rel="noreferrer" className="mt-2 block font-bold underline">Abrir registro original ↗</a>}</figcaption></figure>}
      </Modal>
    </section>
  );
}
