/**
 * CareLogTimeline — Displays chronological care events for a specimen.
 * Constitution Principle III: Modular, reusable timeline component.
 * Constitution Principle V: Immutable historical care timestamps.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import apiClient, { queryKeys } from '../../services/apiClient';
import Alert from '../ui/Alert';
import { Icon } from '../ui/Icon';

const CARE_ICONS = {
  watering: '💧',
  fertilizing: '🌿',
  repotting: '🪴',
  pruning: '✂',
  observation: '👁',
};

const CARE_COLORS = {
  watering: 'border-info',
  fertilizing: 'border-botanical',
  repotting: 'border-amber',
  pruning: 'border-critical',
  observation: 'border-gray-400',
};

const CARE_LABELS = { watering: 'Rega', fertilizing: 'Adubação', repotting: 'Replante', pruning: 'Poda', observation: 'Observação' };

function formatArchiveDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
  }).format(new Date(value));
}

export default function CareLogTimeline({ specimenId, composer }) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.careLogs.bySpecimen(specimenId),
    queryFn: ({ pageParam = 1 }) => apiClient.get('/api/care-logs/', { params: { specimen_id: specimenId, page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) => last.next ? new URL(last.next, window.location.origin).searchParams.get('page') : undefined,
    enabled: Boolean(specimenId),
  });
  const logs = query.data?.pages.flatMap((page) => page.results || []) || [];

  return (
    <section aria-labelledby="care-log-heading" className="space-y-6">
      <div className="flex items-center justify-between gap-4 border-4 border-charcoal bg-charcoal px-4 py-2 text-offwhite shadow-hard-sm">
        <h2 id="care-log-heading" className="text-lg font-bold uppercase tracking-wide">Histórico de crescimento e cuidados</h2>
        <Icon name="history" size={24} />
      </div>
      {composer}
      {query.isLoading ? (
        <p role="status" className="animate-pulse text-xs font-bold uppercase tracking-wider text-charcoal/60 motion-reduce:animate-none">
          Carregando histórico de atividades
        </p>
      ) : query.isError ? (
        <div className="space-y-3"><Alert tone="critical">Não foi possível carregar as atividades.</Alert><Button size="sm" onClick={() => query.refetch()}>Tentar novamente</Button></div>
      ) : logs.length === 0 ? (
        <p className="text-sm font-semibold text-charcoal/70">Nenhuma atividade registrada. Use uma ação de cuidado para iniciar o histórico.</p>
      ) : (
        <div className="space-y-6">
          {logs.map((log) => (
            <article
              key={log.id}
              className="relative border-l-4 border-charcoal pl-6"
            >
              <span className={`absolute -left-[11px] top-0 h-5 w-5 border-4 border-charcoal bg-offwhite ${CARE_COLORS[log.type] || 'bg-lime'}`} aria-hidden="true" />
              <time dateTime={log.occurred_at} className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-charcoal/60">{formatArchiveDate(log.occurred_at)}</time>
              <div className="border-4 border-charcoal bg-offwhite p-4 shadow-hard-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-charcoal">
                    <span aria-hidden="true">{CARE_ICONS[log.type] || '📋'}</span>{' '}
                    <span>{CARE_LABELS[log.type] || log.type_display || log.type}</span>
                  </p>
                </div>
                {log.notes && (
                  <p className="mt-3 text-sm leading-relaxed text-charcoal/80">{log.notes}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="border-2 border-charcoal bg-gray-100 px-1.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider">Ocorrência</span>
                  <span className="border-2 border-charcoal bg-green-50 px-1.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider">Registrado {formatArchiveDate(log.created_at)}</span>
                </div>
              </div>
            </article>
          ))}
          {query.hasNextPage && <Button id="care-load-more" size="sm" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}</Button>}
        </div>
      )}
    </section>
  );
}
