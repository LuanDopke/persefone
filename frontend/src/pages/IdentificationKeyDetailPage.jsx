import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import ContentState from '../components/ui/ContentState';
import { archiveIdentificationKey, decideKeySuggestion, fetchIdentificationKey, listKeySuggestions, queryKeys, reportIdentificationKey } from '../services/apiClient';

function GraphSummary({ graph }) {
  if (!graph) return <p className="border-2 border-dashed border-charcoal p-4">Esta chave ainda não foi publicada.</p>;
  if (graph.type === 'multi_access') return <div className="space-y-4"><p className="border-l-4 border-primary bg-mint/30 p-3">Chave de múltiplo acesso · {graph.descriptors.length} descritores · {graph.taxa.length} táxons.</p><div className="grid gap-3 md:grid-cols-2">{graph.descriptors.map((descriptor) => <article key={descriptor.id} className="border-2 border-charcoal bg-surface p-3"><h3 className="font-bold">{descriptor.label}</h3><p className="text-sm">{descriptor.states.map((state) => state.label).join(' · ')}</p></article>)}</div><details><summary className="cursor-pointer font-bold">Táxons contemplados</summary><ul className="mt-2 columns-1 text-sm sm:columns-2">{graph.taxa.map((taxon) => <li key={taxon.key}><i>{taxon.name}</i></li>)}</ul></details></div>;
  return <ol className="space-y-4">{graph.steps.map((step, index) => <li key={step.id} className="border-l-4 border-primary bg-surface p-4"><h3 className="font-bold">Passo {index + 1}{step.id === graph.start && ' · início'}: {step.prompt}</h3><ol className="mt-2 list-inside list-decimal space-y-1 text-sm">{step.choices.map((choice, position) => <li key={position}>{choice.text} → {choice.taxon ? <i>{choice.taxon.name}</i> : `Passo ${graph.steps.findIndex((candidate) => candidate.id === choice.next) + 1}`}</li>)}</ol></li>)}</ol>;
}

function SuggestionDiff({ before, after }) {
  if (before?.type === 'multi_access' || after?.type === 'multi_access') return <pre className="max-h-96 overflow-auto border-l-4 border-primary bg-mint p-3 text-xs whitespace-pre-wrap">{JSON.stringify(after, null, 2)}</pre>;
  const oldSteps = Object.fromEntries((before?.steps || []).map((step) => [step.id, step]));
  const newSteps = Object.fromEntries((after?.steps || []).map((step) => [step.id, step]));
  const changed = [...new Set([...Object.keys(oldSteps), ...Object.keys(newSteps)])].filter((id) => JSON.stringify(oldSteps[id]) !== JSON.stringify(newSteps[id]));
  return <div className="space-y-2 text-sm">{changed.length ? changed.map((id) => <div key={id} className="grid gap-2 md:grid-cols-2"><pre className="overflow-auto border-l-4 border-critical bg-red-50 p-2 whitespace-pre-wrap">Anterior: {oldSteps[id] ? JSON.stringify(oldSteps[id], null, 2) : 'Passo inexistente'}</pre><pre className="overflow-auto border-l-4 border-primary bg-mint p-2 whitespace-pre-wrap">Proposto: {newSteps[id] ? JSON.stringify(newSteps[id], null, 2) : 'Passo removido'}</pre></div>) : <p>Nenhum passo foi alterado.</p>}</div>;
}

export default function IdentificationKeyDetailPage() {
  const { keyId } = useParams();
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.identificationKeys.detail(keyId), queryFn: () => fetchIdentificationKey(keyId) });
  const suggestions = useQuery({ queryKey: ['identification-key-suggestions', keyId], queryFn: () => listKeySuggestions(keyId), enabled: Boolean(query.data?.is_author) });
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.identificationKeys.all }), client.invalidateQueries({ queryKey: ['identification-key-suggestions', keyId] })]);
  const decide = async (suggestionId, decision) => {
    setBusy(true); setFeedback('');
    try { await decideKeySuggestion(keyId, suggestionId, decision); await refresh(); }
    catch (error) { setFeedback(error.response?.data?.detail || 'Não foi possível decidir a sugestão.'); }
    finally { setBusy(false); }
  };
  if (query.isPending) return <PageContainer><ContentState status="loading" busyLabel="Carregando chave" /></PageContainer>;
  if (query.isError) return <PageContainer><ContentState status="error" title="Chave indisponível." /></PageContainer>;
  const key = query.data;
  const metadata = key.source_metadata || {};
  return <PageContainer width="wide" className="space-y-7"><Link to="/keys" className="font-bold underline">← Todas as chaves</Link>
    <PageHeader eyebrow={`${key.scope_rank === 'family' ? 'Família' : 'Gênero'} · ${key.scope_name}`} title={key.title} description={key.coverage} />
    <div className="border-l-4 border-primary bg-mint/30 px-4 py-3 text-sm"><p>Criada pela comunidade · Autor: {key.author} · Fonte: {key.source} · {key.published_version ? `Versão ${key.published_version}` : 'Rascunho privado'}{key.archived && ' · Arquivada'}</p>{metadata.imported && <p className="mt-1">Importada de {metadata.kind} · Idioma: {metadata.language || 'não informado'} · Licença: {metadata.license || 'não informada'}{metadata.url && <> · <a href={metadata.url} target="_blank" rel="noreferrer" className="font-bold underline">ver fonte</a></>}</p>}</div>
    <div className="flex flex-wrap gap-2">{key.is_author ? <><Link to={`/keys/${keyId}/edit`} className="border-4 border-charcoal bg-lime px-3 py-1.5 font-bold uppercase shadow-hard">Editar chave</Link>{!key.archived && <Button size="sm" variant="secondary" onClick={async () => { setBusy(true); try { await archiveIdentificationKey(keyId); await refresh(); } finally { setBusy(false); } }} disabled={busy}>Arquivar</Button>}</> : key.published_version && <Link to={`/keys/${keyId}/suggest`} className="border-4 border-charcoal bg-lime px-3 py-1.5 font-bold uppercase shadow-hard">Sugerir alteração</Link>}</div>
    <section className="space-y-4"><h2 className="inline-block border-4 border-charcoal bg-coral px-4 py-2 font-bold uppercase">Percurso publicado</h2><GraphSummary graph={key.graph} /></section>
      {key.is_author && suggestions.data?.length > 0 && <section className="space-y-4"><h2 className="font-bold uppercase">Sugestões recebidas</h2>{suggestions.data.map((item) => <article key={item.id} className="space-y-3 border-2 border-charcoal bg-surface p-4"><h3 className="font-bold">{item.author} · versão {item.base_version} · {item.status}</h3>{item.note && <p>{item.note}</p>}<SuggestionDiff before={item.base_graph} after={item.graph} />{item.status === 'pending' && <div className="flex gap-2"><Button size="sm" variant="lime" disabled={busy} onClick={() => decide(item.id, 'accepted')}>Aceitar e publicar</Button><Button size="sm" variant="secondary" disabled={busy} onClick={() => decide(item.id, 'rejected')}>Rejeitar</Button></div>}</article>)}</section>}
    {!key.is_author && key.published_version > 0 && <form onSubmit={async (event) => { event.preventDefault(); setBusy(true); try { await reportIdentificationKey(keyId, reason); setReason(''); setFeedback('Relato registrado.'); } catch (error) { setFeedback(error.response?.data?.reason || 'Não foi possível enviar o relato.'); } finally { setBusy(false); } }} className="max-w-2xl space-y-3"><h2 className="font-bold uppercase">Relatar problema na chave</h2><label className="block font-bold">Descrição<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows="2" className="mt-2 w-full border-2 border-charcoal bg-offwhite px-3 py-2" /></label><Button size="sm" variant="secondary" type="submit" disabled={busy}>Enviar relato</Button></form>}
    {feedback && <p role="status" className="border-l-4 border-primary p-3">{feedback}</p>}
  </PageContainer>;
}
