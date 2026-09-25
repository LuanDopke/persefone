import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { answerObservationKeyRun, listIdentificationKeys, listObservationKeyRuns, queryKeys, startObservationKeyRun } from '../../services/apiClient';

function errorMessage(error) {
  const data = error.response?.data;
  return typeof data?.detail === 'string' ? data.detail : Object.values(data || {}).flat().join(' ') || 'Não foi possível atualizar o percurso.';
}

function answerSummary(graph, answers) {
  return answers.map((answer) => {
    if (graph.type === 'multi_access') {
      const descriptor = graph.descriptors.find((item) => item.id === answer.descriptor_id);
      const labels = descriptor?.states.filter((state) => answer.state_ids.includes(state.id)).map((state) => state.label).join(', ');
      return `${descriptor?.label || answer.descriptor_id}: ${labels || 'Resposta removida'}`;
    }
    const step = graph.steps.find((item) => item.id === answer.step_id);
    return `${step?.prompt || answer.step_id}: ${step?.choices[answer.choice_index]?.text || 'Resposta removida'}`;
  }).join(' · ') || 'Nenhuma resposta';
}

function RunCard({ run, observation, refresh }) {
  const [correctIndex, setCorrectIndex] = useState(null);
  const [evidenceId, setEvidenceId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isMulti = run.key_type === 'multi_access';
  const genusResult = run.result_taxon?.rank === 'genus' ? run.result_taxon : null;
  const followUps = useQuery({
    queryKey: queryKeys.identificationKeys.list({ scope_rank: 'genus', scope_gbif_key: genusResult?.key }),
    queryFn: () => listIdentificationKeys({ scope_rank: 'genus', scope_gbif_key: genusResult.key }),
    enabled: Boolean(genusResult) && run.status !== 'superseded',
  });
  const step = run.status === 'superseded' ? null : correctIndex == null ? run.step : isMulti
    ? run.graph.descriptors.find((item) => item.id === run.answers[correctIndex].descriptor_id)
    : run.graph.steps.find((item) => item.id === run.answers[correctIndex].step_id);
  const record = async (selection) => {
    setBusy(true); setError('');
    try {
      await answerObservationKeyRun(observation.id, run.id, {
        ...(correctIndex == null ? {} : { index: correctIndex }),
        ...(isMulti ? { descriptor_id: step.id, state_ids: selection == null ? null : [selection] }
          : { step_id: step.id, choice_index: selection }),
        evidence_id: evidenceId || null, note,
      }, correctIndex != null);
      setCorrectIndex(null); setEvidenceId(''); setNote(''); await refresh();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };
  const continueFromGenus = async (keyId) => {
    setBusy(true); setError('');
    const key = followUps.data?.results.find((item) => item.id === keyId);
    try { await startObservationKeyRun(observation.id, key?.version_id, run.id); await refresh(); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };
  return <li className="space-y-4 border-l-4 border-primary bg-surface p-4">
    <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-bold">{run.key_title}</h3><p className="text-xs">Versão {run.version_number} · {run.scope_name} · {run.status === 'completed' ? 'Concluída' : run.status === 'paused' ? 'Aguardando observação' : run.status === 'superseded' ? 'Substituída' : 'Em andamento'}</p></div><Link to={`/keys/${run.key_id}`} className="text-sm font-bold underline">Ver chave</Link></div>
    {run.answers.length > 0 && <details><summary className="cursor-pointer font-bold">Percurso salvo ({run.answers.length})</summary><ol className="mt-2 space-y-2">{run.answers.map((answer, index) => {
      const previous = isMulti ? run.graph.descriptors.find((item) => item.id === answer.descriptor_id) : run.graph.steps.find((item) => item.id === answer.step_id);
      const responseText = isMulti ? previous?.states.filter((state) => answer.state_ids.includes(state.id)).map((state) => state.label).join(', ') : previous?.choices[answer.choice_index]?.text;
      return <li key={index} className="border-l-2 border-charcoal/30 pl-3 text-sm"><strong>{isMulti ? previous?.label : previous?.prompt}</strong><p>{responseText}</p>{answer.note && <p>{answer.note}</p>}{answer.evidence_id && <p>Evidência vinculada</p>}{run.status !== 'superseded' && <Button size="sm" variant="secondary" className="mt-2" onClick={() => { setCorrectIndex(index); setEvidenceId(answer.evidence_id || ''); setNote(answer.note || ''); }}>Corrigir resposta</Button>}</li>;
    })}</ol></details>}
    {run.revisions.length > 0 && <details><summary className="cursor-pointer text-sm font-bold">Correções do percurso ({run.revisions.length})</summary><ol className="mt-2 space-y-2 text-sm">{run.revisions.map((revision) => <li key={revision.id} className="border-l-2 border-charcoal/30 pl-3"><p className="font-bold">{new Date(revision.created_at).toLocaleDateString('pt-BR')}</p><p>Antes: {answerSummary(run.graph, revision.before.answers)}</p><p>Depois: {answerSummary(run.graph, revision.after.answers)}</p></li>)}</ol></details>}
    {run.status === 'paused' && run.pending_note && <p className="border-l-4 border-amber pl-3 text-sm">Pendente: {run.pending_note}</p>}
    {isMulti && run.remaining_taxa && <details><summary className="cursor-pointer text-sm font-bold">Táxons restantes ({run.remaining_taxa.length})</summary><p className="mt-2 text-sm">{run.remaining_taxa.slice(0, 20).map((taxon) => taxon.name).join(' · ')}{run.remaining_taxa.length > 20 && '…'}</p></details>}
    {step && <div className="space-y-3 border-t-2 border-charcoal/20 pt-3"><h4 className="font-bold">{correctIndex == null ? 'Próxima característica' : `Corrigir resposta ${correctIndex + 1}`}: {isMulti ? step.label : step.prompt}</h4>
      <div role="group" aria-label="Escolha a característica" className="grid gap-2 sm:grid-cols-2">{(isMulti ? step.states : step.choices).map((choice, index) => { const selected = isMulti ? run.answers[correctIndex]?.state_ids?.includes(choice.id) : run.answers[correctIndex]?.choice_index === index; return <button type="button" key={choice.id || index} aria-pressed={correctIndex != null && selected} disabled={busy} onClick={() => record(isMulti ? choice.id : index)} className={`border-2 border-charcoal px-3 py-2 text-left font-bold disabled:opacity-60 ${correctIndex != null && selected ? 'bg-mint' : 'bg-surface hover:bg-gray-100'}`}>{isMulti ? choice.label : choice.text}</button>; })}</div>
      <label className="block text-sm font-bold">Nota da resposta (opcional)<textarea value={note} onChange={(event) => setNote(event.target.value)} rows="2" className="mt-2 w-full border-2 border-charcoal bg-offwhite px-3 py-2" /></label>
      {observation.evidence.length > 0 && <details><summary className="cursor-pointer text-sm font-bold">Vincular uma evidência (opcional)</summary><div className="mt-2 max-h-40 space-y-2 overflow-auto">{observation.evidence.map((item) => <Button key={item.id} size="sm" variant={evidenceId === item.id ? 'lime' : 'secondary'} aria-pressed={evidenceId === item.id} onClick={() => setEvidenceId(evidenceId === item.id ? '' : item.id)}>{item.subject === 'comparison' ? 'Outro indivíduo' : 'Planta principal'} · {new Date(item.observed_at).toLocaleDateString('pt-BR')} · {item.notes.slice(0, 35)}</Button>)}</div></details>}
      {correctIndex == null && <Button size="sm" variant="secondary" disabled={busy} onClick={() => record(null)}>Ainda não consigo observar · pausar</Button>}
      {correctIndex != null && <Button size="sm" variant="secondary" onClick={() => setCorrectIndex(null)}>Cancelar correção</Button>}
    </div>}
    {isMulti && !step && !run.result_taxon && run.status !== 'superseded' && <p className="border-l-4 border-amber p-3 text-sm">As características respondidas não produziram um único táxon. Corrija uma resposta ou revise a matriz.</p>}
    {run.result_taxon && <div className="space-y-2 border-l-4 border-charcoal bg-mint p-3"><p className="font-bold">Resultado: <i>{run.result_taxon.name}</i></p><p className="text-sm">{run.status === 'superseded' ? 'Este resultado foi substituído após uma correção anterior.' : 'Palpite registrado na ficha. A confirmação da espécie continua manual.'}</p>{genusResult && run.status !== 'superseded' && (followUps.data?.results.length ? <div className="flex flex-wrap gap-2">{followUps.data.results.map((key) => <Button key={key.id} size="sm" variant="lime" disabled={busy} onClick={() => continueFromGenus(key.id)}>Continuar com {key.title}</Button>)}</div> : <p className="text-sm">Ainda não há chave publicada para este gênero.</p>)}</div>}
    {error && <p role="alert" className="font-bold text-critical">{error}</p>}
  </li>;
}

export default function ObservationKeyRuns({ observation, onChanged }) {
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const runs = useQuery({ queryKey: queryKeys.identificationKeys.runs(observation.id), queryFn: () => listObservationKeyRuns(observation.id) });
  const keys = useQuery({ queryKey: queryKeys.identificationKeys.list({ search }), queryFn: () => listIdentificationKeys({ search: search.trim() }) });
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: queryKeys.identificationKeys.runs(observation.id) });
    await onChanged();
  };
  const start = async (versionId) => {
    setBusy(true); setError('');
    try { await startObservationKeyRun(observation.id, versionId); await refresh(); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  };
  return <section className="space-y-5" aria-label="Chaves de identificação"><div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-charcoal/25 pb-3"><div className="max-w-2xl"><h2 className="text-xl font-bold uppercase">Chaves de identificação</h2><p className="mt-1 text-sm text-charcoal/70">Uma chave compara características visíveis em uma sequência de perguntas. O resultado vira um palpite, que você ainda pode revisar antes de confirmar a espécie.</p></div><Link to="/keys" className="font-bold underline">Explorar todas as chaves →</Link></div>
    <div className="space-y-3"><div><h3 className="font-bold uppercase">Iniciar uma chave</h3><p className="mt-1 text-sm text-charcoal/70">Busque pelo grupo da planta ou pelo título. Se uma característica ainda não estiver visível, pause o percurso e retome quando ela aparecer.</p></div><label className="block max-w-lg font-bold">Buscar por grupo ou título<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 w-full border-2 border-charcoal bg-offwhite px-3 py-2" /></label>
      {keys.isPending && <p role="status">Carregando chaves disponíveis…</p>}
      {keys.isError && <p role="alert">Não foi possível carregar as chaves.</p>}
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{keys.data?.results.map((key) => <li key={key.id} className="space-y-2 border-2 border-charcoal bg-surface p-3"><p className="text-xs uppercase">{key.scope_rank === 'family' ? 'Família' : 'Gênero'} · {key.scope_name}</p><p className="font-bold">{key.title}</p><Button size="sm" variant="secondary" disabled={busy || !key.version_id} onClick={() => start(key.version_id)}>{busy ? 'Iniciando…' : 'Iniciar'}</Button></li>)}</ul>
      {keys.data && !keys.data.results.length && <p>Nenhuma chave encontrada.</p>}
    </div>
    {error && <p role="alert" className="font-bold text-critical">{error}</p>}
    <div className="space-y-3"><h3 className="font-bold uppercase">Percursos desta observação</h3>{runs.isPending ? <p role="status">Carregando percursos…</p> : runs.isError ? <p role="alert">Não foi possível carregar os percursos.</p> : runs.data.length ? <ol className="space-y-4">{runs.data.map((run) => <RunCard key={run.id} run={run} observation={observation} refresh={refresh} />)}</ol> : <p className="border-2 border-dashed border-charcoal p-4">Nenhum percurso iniciado.</p>}</div>
  </section>;
}
