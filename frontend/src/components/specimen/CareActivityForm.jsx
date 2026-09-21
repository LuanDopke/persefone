import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import FormField from '../ui/FormField';
import Alert from '../ui/Alert';
import apiClient, { queryKeys } from '../../services/apiClient';

const CARE_LABELS = {
  watering: 'Rega',
  fertilizing: 'Adubação',
  repotting: 'Replante',
  pruning: 'Poda',
  observation: 'Observação',
};

const CARE_LABEL_STYLES = {
  watering: 'border-info bg-info text-offwhite',
  fertilizing: 'border-botanical bg-botanical text-offwhite',
  repotting: 'border-amber bg-amber text-charcoal',
  pruning: 'border-critical bg-critical text-offwhite',
  observation: 'border-charcoal bg-surface-variant text-charcoal',
};

export default function CareActivityForm({ specimenId, initialType = 'watering', onSuccess }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: (payload) => apiClient.post('/api/care-logs/', payload),
    onSuccess: async (response) => {
      setError('');
      setNotes('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.careLogs.bySpecimen(specimenId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.specimens.detail(specimenId) }),
      ]);
      onSuccess?.(response.data);
    },
    onError: (err) => { setError(err.response?.data?.occurred_at?.join?.(' ') || 'Não foi possível registrar a atividade. Tente novamente.'); },
  });
  const submit = (event) => {
    event.preventDefault();
    if (mutation.isPending) return;
    setError('');
    mutation.mutate({ specimen: specimenId, type: initialType, occurred_at: new Date().toISOString(), notes: notes.trim() });
  };

  return (
    <section aria-label="Registrar atividade" className="border-4 border-charcoal bg-offwhite p-5 shadow-hard-lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-charcoal/70">Tipo selecionado</span>
        <span className={`border-2 px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider ${CARE_LABEL_STYLES[initialType] || CARE_LABEL_STYLES.observation}`}>
          {CARE_LABELS[initialType] || initialType}
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
            className="w-full border-4 border-charcoal bg-offwhite px-4 py-3 font-semibold focus-visible:ring-4 focus-visible:ring-lime/70"
          />
        </FormField>
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
