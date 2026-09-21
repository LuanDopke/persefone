import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import apiClient, { queryKeys } from '../../services/apiClient';

const MAX_BYTES = 10 * 1024 * 1024;
function localDateTime() { const d = new Date(); const p = (v) => String(v).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; }

export default function VisualEntryForm({ open, onClose, specimenId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [capturedAt, setCapturedAt] = useState(localDateTime);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const submittingRef = useRef(false);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload) => apiClient.post('/api/visual-entries/', payload, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: async (response) => { submittingRef.current = false; await Promise.all([queryClient.invalidateQueries({ queryKey: queryKeys.visualEntries.bySpecimen(specimenId) }), queryClient.invalidateQueries({ queryKey: queryKeys.specimens.detail(specimenId) }), queryClient.invalidateQueries({ queryKey: queryKeys.collection.all })]); onSuccess?.(response.data); onClose?.(); },
    onError: (err) => { submittingRef.current = false; setError(err.response?.data?.image?.join?.(' ') || err.response?.data?.captured_at?.join?.(' ') || 'Não foi possível registrar a foto. Tente novamente.'); },
  });
  const selectFile = (event) => { const selected = event.target.files?.[0]; if (!selected) return; if (!selected.type.startsWith('image/')) { setError('Selecione um arquivo de imagem.'); return; } if (selected.size > MAX_BYTES) { setError('A foto deve ter no máximo 10 MB.'); return; } setError(''); setFile(selected); setPreview(URL.createObjectURL(selected)); };
  const submit = (event) => { event.preventDefault(); if (submittingRef.current || mutation.isPending) return; if (!file) { setError('Selecione uma imagem.'); return; } const date = new Date(capturedAt); if (Number.isNaN(date.getTime()) || date > new Date()) { setError('A data e hora não podem estar no futuro.'); return; } const data = new FormData(); data.append('specimen', specimenId); data.append('image', file); data.append('captured_at', date.toISOString()); data.append('notes', notes.trim()); submittingRef.current = true; mutation.mutate(data); };
  return <Modal open={open} onClose={mutation.isPending ? () => {} : onClose} title="Adicionar foto">
    <form onSubmit={submit} className="space-y-4" noValidate>
      <FormField id="visual-image" label="Imagem" required hint="JPEG, PNG, WebP ou AVIF, até 10 MB."><input id="visual-image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={selectFile} className="min-h-12 w-full border-4 border-charcoal bg-offwhite p-3 font-semibold focus-visible:ring-4 focus-visible:ring-lime/70" /></FormField>
      {preview && <img src={preview} alt="Prévia do registro visual" className="h-32 w-full border-4 border-charcoal object-contain" />}
      <FormField id="visual-captured-at" label="Data e hora da captura" required><Input type="datetime-local" max={localDateTime()} value={capturedAt} onChange={(event) => setCapturedAt(event.target.value)} /></FormField>
      <FormField id="visual-notes" label="Observação (opcional)"><textarea id="visual-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows="3" className="w-full border-4 border-charcoal bg-offwhite px-4 py-3 font-semibold focus-visible:ring-4 focus-visible:ring-lime/70" /></FormField>
      {error && <Alert tone="critical">{error}</Alert>}
      <Button id="visual-submit" type="submit" variant="lime" disabled={mutation.isPending}>{mutation.isPending ? 'Salvando…' : 'Registrar foto'}</Button>
    </form>
  </Modal>;
}
