import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import InitialPhotoField from '../specimen/InitialPhotoField';
import LocationPicker from './LocationPicker';
import RevisionHistory from './RevisionHistory';
import { formatObservationDate, observationError, toLocalDateInput } from './observationUtils';
import { addObservationEvidence, updateObservationEvidence } from '../../services/apiClient';

const emptyLocation = { latitude: '', longitude: '' };
const controlClass = 'mt-2 w-full border-2 border-charcoal bg-offwhite px-3 py-2';
const SUBJECTS = [['original', 'Planta principal'], ['comparison', 'Outro indivíduo']];

function SubjectButtons({ value, onChange }) {
  return <div role="group" aria-label="Indivíduo observado" className="flex flex-wrap gap-2">{SUBJECTS.map(([kind, label]) => <Button key={kind} size="sm" variant={value === kind ? 'lime' : 'secondary'} aria-pressed={value === kind} onClick={() => onChange(kind)}>{label}</Button>)}</div>;
}

function PhotoPanel({ item, title }) {
  return <figure className="min-w-0"><img src={item.image} alt={`Foto de ${title}: ${item.subject === 'comparison' ? 'outro indivíduo' : 'planta principal'}`} className="max-h-[62dvh] w-full object-contain" /><figcaption className="mt-2 text-sm"><strong>{item.subject === 'comparison' ? 'Outro indivíduo' : 'Planta principal'}</strong> · {formatObservationDate(item.observed_at)}{item.notes && <p className="mt-1 whitespace-pre-wrap">{item.notes}</p>}</figcaption></figure>;
}

export default function EvidenceSection({ observation, onChanged, composerOpen, onComposerChange }) {
  const [photo, setPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [subject, setSubject] = useState('original');
  const [observedAt, setObservedAt] = useState(toLocalDateInput);
  const [location, setLocation] = useState(emptyLocation);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editMapOpen, setEditMapOpen] = useState(false);
  const [viewer, setViewer] = useState(null);
  const add = useMutation({
    mutationFn: (data) => addObservationEvidence(observation.id, data),
    onSuccess: async () => {
      setPhoto(null); setNotes(''); setLocation(emptyLocation); setShowMap(false); setError('');
      onComposerChange(false);
      await onChanged();
    },
    onError: (requestError) => setError(observationError(requestError)),
  });
  const edit = useMutation({
    mutationFn: ({ id, payload }) => updateObservationEvidence(observation.id, id, payload),
    onSuccess: async () => { setEditingId(null); setError(''); await onChanged(); },
    onError: (requestError) => setError(observationError(requestError)),
  });
  const submit = (event) => {
    event.preventDefault();
    if (!photo && !notes.trim()) { setError('Informe uma foto ou uma nota.'); return; }
    if (!observedAt) { setError('Informe a data da evidência.'); return; }
    if (Boolean(location.latitude) !== Boolean(location.longitude)) { setError('Informe latitude e longitude juntas.'); return; }
    const data = new FormData();
    if (photo) data.append('image', photo);
    data.append('notes', notes.trim());
    data.append('subject', subject);
    data.append('observed_at', new Date(observedAt).toISOString());
    if (location.latitude) {
      data.append('latitude', location.latitude);
      data.append('longitude', location.longitude);
    }
    setError('');
    add.mutate(data);
  };
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditMapOpen(item.latitude != null);
    setEditForm({ notes: item.notes, subject: item.subject, observed_at: toLocalDateInput(item.observed_at), latitude: item.latitude ?? '', longitude: item.longitude ?? '' });
    setError('');
  };
  const saveEdit = (event) => {
    event.preventDefault();
    if (!editForm.observed_at) { setError('Informe a data da evidência.'); return; }
    if (Boolean(editForm.latitude) !== Boolean(editForm.longitude)) { setError('Informe latitude e longitude juntas.'); return; }
    edit.mutate({ id: editingId, payload: { notes: editForm.notes.trim(), subject: editForm.subject, observed_at: new Date(editForm.observed_at).toISOString(), latitude: editForm.latitude || null, longitude: editForm.longitude || null } });
  };
  const showPhoto = (item, compare) => {
    const counterpart = compare ? observation.evidence.find((candidate) => candidate.subject !== item.subject && candidate.image) : null;
    setViewer({ item, counterpart });
  };
  return <section id="observation-evidence" className="space-y-5 scroll-mt-4" aria-label="Evidências de campo">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="inline-block border-4 border-charcoal bg-mint px-4 py-2 text-lg font-bold uppercase shadow-hard-sm">Evidências de campo</h2><Button size="sm" variant="lime" aria-expanded={composerOpen} onClick={() => onComposerChange(!composerOpen)}>{composerOpen ? 'Fechar registro' : 'Adicionar evidência'}</Button></div>
    {composerOpen && <form onSubmit={submit} className="space-y-4 border-l-4 border-primary bg-surface px-4 py-5">
      <h3 className="font-bold uppercase">Nova evidência</h3>
      <SubjectButtons value={subject} onChange={setSubject} />
      <label className="block font-bold" htmlFor="evidence-date">Data e hora<input id="evidence-date" type="datetime-local" value={observedAt} max={toLocalDateInput()} onChange={(event) => setObservedAt(event.target.value)} required className={controlClass} /></label>
      <label className="block font-bold" htmlFor="evidence-notes">Nota<textarea id="evidence-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows="3" className={controlClass} /></label>
      <InitialPhotoField id="evidence-photo" label="Foto (opcional)" file={photo} onChange={setPhoto} />
      <button type="button" aria-expanded={showMap} className="border-b-2 border-charcoal font-bold" onClick={() => setShowMap((open) => !open)}>{showMap ? 'Ocultar localização' : 'Marcar localização desta evidência'}</button>
      {showMap && <LocationPicker id="evidence" value={location} onChange={setLocation} />}
      {error && <p role="alert" className="font-bold text-critical">{error}</p>}
      <Button type="submit" variant="lime" disabled={add.isPending}>{add.isPending ? 'Salvando…' : 'Salvar evidência'}</Button>
    </form>}
    {observation.evidence.length ? <ol className="space-y-5">{observation.evidence.map((item) => {
      const counterpart = observation.evidence.find((candidate) => candidate.subject !== item.subject && candidate.image);
      return <li key={item.id} className="border-l-4 border-charcoal pl-4"><p className="mb-2 font-mono text-xs font-bold uppercase">{formatObservationDate(item.observed_at)} · {item.subject === 'comparison' ? 'Outro indivíduo' : 'Planta principal'}</p>
        <div className="space-y-3 border-2 border-charcoal bg-surface p-4 shadow-hard-sm">
          {item.image && <button type="button" onClick={() => showPhoto(item, false)} className="block w-full max-w-md border-2 border-charcoal bg-lilac p-1 text-left focus-visible:ring-4 focus-visible:ring-lime" aria-label={`Ampliar foto de ${formatObservationDate(item.observed_at)}`}><img src={item.image} alt="" className="aspect-[4/3] w-full object-cover" /><span className="block px-2 py-1 text-xs font-bold uppercase">Ampliar foto</span></button>}
          {item.notes && <p className="whitespace-pre-wrap">{item.notes}</p>}
          {item.latitude != null && <p className="text-xs">Local: {item.latitude}, {item.longitude}</p>}
          <div className="flex flex-wrap gap-2">{item.image && counterpart && <Button size="sm" variant="secondary" onClick={() => showPhoto(item, true)}>Comparar fotos</Button>}<Button size="sm" variant="secondary" onClick={() => startEdit(item)}>Corrigir registro</Button></div>
          {editingId === item.id && <form onSubmit={saveEdit} className="space-y-3 border-t-2 border-charcoal/25 pt-4"><h3 className="font-bold uppercase">Corrigir evidência</h3><SubjectButtons value={editForm.subject} onChange={(value) => setEditForm((current) => ({ ...current, subject: value }))} /><label className="block font-bold" htmlFor={`edit-evidence-date-${item.id}`}>Data e hora<input id={`edit-evidence-date-${item.id}`} type="datetime-local" value={editForm.observed_at} max={toLocalDateInput()} onChange={(event) => setEditForm((current) => ({ ...current, observed_at: event.target.value }))} className={controlClass} /></label><label className="block font-bold" htmlFor={`edit-evidence-notes-${item.id}`}>Nota<textarea id={`edit-evidence-notes-${item.id}`} value={editForm.notes} onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))} rows="3" className={controlClass} /></label><button type="button" aria-expanded={editMapOpen} className="border-b-2 border-charcoal font-bold" onClick={() => setEditMapOpen((open) => !open)}>{editMapOpen ? 'Ocultar localização' : 'Corrigir localização'}</button>{editMapOpen && <LocationPicker id={`edit-evidence-${item.id}`} value={editForm} onChange={(point) => setEditForm((current) => ({ ...current, ...point }))} />}{error && <p role="alert" className="font-bold text-critical">{error}</p>}<div className="flex flex-wrap gap-2"><Button type="submit" size="sm" variant="lime" disabled={edit.isPending}>Salvar correção</Button><Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>Cancelar</Button></div></form>}
          <RevisionHistory revisions={item.revisions} />
        </div>
      </li>;
    })}</ol> : <p className="border-2 border-dashed border-charcoal p-4">Nenhuma evidência registrada.</p>}
    <Modal open={Boolean(viewer)} onClose={() => setViewer(null)} title={viewer?.counterpart ? 'Comparar evidências' : 'Foto da observação'} className="max-w-5xl max-h-[90dvh] overflow-y-auto">{viewer && <div className={`grid gap-5 ${viewer.counterpart ? 'md:grid-cols-2' : ''}`}><PhotoPanel item={viewer.item} title={observation.title} />{viewer.counterpart && <PhotoPanel item={viewer.counterpart} title={observation.title} />}</div>}</Modal>
  </section>;
}
