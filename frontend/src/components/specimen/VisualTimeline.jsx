import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import MediaFrame from '../ui/MediaFrame';
import { Icon } from '../ui/Icon';
import apiClient, { queryKeys } from '../../services/apiClient';

const ROTATIONS = ['-rotate-1', 'rotate-1', '-rotate-1', 'rotate-1', 'rotate-0'];

function formatArchiveDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  }).format(new Date(value));
}

export default function VisualTimeline({ specimenId, specimenName, onAdd }) {
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
      <div className="border-4 border-charcoal bg-primary px-4 py-2 text-offwhite shadow-hard-sm">
        <h2 id="visual-timeline-heading" className="text-lg font-bold uppercase tracking-wide">Linha do tempo visual</h2>
      </div>
      <div className="h-1 flex-1 bg-charcoal" aria-hidden="true" />
    </div>
    {query.isLoading ? <p role="status" aria-label="Carregando linha do tempo visual" className="animate-pulse text-xs font-bold uppercase tracking-wider text-charcoal/60 motion-reduce:animate-none">Carregando linha do tempo visual</p> : query.isError ? <div className="space-y-3"><p role="alert" className="border-l-4 border-critical pl-3 font-semibold">Não foi possível carregar as fotos.</p><Button size="sm" onClick={() => query.refetch()}>Tentar novamente</Button></div> : (
      <>
        {entries.length === 0 && <p className="mb-4 text-sm font-semibold text-charcoal/70">Nenhuma foto registrada. Adicione uma imagem para iniciar a linha do tempo.</p>}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {entries.map((entry, index) => (
            <article key={entry.id} className={`group relative min-w-0 pt-6 transition-transform duration-75 ${ROTATIONS[index % ROTATIONS.length]} hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none`}>
              <time dateTime={entry.captured_at} className="absolute right-0 top-0 z-10 max-w-full bg-charcoal px-1.5 py-1 text-right font-mono text-[10px] font-bold uppercase leading-tight text-offwhite">
                {formatArchiveDate(entry.captured_at)}
              </time>
              <div className="border-4 border-charcoal bg-offwhite p-1 shadow-hard-sm">
                <MediaFrame src={entry.image} alt={`Registro visual de ${specimenName}`} aspect="square" fit="contain" className="border-0" />
                <p className="border-t-2 border-charcoal bg-gray-100 px-1 py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider">Registro visual</p>
                {entry.notes && <p className="break-words px-1 pb-2 pt-2 text-sm">{entry.notes}</p>}
              </div>
            </article>
          ))}
          <button id="visual-entry-open" type="button" aria-label="Adicionar foto" onClick={onAdd} className="group flex aspect-square min-w-0 rotate-1 flex-col items-center justify-center gap-3 border-4 border-dashed border-charcoal bg-gray-100 p-4 text-center font-mono text-xs font-bold uppercase tracking-wider transition-colors duration-75 hover:bg-lime focus-visible:bg-lime motion-reduce:transition-none">
            <Icon name="camera" size={36} />
            <span>LOG FOTO</span>
          </button>
        </div>
        {query.hasNextPage && <Button id="visual-load-more" className="mt-5" size="sm" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}</Button>}
      </>
    )}
  </section>;
}
