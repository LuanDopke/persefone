import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import ContentState from '../components/ui/ContentState';
import TaxonPicker from '../components/identification/TaxonPicker';
import KeyGraphEditor from '../components/identification/KeyGraphEditor';
import { fetchIdentificationKey, publishIdentificationKey, queryKeys, saveIdentificationKey, suggestKeyChange } from '../services/apiClient';

const inputClass = 'mt-2 w-full border-2 border-charcoal bg-offwhite px-3 py-2';
const empty = { title: '', scope_rank: 'family', scope_gbif_key: null, scope_name: '', coverage: '', source: 'Elaboração própria', source_metadata: {}, draft_graph: { type: 'branching', start: '', steps: [] } };

export default function IdentificationKeyEditorPage({ suggestion = false }) {
  const { keyId } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const detail = useQuery({ queryKey: queryKeys.identificationKeys.detail(keyId), queryFn: () => fetchIdentificationKey(keyId), enabled: Boolean(keyId) });
  const [form, setForm] = useState(empty);
  const [note, setNote] = useState('');
  const [loadedId, setLoadedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (detail.data && loadedId !== keyId) {
      setForm({ title: detail.data.title, scope_rank: detail.data.scope_rank,
        scope_gbif_key: detail.data.scope_gbif_key, scope_name: detail.data.scope_name,
        coverage: detail.data.coverage, source: detail.data.source, source_metadata: detail.data.source_metadata || {},
        draft_graph: structuredClone(suggestion ? detail.data.graph : detail.data.draft_graph) });
      setLoadedId(keyId);
    }
  }, [detail.data, keyId, loadedId, suggestion]);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const changeScope = (rank, taxon = null) => {
    if (rank === form.scope_rank && (taxon ? taxon.key === form.scope_gbif_key : true)) return;
    const hasGraphData = form.draft_graph.type === 'multi_access'
      ? form.draft_graph.descriptors?.length || form.draft_graph.taxa?.length
      : form.draft_graph.steps?.length;
    if (hasGraphData && !window.confirm('Trocar o grupo apagará a estrutura deste rascunho. Continuar?')) return;
    const emptyGraph = form.draft_graph.type === 'multi_access'
      ? { type: 'multi_access', descriptors: [], taxa: [] }
      : { type: 'branching', start: '', steps: [] };
    setForm((current) => ({ ...current, scope_rank: rank, scope_gbif_key: taxon?.key || null,
      scope_name: taxon?.name || '', draft_graph: emptyGraph }));
  };
  const save = async (publish = false) => {
    setBusy(true); setError('');
    try {
      if (suggestion) {
        await suggestKeyChange(keyId, form.draft_graph, note);
        navigate(`/keys/${keyId}`);
      } else {
        const saved = await saveIdentificationKey(keyId, form);
        if (publish) await publishIdentificationKey(saved.id);
        await client.invalidateQueries({ queryKey: queryKeys.identificationKeys.all });
        navigate(`/keys/${saved.id}`);
      }
    } catch (requestError) {
      const values = requestError.response?.data;
      setError(typeof values?.detail === 'string' ? values.detail : Object.values(values || {}).flat().join(' ') || 'Não foi possível salvar a chave.');
    } finally { setBusy(false); }
  };
  if (keyId && detail.isPending) return <PageContainer><ContentState status="loading" busyLabel="Carregando chave" /></PageContainer>;
  if (keyId && (detail.isError || (!suggestion && !detail.data.is_author))) return <PageContainer><ContentState status="error" title="Chave indisponível para edição." /></PageContainer>;
  if (suggestion && detail.data?.is_author) return <PageContainer><ContentState status="error" title="O autor pode editar a própria chave." /></PageContainer>;
  const scope = form.scope_gbif_key ? { key: form.scope_gbif_key, name: form.scope_name, rank: form.scope_rank } : null;
  return <PageContainer width="wide" className="space-y-6"><Link to={keyId ? `/keys/${keyId}` : '/keys'} className="font-bold underline">← Voltar às chaves</Link>
    <PageHeader title={suggestion ? 'Sugerir alteração' : keyId ? 'Editar chave' : 'Criar chave'} description={suggestion ? 'O autor receberá sua proposta e poderá publicá-la como nova versão.' : 'Crie uma chave sequencial ou uma matriz de múltiplo acesso para o grupo selecionado.'} />
    <div className="grid gap-4 lg:grid-cols-2">
      <label className="block font-bold">Título<input value={form.title} onChange={(event) => set('title', event.target.value)} maxLength={160} disabled={suggestion} className={inputClass} /></label>
      <div role="group" aria-label="Nível da chave" className="space-y-2"><p className="font-bold">Nível da chave</p><div className="flex gap-2">{[['family', 'Família'], ['genus', 'Gênero']].map(([value, label]) => <Button key={value} size="sm" variant={form.scope_rank === value ? 'lime' : 'secondary'} aria-pressed={form.scope_rank === value} disabled={suggestion || Boolean(detail.data?.published_version)} onClick={() => changeScope(value)}>{label}</Button>)}</div></div>
      {!suggestion && !detail.data?.published_version ? <TaxonPicker rank={form.scope_rank} value={scope} label="Grupo taxonômico" onChange={(taxon) => changeScope(form.scope_rank, taxon)} /> : <p className="font-bold">Grupo: <i>{form.scope_name}</i></p>}
      <label className="block font-bold">Abrangência geográfica e táxons contemplados<textarea value={form.coverage} onChange={(event) => set('coverage', event.target.value)} disabled={suggestion} rows="3" className={inputClass} /></label>
      <label className="block font-bold">Fonte ou autoria original<input value={form.source} onChange={(event) => set('source', event.target.value)} disabled={suggestion} className={inputClass} /></label>
    </div>
    <KeyGraphEditor graph={form.draft_graph} onChange={(graph) => set('draft_graph', graph)} scopeRank={form.scope_rank} scopeKey={form.scope_gbif_key} />
    {suggestion && <label className="block font-bold">Explique a alteração<textarea value={note} onChange={(event) => setNote(event.target.value)} rows="3" className={inputClass} /></label>}
    {error && <p role="alert" className="border-l-4 border-critical bg-red-50 p-3 font-bold">{error}</p>}
    <div className="flex flex-wrap gap-3">{suggestion ? <Button variant="lime" disabled={busy} onClick={() => save(false)}>Enviar sugestão</Button> : <><Button variant="secondary" disabled={busy} onClick={() => save(false)}>Salvar rascunho</Button><Button variant="lime" disabled={busy} onClick={() => save(true)}>Publicar chave</Button></>}</div>
  </PageContainer>;
}
