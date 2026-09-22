import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import FormField from '../ui/FormField';
import Alert from '../ui/Alert';
import { Icon } from '../ui/Icon';
import apiClient, { queryKeys } from '../../services/apiClient';
import { getCareActivity } from '../../config/careActivities';
import InitialPhotoField from './InitialPhotoField';

export default function CareActivityForm({ specimenId, initialType = 'watering', onSuccess }) {
  const activity = getCareActivity(initialType);
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { if (initialType !== 'observation') setPhoto(null); }, [initialType]);
  const mutation = useMutation({
    mutationFn: (payload) => payload instanceof FormData
      ? apiClient.post('/api/care-logs/', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      : apiClient.post('/api/care-logs/', payload),
    onSuccess: async (response) => {
      setError('');
      setNotes('');
      setPhoto(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.careLogs.bySpecimen(specimenId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.specimens.detail(specimenId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.visualEntries.bySpecimen(specimenId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.collection.all }),
      ]);
      onSuccess?.(response.data);
    },
    onError: (err) => { setError(err.response?.data?.image?.join?.(' ') || err.response?.data?.occurred_at?.join?.(' ') || 'Não foi possível registrar a atividade. Tente novamente.'); },
  });
  const submit = (event) => {
    event.preventDefault();
    if (mutation.isPending) return;
    setError('');
    const payload = { specimen: specimenId, type: initialType, occurred_at: new Date().toISOString(), notes: notes.trim() };
    if (initialType === 'observation' && photo) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
      formData.append('image', photo);
      mutation.mutate(formData);
      return;
    }
    mutation.mutate(payload);
  };

  return (
    <section data-care-type={activity.type} aria-label="Registrar atividade" className={`relative overflow-visible border-4 border-charcoal p-5 shadow-hard-lg transition-colors duration-150 motion-reduce:transition-none ${activity.panel}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-12 w-12 -rotate-2 place-items-center border-4 border-charcoal shadow-hard-sm ${activity.solid}`} aria-hidden="true"><Icon name={activity.icon} size={26} /></span>
          <span><span className="block font-mono text-[10px] font-bold uppercase tracking-widest text-charcoal/60">Novo registro</span><span className="block text-lg font-extrabold uppercase">{activity.label}</span></span>
        </div>
        <span className={`border-2 border-charcoal px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider shadow-hard-sm ${activity.solid}`}>
          Tipo selecionado
        </span>
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField id="care-notes" label="Observação (opcional)">
          <textarea
            id="care-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows="4"
            placeholder="Registrar novas observações ou mudanças no estado da planta..."
            className="w-full border-4 border-charcoal bg-surface px-4 py-3 font-semibold shadow-hard focus-visible:ring-4 focus-visible:ring-lime/70"
          />
        </FormField>
        {initialType === 'observation' && <div className="border-t-2 border-dashed border-charcoal/40 pt-4"><InitialPhotoField id="care-photo" label="Foto da observação (opcional)" file={photo} onChange={setPhoto} /></div>}
        {error && <Alert tone="critical">{error}</Alert>}
        <div className="flex justify-end">
          <Button id="care-submit" type="submit" variant="lime" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando…' : 'Registrar no histórico'}
          </Button>
        </div>
      </form>
    </section>
  );
}
