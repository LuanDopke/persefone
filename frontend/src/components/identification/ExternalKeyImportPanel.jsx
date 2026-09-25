import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import TaxonPicker from './TaxonPicker';
import { importIdentificationKey } from '../../services/apiClient';

const inputClass = 'mt-2 w-full border-2 border-charcoal bg-offwhite px-3 py-2';

export default function ExternalKeyImportPanel({ candidate, onClose }) {
  const navigate = useNavigate();
  const sourceKind = candidate?.source_kind || 'sdd';
  const [scopeRank, setScopeRank] = useState('genus');
  const [scope, setScope] = useState(null);
  const [coverage, setCoverage] = useState(candidate?.coverage || '');
  const [license, setLicense] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true); setError('');
    try {
      const saved = await importIdentificationKey({
        source_kind: sourceKind,
        external_id: candidate?.external_id,
        source_url: sourceKind === 'sdd' ? sourceUrl : undefined,
        file: sourceKind === 'sdd' ? file : undefined,
        scope_rank: scopeRank,
        scope_gbif_key: scope?.key,
        scope_name: scope?.name,
        coverage,
        license,
      });
      navigate(`/keys/${saved.id}/edit`);
    } catch (requestError) {
      const data = requestError.response?.data;
      setError(typeof data?.detail === 'string' ? data.detail : Object.values(data || {}).flat().join(' ') || 'Não foi possível importar a chave.');
    } finally { setBusy(false); }
  };

  return <section className="space-y-5 border-4 border-charcoal bg-surface p-5 shadow-hard" aria-label="Importar chave">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold uppercase">Importar para revisão</h2><p className="text-sm">A importação cria um rascunho privado. Revise os táxons, os passos e a fonte antes de publicar.</p></div><Button size="sm" variant="secondary" onClick={onClose}>Fechar</Button></div>
    {candidate ? <div className="border-l-4 border-primary bg-mint/30 p-3"><p className="font-bold">{candidate.title}</p><p className="text-sm">{candidate.project} · {candidate.coverage}</p><a className="text-sm font-bold underline" href={candidate.reader_url} target="_blank" rel="noreferrer">Abrir na fonte</a></div> : <div className="grid gap-4 md:grid-cols-2">
      <label className="block font-bold">Arquivo SDD XML<input type="file" accept=".xml,.sdd.xml,application/xml,text/xml" onChange={(event) => setFile(event.target.files?.[0] || null)} className={inputClass} /></label>
      <label className="block font-bold">Ou URL pública do Xper3<input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://app.xper3.fr/...sdd.xml" className={inputClass} /></label>
    </div>}
    <div role="group" aria-label="Nível taxonômico da chave" className="space-y-2"><p className="font-bold">A chave identifica táxons dentro de</p><div className="flex gap-2">{[['family', 'Família'], ['genus', 'Gênero']].map(([value, label]) => <Button key={value} size="sm" variant={scopeRank === value ? 'lime' : 'secondary'} aria-pressed={scopeRank === value} onClick={() => { setScopeRank(value); setScope(null); }}>{label}</Button>)}</div></div>
    <TaxonPicker rank={scopeRank} value={scope} label="Grupo taxonômico no GBIF" onChange={setScope} />
    <label className="block font-bold">Abrangência geográfica<textarea rows="2" value={coverage} onChange={(event) => setCoverage(event.target.value)} className={inputClass} /></label>
    <label className="block font-bold">Licença ou autorização {sourceKind === 'sdd' && '(obrigatória)'}<input value={license} onChange={(event) => setLicense(event.target.value)} placeholder="Ex.: CC BY 4.0 ou autorização do autor" className={inputClass} /><span className="mt-1 block text-xs font-normal">Deixe vazio apenas quando a fonte já declarar uma licença compatível.</span></label>
    {error && <p role="alert" className="border-l-4 border-critical bg-red-50 p-3 font-bold">{error}</p>}
    <Button variant="lime" disabled={busy || !scope || (!candidate && !file && !sourceUrl) || (sourceKind === 'sdd' && !license.trim())} onClick={submit}>{busy ? 'Importando e vinculando táxons…' : 'Criar rascunho para revisão'}</Button>
  </section>;
}
