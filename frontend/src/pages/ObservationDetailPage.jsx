import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import ContentState from '../components/ui/ContentState';
import MediaFrame from '../components/ui/MediaFrame';
import { Button } from '../components/ui/Button';
import EvidenceSection from '../components/observation/EvidenceSection';
import HypothesisSection from '../components/observation/HypothesisSection';
import LocationPicker from '../components/observation/LocationPicker';
import ObservationMap from '../components/observation/ObservationMap';
import ObservationKeyRuns from '../components/identification/ObservationKeyRuns';
import { formatObservationDate, observationError } from '../components/observation/observationUtils';
import { fetchObservation, queryKeys, updateObservation } from '../services/apiClient';

const emptyLocation = { latitude: '', longitude: '' };

export default function ObservationDetailPage() {
  const { observationId } = useParams();
  const queryClient = useQueryClient();
  const observation = useQuery({ queryKey: queryKeys.observations.detail(observationId), queryFn: () => fetchObservation(observationId) });
  const onChanged = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.observations.detail(observationId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.observations.all }),
  ]);
  const [composer, setComposer] = useState(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState(emptyLocation);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const update = useMutation({
    mutationFn: (payload) => updateObservation(observationId, payload),
    onSuccess: async () => { setEditing(false); setError(''); await onChanged(); },
    onError: (requestError) => setError(observationError(requestError)),
  });
  const openComposer = (which) => {
    setComposer(which);
    if (which) globalThis.requestAnimationFrame?.(() => document.getElementById(`observation-${which}`)?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }));
  };
  if (observation.isPending) return <PageContainer><ContentState status="loading" busyLabel="Carregando observação" /></PageContainer>;
  if (observation.isError) return <PageContainer><ContentState status="error" title="Não foi possível carregar a observação." action={<Button onClick={() => observation.refetch()}>Tentar novamente</Button>} /></PageContainer>;
  const data = observation.data;
  const active = data.hypotheses.filter((item) => !item.discarded_at);
  const startEdit = () => { setTitle(data.title); setLocation({ latitude: data.latitude ?? '', longitude: data.longitude ?? '' }); setError(''); setEditing(true); };
  const save = (event) => {
    event.preventDefault();
    if (!title.trim()) { setError('Informe um título.'); return; }
    if (Boolean(location.latitude) !== Boolean(location.longitude)) { setError('Informe latitude e longitude juntas.'); return; }
    update.mutate({ title: title.trim(), latitude: location.latitude || null, longitude: location.longitude || null });
  };
  return <PageContainer width="wide" className="space-y-8">
    <Link to="/specimens" className="inline-block border-b-2 border-charcoal font-bold">← Todas as observações</Link>
    <PageHeader eyebrow={data.species_detail ? 'Espécie confirmada' : 'Identificação em andamento'} title={data.title} description={data.species_detail?.scientific_name || `Observada em ${formatObservationDate(data.observed_at)}`} primaryAction={<Button variant="lime" size="sm" onClick={() => openComposer('evidence')}>Adicionar evidência</Button>} secondaryActions={<Button size="sm" variant="secondary" onClick={startEdit}>Editar ficha</Button>} />
    {editing && <form onSubmit={save} className="space-y-4 border-l-4 border-primary bg-surface px-4 py-5"><h2 className="font-bold uppercase">Editar ficha</h2><label className="block font-bold" htmlFor="edit-observation-title">Título<input id="edit-observation-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} className="mt-2 w-full border-2 border-charcoal bg-offwhite px-3 py-2" /></label><LocationPicker id="main-location" value={location} onChange={setLocation} />{error && <p role="alert" className="font-bold text-critical">{error}</p>}<div className="flex flex-wrap gap-3"><Button type="submit" variant="lime" disabled={update.isPending}>Salvar</Button><Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button></div></form>}
    <section className="grid gap-5 border-b-2 border-charcoal/25 pb-7 md:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.2fr)]" aria-label="Resumo da observação">
      <MediaFrame src={data.image} alt={`Foto recente de ${data.title}`} aspect="card" className="max-h-80" />
      <div className="flex flex-col justify-center gap-4">
        <div><p className="font-mono text-xs font-bold uppercase text-charcoal/60">Situação atual</p><p className="mt-1 text-xl font-bold">{data.species_detail ? <i>{data.species_detail.scientific_name}</i> : 'Identificação em andamento'}</p></div>
        <div><p className="font-mono text-xs font-bold uppercase text-charcoal/60">Hipóteses ativas · {active.length}</p>{active.length ? <ul className="mt-2 flex flex-wrap gap-2">{active.slice(0, 4).map((item) => <li key={item.id} className="border-2 border-charcoal bg-coral px-2 py-1 text-sm font-bold">{item.name}</li>)}{active.length > 4 && <li className="px-2 py-1 text-sm">+{active.length - 4}</li>}</ul> : <p className="mt-1 text-sm">Nenhum palpite registrado.</p>}</div>
        <p className="font-mono text-xs uppercase text-charcoal/60">{data.evidence.length} evidências · Atualizada em {formatObservationDate(data.updated_at || data.observed_at)}</p>
        <div className="flex flex-wrap gap-2"><Button size="sm" variant="lime" onClick={() => openComposer('hypotheses')}>Novo palpite</Button><Button size="sm" variant="secondary" onClick={() => openComposer('evidence')}>Registrar mudança na planta</Button></div>
      </div>
    </section>
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
      <EvidenceSection observation={data} onChanged={onChanged} composerOpen={composer === 'evidence'} onComposerChange={(open) => setComposer(open ? 'evidence' : null)} />
      <HypothesisSection observation={data} onChanged={onChanged} composerOpen={composer === 'hypotheses'} onComposerChange={(open) => setComposer(open ? 'hypotheses' : null)} />
    </div>
    <ObservationKeyRuns observation={data} onChanged={onChanged} />
    <ObservationMap observation={data} />
  </PageContainer>;
}
