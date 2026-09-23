/**
 * CareLogTimeline — Displays chronological care events for a specimen.
 * Constitution Principle III: Modular, reusable timeline component.
 * Constitution Principle V: Immutable historical care timestamps.
 */

import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import apiClient, { queryKeys } from '../../services/apiClient';
import Alert from '../ui/Alert';
import { Icon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { getCareActivity } from '../../config/careActivities';

function formatArchiveDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

export default function CareLogTimeline({ specimenId, composer }) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const query = useInfiniteQuery({
    queryKey: queryKeys.careLogs.bySpecimen(specimenId),
    queryFn: ({ pageParam = 1 }) => apiClient.get('/api/care-logs/', { params: { specimen_id: specimenId, page: pageParam } }).then((r) => r.data),
    initialPageParam: 1,
    getNextPageParam: (last) => last.next ? new URL(last.next, window.location.origin).searchParams.get('page') : undefined,
    enabled: Boolean(specimenId),
  });
  const logs = query.data?.pages.flatMap((page) => page.results || []) || [];
  const deleteMutation = useMutation({
    mutationFn: (logId) => apiClient.delete(`/api/care-logs/${logId}/`, { params: { specimen_id: specimenId } }),
    onSuccess: async () => {
      setDeleteTarget(null);
      setDeleteError('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.careLogs.bySpecimen(specimenId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.specimens.detail(specimenId) }),
      ]);
    },
    onError: () => setDeleteError('Não foi possível excluir a observação. Tente novamente.'),
  });

  return (
    <section aria-labelledby="care-log-heading" className="space-y-6">
      <div className="ink-speckle flex items-center justify-between gap-4 border-4 border-charcoal bg-primary px-4 py-2 text-offwhite shadow-hard-sm">
        <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-lime">Caderno de campo</p><h2 id="care-log-heading" className="text-lg font-bold uppercase tracking-wide">Histórico de crescimento e cuidados</h2></div>
        <span className="grid h-11 w-11 shrink-0 rotate-2 place-items-center border-2 border-charcoal bg-lime text-charcoal shadow-[3px_3px_0_#FFFDF5]"><Icon name="history" size={24} /></span>
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
        <div className="relative space-y-7 before:absolute before:bottom-5 before:left-[1.35rem] before:top-5 before:w-1 before:bg-charcoal before:content-['']">
          {logs.map((log, index) => {
            const activity = getCareActivity(log.type);
            return (
              <article key={log.id} className="relative z-10 grid min-w-0 grid-cols-[2.9rem_minmax(0,1fr)] items-start gap-3">
                <div className={`grid h-11 w-11 place-items-center border-4 border-charcoal shadow-hard-sm ${activity.solid} ${index % 2 ? 'rotate-2' : '-rotate-2'}`} aria-hidden="true">
                  <Icon name={activity.icon} size={22} />
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <time dateTime={log.occurred_at} className={`inline-block border-2 border-charcoal px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest shadow-hard-sm ${activity.solid}`}>{formatArchiveDate(log.occurred_at)}</time>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-charcoal/50">Registro {String(logs.length - index).padStart(2, '0')}</span>
                  </div>
                  <div className={`analog-hover overflow-hidden border-4 border-charcoal shadow-hard ${activity.panel}`}>
                    <div className={`flex items-center justify-between gap-3 border-b-4 border-charcoal px-4 py-2 ${activity.solid}`}>
                      <h3 className="text-base font-extrabold uppercase tracking-wide">{activity.label || log.type_display || log.type}</h3>
                      <Icon name={activity.icon} size={20} aria-hidden="true" />
                    </div>
                    <div className="p-4">
                      {log.notes ? <p className="text-sm font-medium leading-relaxed text-charcoal/80">{log.notes}</p> : <p className="font-mono text-xs uppercase tracking-wide text-charcoal/50">Sem observações adicionais.</p>}
                      {log.visual_entry?.image && <img src={log.visual_entry.image} alt={`Foto anexada ao registro de ${activity.label.toLocaleLowerCase()}`} className="mt-4 max-h-48 w-full border-4 border-charcoal bg-surface object-contain" />}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-charcoal/40 pt-3">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal/60">Incluído no arquivo em {formatArchiveDate(log.created_at)}</span>
                        <Button size="sm" variant="danger" onClick={() => { setDeleteError(''); setDeleteTarget(log); }} aria-label={`Excluir ${activity.label.toLocaleLowerCase()} de ${formatArchiveDate(log.occurred_at)}`} title={`Excluir ${activity.label.toLocaleLowerCase()}`} className="min-h-11 min-w-11 px-2 py-2"><Icon name="trash" size={20} /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {query.hasNextPage && <Button id="care-load-more" size="sm" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}</Button>}
        </div>
      )}
      <Modal open={Boolean(deleteTarget)} onClose={deleteMutation.isPending ? () => {} : () => setDeleteTarget(null)} title="Excluir registro">
        <p>Este registro será removido do caderno de campo{deleteTarget?.visual_entry ? ' junto com a foto vinculada' : ''}. Esta ação não pode ser desfeita.</p>
        {deleteTarget?.notes && <p className="mt-4 border-l-4 border-primary pl-3 text-sm font-medium">{deleteTarget.notes}</p>}
        {deleteError && <Alert tone="critical" className="mt-4">{deleteError}</Alert>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancelar</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? 'Excluindo…' : 'Excluir definitivamente'}</Button>
        </div>
      </Modal>
    </section>
  );
}
