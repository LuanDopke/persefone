import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import ContentState from '../components/ui/ContentState';
import Alert from '../components/ui/Alert';
import TaxonomyField from '../components/specimen/TaxonomyField';
import InitialPhotoField from '../components/specimen/InitialPhotoField';
import TaxonomyTree from '../components/observation/TaxonomyTree';
import apiClient, { createObservation, queryKeys } from '../services/apiClient';

export default function ObservationCatalogPage() {
  const queryClient = useQueryClient();
  const [term, setTerm] = useState('');
  const [species, setSpecies] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const observations = useQuery({ queryKey: queryKeys.observations.all, queryFn: () => apiClient.get('/api/observations/').then((response) => response.data) });
  const mutation = useMutation({
    mutationFn: createObservation,
    onSuccess: async () => { setTerm(''); setSpecies(null); setPhoto(null); setError(''); await queryClient.invalidateQueries({ queryKey: queryKeys.observations.all }); },
    onError: (requestError) => setError(requestError.response?.data?.image?.join?.(' ') || requestError.response?.data?.species?.join?.(' ') || 'Não foi possível registrar a observação.'),
  });
  const submit = (event) => {
    event.preventDefault();
    if (!species) { setError('Selecione a espécie observada.'); return; }
    const data = new FormData();
    data.append('species', species.id);
    if (photo) data.append('image', photo);
    mutation.mutate(data);
  };
  const rows = observations.data?.results || [];

  return <PageContainer className="space-y-8">
    <PageHeader eyebrow="Arquivo de campo" title="Catálogo de observações" description="Registre uma espécie conhecida e explore sua posição na árvore taxonômica." />
    <section className="grid min-w-0 gap-8 xl:grid-cols-[24rem_minmax(0,1fr)] xl:items-start">
      <Card title="Nova observação" headerTone="charcoal" className="xl:sticky xl:top-24">
        <form onSubmit={submit} className="space-y-5" noValidate>
          <TaxonomyField term={term} onTermChange={(value) => { setTerm(value); if (species && value !== species.scientific_name) setSpecies(null); setError(''); }} selected={species} onSelect={(selected) => { setSpecies(selected); setTerm(selected.scientific_name); setError(''); }} error={!species && error ? error : undefined} />
          <InitialPhotoField id="observation-photo" label="Foto da observação (opcional)" file={photo} onChange={setPhoto} />
          {error && species && <Alert tone="critical">{error}</Alert>}
          <Button type="submit" variant="lime" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? 'Registrando…' : 'Registrar observação'}</Button>
        </form>
      </Card>
      <section aria-labelledby="observation-tree-heading" className="min-w-0 space-y-5">
        <div className="flex items-center gap-4"><div className="border-4 border-charcoal bg-primary px-4 py-2 text-offwhite shadow-hard-sm"><h2 id="observation-tree-heading" className="text-lg font-bold uppercase">Árvore das espécies encontradas</h2></div><div className="h-1 flex-1 bg-charcoal" /></div>
        {observations.isLoading ? <ContentState status="loading" busyLabel="Carregando observações" /> : observations.isError ? <ContentState status="error" title="Não foi possível carregar as observações." action={<Button onClick={() => observations.refetch()}>Tentar novamente</Button>} /> : <TaxonomyTree observations={rows} />}
      </section>
    </section>
  </PageContainer>;
}
