import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import RevisionHistory from './RevisionHistory';
import { formatObservationDate, observationError } from './observationUtils';
import { addObservationHypothesis, browseTaxonomy, confirmObservation, queryKeys, reopenObservation, searchSpecies, setHypothesisStatus, updateHypothesisNotes } from '../../services/apiClient';

const SOURCE_OPTIONS = [['catalog', 'Catálogo'], ['manual', 'Texto livre']];
const RANK_OPTIONS = [['genus', 'Gênero'], ['species', 'Espécie'], ['unknown', 'Ainda não sei']];
const controlClass = 'mt-2 w-full border-2 border-charcoal bg-offwhite px-3 py-2';

function ChoiceButtons({ label, options, value, onChange }) {
  return <div role="group" aria-label={label} className="space-y-2"><p className="font-bold">{label}</p><div className="flex flex-wrap gap-2">{options.map(([key, text]) => <Button key={key} size="sm" variant={value === key ? 'lime' : 'secondary'} aria-pressed={value === key} onClick={() => onChange(key)}>{text}</Button>)}</div></div>;
}

function HypothesisCard({ item, confirmed, observation, onChanged, onConfirm, onError }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(item.notes);
  const update = useMutation({
    mutationFn: () => updateHypothesisNotes(observation.id, item.id, notes.trim()),
    onSuccess: async () => { setEditing(false); await onChanged(); },
    onError,
  });
  const status = useMutation({
    mutationFn: (next) => setHypothesisStatus(observation.id, item.id, next),
    onSuccess: onChanged,
    onError,
  });
  const current = observation.confirmed_hypothesis === item.id;
  return <li className="space-y-3 border-2 border-charcoal bg-surface p-4 shadow-hard-sm">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="break-words font-bold italic">{item.name}</h3><p className="mt-1 font-mono text-xs uppercase text-charcoal/70">{item.rank === 'genus' ? 'Gênero' : item.rank === 'species' ? 'Espécie' : 'Nível indefinido'} · {item.source === 'catalog' ? 'Catálogo' : 'Texto livre'} · {formatObservationDate(item.created_at)}</p></div><span className={`border-2 border-charcoal px-2 py-1 text-xs font-bold uppercase ${current ? 'bg-mint' : item.discarded_at ? 'bg-gray-200' : 'bg-coral'}`}>{current ? 'Confirmada' : item.discarded_at ? 'Descartada' : 'Ativa'}</span></div>
    {item.notes && !editing && <p className="whitespace-pre-wrap">{item.notes}</p>}
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" onClick={() => { setNotes(item.notes); setEditing(true); }}>Corrigir justificativa</Button>
      {!current && <Button size="sm" variant="secondary" onClick={() => status.mutate(item.discarded_at ? 'active' : 'discarded')} disabled={status.isPending}>{item.discarded_at ? 'Reativar' : 'Descartar'}</Button>}
      {!confirmed && !item.discarded_at && item.source === 'catalog' && item.rank === 'species' && <Button size="sm" variant="lime" onClick={() => onConfirm(item)}>Confirmar espécie</Button>}
    </div>
    {editing && <form onSubmit={(event) => { event.preventDefault(); update.mutate(); }} className="space-y-3 border-t-2 border-charcoal/25 pt-3"><label className="block font-bold" htmlFor={`edit-hypothesis-${item.id}`}>Justificativa<textarea id={`edit-hypothesis-${item.id}`} value={notes} onChange={(event) => setNotes(event.target.value)} rows="3" className={controlClass} /></label><div className="flex gap-2"><Button type="submit" size="sm" variant="lime" disabled={update.isPending}>Salvar correção</Button><Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button></div></form>}
    <RevisionHistory revisions={item.revisions} />
  </li>;
}

export default function HypothesisSection({ observation, onChanged, composerOpen, onComposerChange }) {
  const [source, setSource] = useState('catalog');
  const [rank, setRank] = useState('species');
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [confirmChoice, setConfirmChoice] = useState(null);
  const [confirmNotes, setConfirmNotes] = useState('');
  const local = useQuery({ queryKey: queryKeys.species.search(term), queryFn: () => searchSpecies(term), enabled: composerOpen && source === 'catalog' && rank === 'species' && term.trim().length > 1 });
  const gbif = useQuery({ queryKey: ['hypothesis-taxa', rank, term], queryFn: () => browseTaxonomy({ rank, search: term, limit: 10 }), enabled: composerOpen && source === 'catalog' && term.trim().length > 1 });
  const add = useMutation({
    mutationFn: (payload) => addObservationHypothesis(observation.id, payload),
    onSuccess: async () => { setTerm(''); setSelected(null); setNotes(''); setError(''); onComposerChange(false); await onChanged(); },
    onError: (requestError) => setError(observationError(requestError)),
  });
  const confirm = useMutation({
    mutationFn: () => confirmObservation(observation.id, confirmChoice.id, confirmNotes.trim()),
    onSuccess: async () => { setConfirmChoice(null); setConfirmNotes(''); setError(''); await onChanged(); },
    onError: (requestError) => setError(observationError(requestError)),
  });
  const reopen = useMutation({
    mutationFn: () => reopenObservation(observation.id),
    onSuccess: onChanged,
    onError: (requestError) => setError(observationError(requestError)),
  });
  const submit = (event) => {
    event.preventDefault();
    if (source === 'catalog' && !selected) { setError('Selecione um táxon da lista.'); return; }
    if (source === 'manual' && !term.trim()) { setError('Informe uma hipótese.'); return; }
    add.mutate(source === 'manual'
      ? { source, rank, name: term.trim(), notes: notes.trim() }
      : { source, rank: selected.rank, name: selected.name, species: selected.species || undefined, gbif_key: selected.gbif_key || undefined, notes: notes.trim() });
  };
  const active = observation.hypotheses.filter((item) => !item.discarded_at);
  const discarded = observation.hypotheses.filter((item) => item.discarded_at);
  const cardProps = { observation, confirmed: Boolean(observation.species_detail), onChanged, onConfirm: (item) => { setConfirmChoice(item); setError(''); }, onError: (requestError) => setError(observationError(requestError)) };
  return <section id="observation-hypotheses" className="space-y-5 scroll-mt-4" aria-label="Hipóteses de identificação">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="inline-block border-4 border-charcoal bg-coral px-4 py-2 text-lg font-bold uppercase shadow-hard-sm">Hipóteses de identificação</h2><Button size="sm" variant="lime" aria-expanded={composerOpen} onClick={() => onComposerChange(!composerOpen)}>{composerOpen ? 'Fechar palpite' : 'Novo palpite'}</Button></div>
    {observation.species_detail && <div className="border-l-4 border-primary bg-mint p-4"><p className="font-bold">Espécie confirmada: <i>{observation.species_detail.scientific_name}</i></p><Button size="sm" variant="secondary" className="mt-3" onClick={() => reopen.mutate()} disabled={reopen.isPending}>Reabrir identificação</Button></div>}
    {composerOpen && <form onSubmit={submit} className="space-y-4 border-l-4 border-primary bg-surface px-4 py-5">
      <h3 className="font-bold uppercase">Novo palpite</h3>
      <ChoiceButtons label="Origem" options={SOURCE_OPTIONS} value={source} onChange={(value) => { setSource(value); if (value === 'catalog' && rank === 'unknown') setRank('species'); setSelected(null); setTerm(''); }} />
      <ChoiceButtons label="Nível taxonômico" options={source === 'catalog' ? RANK_OPTIONS.slice(0, 2) : RANK_OPTIONS} value={rank} onChange={(value) => { setRank(value); setSelected(null); }} />
      <label className="block font-bold" htmlFor="hypothesis-name">Nome<input id="hypothesis-name" value={term} onChange={(event) => { setTerm(event.target.value); setSelected(null); }} className={controlClass} autoComplete="off" /></label>
      {source === 'catalog' && term.trim().length > 1 && <div className="max-h-52 space-y-2 overflow-auto border-2 border-charcoal p-2" aria-label="Resultados do catálogo">
        {rank === 'species' && (local.data?.results || []).map((item) => <button key={`local-${item.id}`} type="button" onClick={() => { setSelected({ species: item.id, name: item.scientific_name, rank: 'species' }); setTerm(item.scientific_name); }} className="block w-full border-2 border-charcoal bg-lime px-3 py-2 text-left">Local · {item.scientific_name}</button>)}
        {(gbif.data?.results || []).map((item) => <button key={`gbif-${item.key}`} type="button" onClick={() => { setSelected({ gbif_key: item.key, name: item.scientific_name, rank: item.rank }); setTerm(item.scientific_name); }} className="block w-full border-2 border-charcoal bg-offwhite px-3 py-2 text-left">GBIF · {item.scientific_name}</button>)}
        {(local.isFetching || gbif.isFetching) && <p role="status">Buscando táxons…</p>}
        {(local.isError || gbif.isError) && <p role="alert">Falha na consulta ao catálogo. É possível registrar como texto livre.</p>}
      </div>}
      {selected && <p className="border-l-4 border-primary bg-mint p-2 text-sm">Selecionado: {selected.name}</p>}
      <label className="block font-bold" htmlFor="hypothesis-notes">Justificativa (opcional)<textarea id="hypothesis-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows="3" className={controlClass} /></label>
      {error && <p role="alert" className="font-bold text-critical">{error}</p>}
      <Button type="submit" variant="lime" disabled={add.isPending}>{add.isPending ? 'Salvando…' : 'Guardar hipótese'}</Button>
    </form>}
    {error && !composerOpen && <p role="alert" className="font-bold text-critical">{error}</p>}
    <div className="space-y-3"><h3 className="font-bold uppercase">Hipóteses ativas ({active.length})</h3>{active.length ? <ol className="space-y-3">{active.map((item) => <HypothesisCard key={item.id} item={item} {...cardProps} />)}</ol> : <p className="border-2 border-dashed border-charcoal p-4">Nenhuma hipótese ativa.</p>}</div>
    {discarded.length > 0 && <details className="space-y-3"><summary className="cursor-pointer font-bold uppercase">Descartadas ({discarded.length})</summary><ol className="mt-3 space-y-3">{discarded.map((item) => <HypothesisCard key={item.id} item={item} {...cardProps} />)}</ol></details>}
    {observation.identification_events.length > 0 && <div className="space-y-2"><h3 className="font-bold uppercase">Histórico de identificação</h3><ol className="space-y-2">{observation.identification_events.map((event) => <li key={event.id} className="border-l-4 border-charcoal pl-3 text-sm">{formatObservationDate(event.created_at)} · {event.action === 'confirm' ? 'Espécie confirmada' : 'Identificação reaberta'}{event.notes && ` · ${event.notes}`}</li>)}</ol></div>}
    <Modal open={Boolean(confirmChoice)} onClose={() => setConfirmChoice(null)} title="Confirmar identificação"><p>Confirmar <strong className="italic">{confirmChoice?.name}</strong> como espécie desta ficha? A decisão ficará no histórico e poderá ser reaberta.</p><label className="mt-4 block font-bold" htmlFor="confirm-observation-notes">Nota da decisão (opcional)<textarea id="confirm-observation-notes" value={confirmNotes} onChange={(event) => setConfirmNotes(event.target.value)} rows="2" className={controlClass} /></label>{error && <p role="alert" className="mt-3 font-bold text-critical">{error}</p>}<div className="mt-5 flex flex-wrap gap-2"><Button variant="lime" onClick={() => confirm.mutate()} disabled={confirm.isPending}>{confirm.isPending ? 'Confirmando…' : 'Confirmar espécie'}</Button><Button variant="secondary" onClick={() => setConfirmChoice(null)}>Cancelar</Button></div></Modal>
  </section>;
}
