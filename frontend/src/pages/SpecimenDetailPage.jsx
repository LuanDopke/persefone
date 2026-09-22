import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import apiClient, { queryKeys, updateSpecimen } from '../services/apiClient';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import ContentState from '../components/ui/ContentState';
import MediaFrame from '../components/ui/MediaFrame';
import SpecimenMetrics from '../components/specimen/SpecimenMetrics';
import CareLogTimeline from '../components/specimen/CareLogTimeline';
import VisualTimeline from '../components/specimen/VisualTimeline';
import CareActivityForm from '../components/specimen/CareActivityForm';
import SpecimenEditForm from '../components/specimen/SpecimenEditForm';
import { Icon } from '../components/ui/Icon';
import { getCareActivity, QUICK_CARE_TYPES } from '../config/careActivities';

const QUICK_CARE_ACTIONS = QUICK_CARE_TYPES.map(getCareActivity);

function QuickCareButton({ action, onClick, latestCare, selected }) {
  const latest = latestCare?.type === action.type && latestCare.occurred_at
    ? new Date(latestCare.occurred_at).toLocaleString()
    : 'Ainda não registrado';
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="care"
      aria-pressed={selected}
      className={`w-full justify-between gap-3 px-4 py-3 text-left normal-case aria-pressed:translate-x-[3px] aria-pressed:translate-y-[3px] aria-pressed:shadow-hard-pressed ${selected ? action.activeButton : ''}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center border-2 border-charcoal ${action.solid}`}><Icon name={action.icon} size={20} /></span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold uppercase">{action.label}</span>
          <span className="mt-1 block truncate font-mono text-[10px] font-bold uppercase tracking-wider text-charcoal/60">{latest}</span>
        </span>
      </span>
      <span aria-hidden="true" className="font-mono text-lg">→</span>
    </Button>
  );
}

export default function SpecimenDetailPage() {
  const { specimenId } = useParams();
  const [careType, setCareType] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const queryClient = useQueryClient();
  const specimen = useQuery({
    queryKey: queryKeys.specimens.detail(specimenId),
    queryFn: () => apiClient.get(`/api/specimens/${specimenId}/`).then((response) => response.data),
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateSpecimen({ specimenId, payload }),
    onSuccess: async () => {
      setUpdateError('');
      setEditOpen(false);
      setArchiveOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.specimens.detail(specimenId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.specimens.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.collection.all }),
      ]);
    },
    onError: (error) => {
      setUpdateError(error.response?.status === 409
        ? 'O exemplar foi alterado por outra sessão. Recarregue os dados e tente novamente.'
        : 'Não foi possível salvar as alterações. Tente novamente.');
    },
  });

  if (specimen.isLoading) return <PageContainer width="wide" className="space-y-8"><PageHeader title="Detalhe do exemplar" /><ContentState status="loading" busyLabel="Carregando exemplar" /></PageContainer>;
  if (specimen.isError) return <PageContainer width="wide" className="space-y-8"><PageHeader title="Detalhe do exemplar" /><ContentState status="error" title="Não foi possível carregar o exemplar." action={<Button onClick={() => specimen.refetch()}>Tentar novamente</Button>} /></PageContainer>;

  const data = specimen.data;
  const visual = data.representative_visual_entry || data.initial_visual_entry;
  const speciesName = data.species_detail?.scientific_name || 'Espécie não informada';
  const specimenDescription = [data.description, data.species_detail?.description]
    .find((value) => typeof value === 'string' && value.trim())
    || data.latest_care_log?.notes
    || 'Sem descrição ou observações registradas.';
  const saveEdits = (payload) => updateMutation.mutateAsync(payload);
  const toggleArchive = () => updateMutation.mutate({ is_active: data.is_active === false, expected_updated_at: data.updated_at });
  return (
    <PageContainer width="wide" className="space-y-10">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <PageHeader
          eyebrow={<><span className="mr-2 inline-block bg-charcoal px-2 py-1 text-offwhite">ID: {data.id}</span><span className={data.is_active === false ? 'text-charcoal/60' : 'text-botanical'}>{data.is_active === false ? 'ARQUIVADO' : 'EXEMPLAR ATIVO'}</span></>}
          title={data.nickname}
          titleClassName="text-4xl md:text-5xl xl:text-6xl"
          description={<><span className="block italic">{speciesName}</span><span className="mt-3 block max-w-2xl not-italic leading-relaxed">{specimenDescription}</span></>}
          className="xl:pb-1"
          primaryAction={<Button id="specimen-edit" size="sm" onClick={() => { setUpdateError(''); setEditOpen(true); }}>Editar</Button>}
          secondaryActions={<Button id="specimen-archive-toggle" size="sm" variant="secondary" onClick={() => { setUpdateError(''); setArchiveOpen(true); }}>{data.is_active === false ? 'Reativar' : 'Arquivar'}</Button>}
        />
        <SpecimenMetrics specimen={data} />
      </section>
      {updateError && <div role="alert" className="border-4 border-critical bg-critical/10 p-3 font-semibold">{updateError}</div>}
      <VisualTimeline specimenId={specimenId} specimenName={data.nickname} />
      <section aria-label="Ações e resumo do exemplar" className="grid gap-8 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-4">
          <section aria-labelledby="care-actions-heading" className="space-y-6">
            <div className="w-full border-4 border-charcoal bg-secondary px-4 py-2 text-offwhite shadow-hard-sm">
              <h2 id="care-actions-heading" className="text-lg font-bold uppercase tracking-wide">Ações de cuidado</h2>
            </div>
            <div className="space-y-3">
              {QUICK_CARE_ACTIONS.map((action) => <QuickCareButton key={action.type} action={action} latestCare={data.latest_care_log} selected={careType === action.type} onClick={() => setCareType(action.type)} />)}
              <Button id="care-activity-open" size="sm" variant="care" aria-pressed={careType === 'observation'} className={`w-full ${careType === 'observation' ? getCareActivity('observation').activeButton : ''}`} onClick={() => setCareType('observation')}><span className={`mr-2 grid h-8 w-8 place-items-center border-2 border-charcoal ${getCareActivity('observation').solid}`}><Icon name={getCareActivity('observation').icon} size={18} /></span> Registrar observação</Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rotate-1 border-2 border-charcoal bg-mint px-2 py-1 font-mono text-[10px] font-bold uppercase text-charcoal shadow-hard-sm">Local: {data.location_in_home || 'Não informada'}</span>
              <span className="-rotate-1 border-2 border-charcoal bg-surface-variant px-2 py-1 font-mono text-[10px] font-bold uppercase text-charcoal shadow-hard-sm">Solo: {data.initial_soil || 'Não informado'}</span>
            </div>
          </section>
          <section aria-labelledby="specimen-summary-heading" className="space-y-4">
            <div className="w-full border-4 border-charcoal bg-surface-variant px-4 py-2 text-charcoal shadow-hard-sm">
              <h2 id="specimen-summary-heading" className="text-lg font-bold uppercase tracking-wide">Resumo do exemplar</h2>
            </div>
            <div className="space-y-4">
              <MediaFrame src={visual?.image || data.photo} alt={`Foto inicial de ${data.nickname}`} aspect="detail" fit="contain" />
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div><dt className="font-bold uppercase">Situação</dt><dd className="mt-1"><Badge status={data.is_active === false ? 'disabled' : 'stable'} label={data.is_active === false ? 'Arquivado' : 'Ativo'} /></dd></div>
                <div><dt className="font-bold uppercase">Aquisição</dt><dd className="mt-1">{data.acquired_at}</dd></div>
                <div><dt className="font-bold uppercase">Luz inicial</dt><dd className="mt-1 break-words">{data.initial_light || 'Não informada'}</dd></div>
                <div><dt className="font-bold uppercase">Identificação</dt><dd className="mt-1 break-all font-mono">{data.id}</dd></div>
                <div className="sm:col-span-2"><dt className="font-bold uppercase">Solo</dt><dd className="mt-1 break-words">{data.initial_soil || 'Não informado'}</dd></div>
              </dl>
            </div>
          </section>
        </aside>
        <div className="lg:col-span-8">
          <CareLogTimeline
            specimenId={specimenId}
            composer={<CareActivityForm specimenId={specimenId} initialType={careType || 'watering'} />}
          />
        </div>
      </section>
      <SpecimenEditForm open={editOpen} onClose={() => setEditOpen(false)} specimen={data} onSave={saveEdits} />
      <Modal open={archiveOpen} onClose={updateMutation.isPending ? () => {} : () => setArchiveOpen(false)} title={data.is_active === false ? 'Reativar exemplar' : 'Arquivar exemplar'}>
        <p className="mb-5">{data.is_active === false ? 'Deseja reativar este exemplar?' : 'Deseja arquivar este exemplar? Ele ficará fora das listas ativas.'}</p>
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setArchiveOpen(false)} disabled={updateMutation.isPending}>Cancelar</Button><Button variant="lime" onClick={toggleArchive} disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Salvando…' : data.is_active === false ? 'Reativar' : 'Arquivar'}</Button></div>
      </Modal>
    </PageContainer>
  );
}
