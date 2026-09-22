import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import MediaFrame from '../ui/MediaFrame';
import { Modal } from '../ui/Modal';
import apiClient, { queryKeys } from '../../services/apiClient';

const ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-1', 'rotate-1', 'rotate-0'];

function formatArchiveDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  }).format(new Date(value));
}

export default function VisualTimeline({ specimenId, specimenName }) {
  const [expandedEntry, setExpandedEntry] = useState(null);
  const query = useInfiniteQuery({
    queryKey: queryKeys.visualEntries.bySpecimen(specimenId),
    queryFn: ({ pageParam = 1 }) => apiClient.get('/api/visual-entries/', { params: { specimen_id: specimenId, page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) => last.next ? new URL(last.next, window.location.origin).searchParams.get('page') : undefined,
    enabled: Boolean(specimenId),
  });
  const entries = query.data?.pages.flatMap((page) => page.results || []) || [];
  return <section aria-labelledby="visual-timeline-heading" className="space-y-5">
    <div className="flex items-center gap-4">
      <div className="-rotate-1 border-4 border-charcoal bg-coral px-4 py-2 text-charcoal shadow-hard-sm">
        <h2 id="visual-timeline-heading" className="text-lg font-bold uppercase tracking-wide">Linha do tempo visual</h2>
      </div>
      <div className="h-1 flex-1 bg-charcoal" aria-hidden="true" />
    </div>
    {query.isLoading ? <p role="status" aria-label="Carregando linha do tempo visual" className="animate-pulse text-xs font-bold uppercase tracking-wider text-charcoal/60 motion-reduce:animate-none">Carregando linha do tempo visual</p> : query.isError ? <div className="space-y-3"><p role="alert" className="border-l-4 border-critical pl-3 font-semibold">Não foi possível carregar as fotos.</p><Button size="sm" onClick={() => query.refetch()}>Tentar novamente</Button></div> : (
      <>
        {entries.length === 0 && <p className="mb-4 text-sm font-semibold text-charcoal/70">Nenhuma foto registrada. Registre uma observação com imagem para iniciar a linha do tempo visual.</p>}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {entries.map((entry, index) => (
            <article key={entry.id} className={`group relative min-w-0 pt-6 transition-transform duration-75 ${ROTATIONS[index % ROTATIONS.length]} hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none`}>
              <time dateTime={entry.captured_at} className="absolute right-0 top-0 z-10 max-w-full bg-charcoal px-1.5 py-1 text-right font-mono text-[10px] font-bold uppercase leading-tight text-offwhite">
                {formatArchiveDate(entry.captured_at)}
              </time>
              <div className="border-4 border-charcoal bg-surface p-1 shadow-hard-sm">
                <button type="button" onClick={() => setExpandedEntry(entry)} aria-label={`Ampliar foto de ${specimenName} registrada em ${formatArchiveDate(entry.captured_at)}`} className="block w-full cursor-zoom-in border-0 bg-transparent p-0 focus-visible:ring-4 focus-visible:ring-primary">
                  <MediaFrame src={entry.image} alt={`Registro visual de ${specimenName}`} aspect="square" fit="contain" className="border-0 transition-transform duration-150 group-hover:scale-[1.02] motion-reduce:transition-none" />
                </button>
                <p className="border-t-2 border-charcoal bg-gray-100 px-1 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider">Registro visual</p>
                {entry.notes && <p className="break-words px-1 pb-2 pt-2 text-sm">{entry.notes}</p>}
              </div>
            </article>
          ))}
        </div>
        {query.hasNextPage && <Button id="visual-load-more" className="mt-5" size="sm" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}</Button>}
        <Modal open={Boolean(expandedEntry)} onClose={() => setExpandedEntry(null)} title={`Registro visual — ${specimenName}`} className="max-w-4xl">
          {expandedEntry && <figure>
            <div className="flex max-h-[70vh] min-h-64 items-center justify-center border-4 border-charcoal bg-charcoal p-2">
              <img src={expandedEntry.image} alt={`Registro visual ampliado de ${specimenName}`} className="max-h-[66vh] w-full object-contain" />
            </div>
            <figcaption className="mt-4 flex flex-wrap items-start justify-between gap-3 border-l-4 border-coral pl-3">
              <div>{expandedEntry.notes && <p className="font-medium">{expandedEntry.notes}</p>}<time dateTime={expandedEntry.captured_at} className="mt-1 block font-mono text-xs font-bold uppercase tracking-wider text-charcoal/60">{formatArchiveDate(expandedEntry.captured_at)}</time></div>
              <span className="border-2 border-charcoal bg-lime px-2 py-1 font-mono text-[10px] font-bold uppercase shadow-hard-sm">Visual ampliado</span>
            </figcaption>
          </figure>}
        </Modal>
      </>
    )}
  </section>;
}
