import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import LightOptionField from './LightOptionField';

const fields = ['nickname', 'location_in_home', 'acquired_at', 'initial_soil', 'initial_light'];
const fieldError = (errors, name) => Array.isArray(errors[name]) ? errors[name].join(' ') : errors[name];

export default function SpecimenEditForm({ open, onClose, specimen, onSave }) {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (open && specimen) { setForm(Object.fromEntries(fields.map((name) => [name, specimen[name] ?? '']))); setErrors({}); setGeneralError(''); } }, [open, specimen]);
  const update = (name) => (event) => { setForm((current) => ({ ...current, [name]: event.target.value })); setErrors((current) => ({ ...current, [name]: undefined })); };
  const submit = async (event) => { event.preventDefault(); if (submitting) return; setSubmitting(true); setGeneralError(''); try { await onSave({ ...form, expected_updated_at: specimen.updated_at }); onClose?.(); } catch (error) { setSubmitting(false); const data = error.response?.data; if (data && typeof data === 'object') setErrors(data); else setGeneralError('Não foi possível salvar as alterações. Tente novamente.'); } };
  return <Modal open={open} onClose={submitting ? () => {} : onClose} title="Editar exemplar" className="max-w-3xl">
    <form onSubmit={submit} className="max-h-[75vh] space-y-6 overflow-y-auto p-1" noValidate>
      <section className="grid gap-4 border-l-4 border-primary pl-4 sm:grid-cols-2" aria-labelledby="edit-identification-heading">
        <h3 id="edit-identification-heading" className="flex items-center gap-3 text-lg font-extrabold uppercase sm:col-span-2"><span className="inline-grid h-8 w-8 place-items-center border-2 border-charcoal bg-lilac font-mono text-sm shadow-hard-sm">01</span>Identificação</h3>
        <FormField id="specimen-nickname" label="Nome" required error={fieldError(errors, 'nickname')}><Input value={form.nickname || ''} onChange={update('nickname')} maxLength={100} /></FormField>
        <FormField id="specimen-location" label="Localização" error={fieldError(errors, 'location_in_home')}><Input value={form.location_in_home || ''} onChange={update('location_in_home')} maxLength={100} /></FormField>
      </section>
      <section className="grid gap-4 border-l-4 border-coral pl-4 sm:grid-cols-2" aria-labelledby="edit-conditions-heading">
        <h3 id="edit-conditions-heading" className="flex items-center gap-3 text-lg font-extrabold uppercase sm:col-span-2"><span className="inline-grid h-8 w-8 place-items-center border-2 border-charcoal bg-coral font-mono text-sm shadow-hard-sm">02</span>Condições</h3>
        <FormField id="specimen-acquired-at" label="Data de aquisição" required error={fieldError(errors, 'acquired_at')}><Input type="date" value={form.acquired_at || ''} onChange={update('acquired_at')} /></FormField>
        <FormField id="specimen-soil" label="Descrição do solo" required error={fieldError(errors, 'initial_soil')}><Input value={form.initial_soil || ''} onChange={update('initial_soil')} /></FormField>
        <div className="sm:col-span-2"><LightOptionField value={form.initial_light || ''} onChange={(value) => { setForm((current) => ({ ...current, initial_light: value })); setErrors((current) => ({ ...current, initial_light: undefined })); }} error={fieldError(errors, 'initial_light')} /></div>
      </section>
      <div className="border-2 border-dashed border-charcoal bg-gray-100 p-3 text-sm text-charcoal/70"><strong className="font-mono text-xs uppercase tracking-wider">Métricas</strong><p className="mt-1">As métricas serão definidas pela taxonomia em uma etapa futura.</p></div>
      {generalError && <Alert tone="critical">{generalError}</Alert>}
      <Button id="specimen-save" type="submit" variant="lime" disabled={submitting}>{submitting ? 'Salvando…' : 'Salvar alterações'}</Button>
    </form>
  </Modal>;
}
