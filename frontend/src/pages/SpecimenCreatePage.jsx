import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import Input from '../components/ui/Input';
import TaxonomyField from '../components/specimen/TaxonomyField';
import InitialPhotoField from '../components/specimen/InitialPhotoField';
import LightOptionField from '../components/specimen/LightOptionField';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import FormField from '../components/ui/FormField';
import { createSpecimen, queryKeys } from '../services/apiClient';

function localDateValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function fieldError(errors, name) {
  const value = errors[name];
  return Array.isArray(value) ? value.join(' ') : value;
}

export default function SpecimenCreatePage() {
  const today = localDateValue();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [taxonomyTerm, setTaxonomyTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [form, setForm] = useState({ nickname: '', acquired_at: today, initial_soil: '', initial_light: '' });
  const [errors, setErrors] = useState({});
  const [initialPhoto, setInitialPhoto] = useState(null);
  const submittingRef = useRef(false);

  const mutation = useMutation({
    mutationFn: createSpecimen,
    onSuccess: async (specimen) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.specimens.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.collection.all }),
      ]);
      navigate(`/specimens/instances/${specimen.id}`);
    },
    onError: (error) => {
      submittingRef.current = false;
      const responseErrors = error.response?.data;
      setErrors(responseErrors && typeof responseErrors === 'object' ? responseErrors : { general: 'Não foi possível cadastrar o exemplar. Tente novamente.' });
    },
  });

  const update = (name) => (event) => {
    setForm((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (submittingRef.current || mutation.isPending) return;
    const nextErrors = {};
    if (!selectedSpecies) nextErrors.species = 'Selecione uma espécie ou gênero.';
    if (!form.initial_soil.trim()) nextErrors.initial_soil = 'Informe a condição inicial do solo.';
    if (!form.initial_light) nextErrors.initial_light = 'Selecione a luminosidade inicial.';
    if (!form.acquired_at) nextErrors.acquired_at = 'Informe a data de aquisição.';
    else if (form.acquired_at > today) nextErrors.acquired_at = 'A data não pode estar no futuro.';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload = new FormData();
    payload.append('species', selectedSpecies.id);
    payload.append('nickname', form.nickname.trim());
    payload.append('acquired_at', form.acquired_at);
    payload.append('initial_soil', form.initial_soil.trim());
    payload.append('initial_light', form.initial_light);
    payload.append('client_timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    if (initialPhoto) payload.append('initial_photo', initialPhoto);
    submittingRef.current = true;
    mutation.mutate(payload);
  };

  return (
    <PageContainer width="standard" className="space-y-6">
      <PageHeader title="Cadastrar exemplar" description="Registre a identificação e as condições iniciais da planta." />
      <Card className="relative before:absolute before:-right-3 before:-top-3 before:h-8 before:w-8 before:rotate-6 before:border-4 before:border-charcoal before:bg-coral">
        <form className="space-y-7" onSubmit={submit} noValidate>
          <section aria-labelledby="taxonomy-heading" className="border-l-4 border-primary pl-4">
            <h2 id="taxonomy-heading" className="mb-4 flex items-center gap-3 text-xl font-extrabold uppercase"><span className="inline-grid h-8 w-8 place-items-center border-2 border-charcoal bg-lilac font-mono text-sm shadow-hard-sm">01</span>Identificação</h2>
            <TaxonomyField
              term={taxonomyTerm}
              onTermChange={(value) => {
                setTaxonomyTerm(value);
                if (selectedSpecies && value !== selectedSpecies.scientific_name) setSelectedSpecies(null);
                setErrors((current) => ({ ...current, species: undefined }));
              }}
              selected={selectedSpecies}
              onSelect={(species) => { setSelectedSpecies(species); setErrors((current) => ({ ...current, species: undefined })); }}
              error={fieldError(errors, 'species')}
            />
          </section>

          <section aria-labelledby="conditions-heading" className="grid grid-cols-1 gap-5 border-l-4 border-coral pl-4 sm:grid-cols-2">
            <h2 id="conditions-heading" className="flex items-center gap-3 text-xl font-extrabold uppercase sm:col-span-2"><span className="inline-grid h-8 w-8 place-items-center border-2 border-charcoal bg-coral font-mono text-sm shadow-hard-sm">02</span>Condições iniciais</h2>
            <FormField id="initial-soil" label="Solo inicial" required error={fieldError(errors, 'initial_soil')}><Input value={form.initial_soil} onChange={update('initial_soil')} /></FormField>
            <div>
              <LightOptionField
                value={form.initial_light}
                onChange={(value) => {
                  setForm((current) => ({ ...current, initial_light: value }));
                  setErrors((current) => ({ ...current, initial_light: undefined }));
                }}
                error={fieldError(errors, 'initial_light')}
              />
            </div>
            <FormField id="acquired-at" label="Data de aquisição" required error={fieldError(errors, 'acquired_at')}><Input type="date" max={today} value={form.acquired_at} onChange={update('acquired_at')} /></FormField>
            <FormField id="nickname" label="Apelido (opcional)" error={fieldError(errors, 'nickname')}><Input maxLength={100} value={form.nickname} onChange={update('nickname')} /></FormField>
          </section>
          <section aria-labelledby="photo-heading" className="border-l-4 border-botanical pl-4">
            <h2 id="photo-heading" className="mb-4 flex items-center gap-3 text-xl font-extrabold uppercase"><span className="inline-grid h-8 w-8 place-items-center border-2 border-charcoal bg-mint font-mono text-sm shadow-hard-sm">03</span>Linha do tempo visual</h2>
            <InitialPhotoField
              file={initialPhoto}
              onChange={(file) => { setInitialPhoto(file); setErrors((current) => ({ ...current, initial_photo: undefined })); }}
              error={fieldError(errors, 'initial_photo')}
            />
          </section>
          {errors.general && <p role="alert" className="border-4 border-red-700 p-3 font-bold text-red-700">{errors.general}</p>}
          <Button type="submit" id="specimen-submit" variant="lime" disabled={mutation.isPending} className="min-h-12 w-full sm:w-auto">
            {mutation.isPending ? 'Cadastrando…' : 'Cadastrar exemplar'}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}
