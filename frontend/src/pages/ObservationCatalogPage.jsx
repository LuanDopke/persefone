import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import ContentState from '../components/ui/ContentState';
import Alert from '../components/ui/Alert';
import SearchField from '../components/ui/SearchField';
import MediaFrame from '../components/ui/MediaFrame';
import InitialPhotoField from '../components/specimen/InitialPhotoField';
import LocationPicker from '../components/observation/LocationPicker';
import apiClient, { createObservation, queryKeys } from '../services/apiClient';

const FILTERS = [
  ['', 'Todas'],
  ['pending', 'Em identificação'],
  ['confirmed', 'Confirmadas'],
];

function ObservationCard({ observation }) {
  const identified = Boolean(observation.species_detail);
  return <li>
    <Link to={`/observations/${observation.id}`} className="group block h-full overflow-hidden border-2 border-charcoal bg-surface shadow-hard-sm outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-lime">
      <MediaFrame src={observation.image} alt={`Foto de ${observation.title}`} aspect="card" className="border-0 border-b-2" />
      <div className="space-y-3 p-4">
        <span className={`inline-block border-2 border-charcoal px-2 py-1 font-mono text-[10px] font-bold uppercase ${identified ? 'bg-mint' : 'bg-coral'}`}>{identified ? 'Espécie confirmada' : 'Em identificação'}</span>
        <div><h3 className="break-words text-lg font-bold group-hover:underline">{observation.title}</h3><p className="mt-1 text-sm italic text-charcoal/75">{identified ? observation.species_detail.scientific_name : `${observation.active_hypotheses_count || 0} hipóteses ativas`}</p></div>
        <p className="border-t-2 border-charcoal/20 pt-2 font-mono text-[10px] font-bold uppercase text-charcoal/65">Atualizada em {new Date(observation.updated_at || observation.observed_at).toLocaleDateString('pt-BR')}</p>
      </div>
    </Link>
  </li>;
}

export default function ObservationCatalogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState({ latitude: '', longitude: '' });
  const [showMap, setShowMap] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const observations = useInfiniteQuery({
    queryKey: queryKeys.observations.list(search.trim(), status),
    queryFn: ({ pageParam }) => apiClient.get('/api/observations/', { params: { page: pageParam, search: search.trim() || undefined, status: status || undefined } }).then((response) => response.data),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => lastPage.next ? pages.length + 1 : undefined,
  });
  const mutation = useMutation({
    mutationFn: createObservation,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.observations.all });
      navigate(`/observations/${created.id}`);
    },
    onError: (requestError) => {
      const data = requestError.response?.data;
      const value = data?.title || data?.image || data?.latitude || data?.longitude || data?.non_field_errors;
      setError(Array.isArray(value) ? value.join(' ') : value || 'Não foi possível registrar a observação.');
    },
  });
  const submit = (event) => {
    event.preventDefault();
    if (!title.trim()) { setError('Informe um título para a observação.'); return; }
    if (Boolean(location.latitude) !== Boolean(location.longitude)) { setError('Informe latitude e longitude juntas.'); return; }
    const data = new FormData();
    data.append('title', title.trim());
    if (notes.trim()) data.append('initial_notes', notes.trim());
    if (photo) data.append('image', photo);
    if (location.latitude && location.longitude) {
      data.append('latitude', location.latitude);
      data.append('longitude', location.longitude);
    }
    setError('');
    mutation.mutate(data);
  };
  const rows = observations.data?.pages.flatMap((page) => page.results) || [];
  const count = observations.data?.pages[0]?.count ?? 0;
  return <PageContainer width="wide" className="space-y-8">
    <PageHeader eyebrow="Arquivo de campo" title="Observações" description="Acompanhe plantas encontradas até chegar à identificação." primaryAction={<Button variant="lime" aria-expanded={creating} aria-controls="new-observation-form" onClick={() => setCreating((open) => !open)}>{creating ? 'Fechar cadastro' : 'Nova observação'}</Button>} />
    {creating && <section id="new-observation-form" className="max-w-3xl space-y-4" aria-labelledby="new-observation-heading">
      <h2 id="new-observation-heading" className="inline-block border-4 border-charcoal bg-primary px-4 py-2 text-lg font-bold uppercase text-offwhite shadow-hard-sm">Nova observação</h2>
      <form onSubmit={submit} className="space-y-5 border-l-4 border-primary bg-surface px-4 py-5 sm:px-6" noValidate>
        <label className="block font-bold" htmlFor="observation-title">Título da ficha<input id="observation-title" value={title} onChange={(event) => { setTitle(event.target.value); setError(''); }} maxLength={160} placeholder="Ex.: Planta da praça central" className="mt-2 w-full border-4 border-charcoal bg-offwhite px-4 py-3" required /></label>
        <label className="block font-bold" htmlFor="observation-notes">Primeira nota (opcional)<textarea id="observation-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows="3" className="mt-2 w-full border-4 border-charcoal bg-offwhite px-4 py-3" /></label>
        <InitialPhotoField id="observation-photo" label="Foto inicial (opcional)" file={photo} onChange={setPhoto} />
        <button type="button" aria-expanded={showMap} onClick={() => setShowMap((open) => !open)} className="border-b-2 border-charcoal font-bold">{showMap ? 'Ocultar localização' : 'Marcar localização no mapa (opcional)'}</button>
        {showMap && <LocationPicker value={location} onChange={setLocation} id="new-observation" />}
        {error && <Alert tone="critical">{error}</Alert>}
        <Button type="submit" variant="lime" disabled={mutation.isPending}>{mutation.isPending ? 'Registrando…' : 'Registrar observação'}</Button>
      </form>
    </section>}
    <section className="space-y-5" aria-labelledby="observation-list-heading">
      <div className="flex flex-wrap items-center gap-3"><h2 id="observation-list-heading" className="inline-block border-4 border-charcoal bg-coral px-4 py-2 text-lg font-bold uppercase shadow-hard-sm">Minhas fichas</h2><span className="font-mono text-sm font-bold">{count} registros</span></div>
      <SearchField label="Buscar observações" value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Buscar por título ou táxon" className="max-w-xl" />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar observações">{FILTERS.map(([value, label]) => <Button key={value} size="sm" variant={status === value ? 'lime' : 'secondary'} aria-pressed={status === value} onClick={() => setStatus(value)}>{label}</Button>)}</div>
      {observations.isPending ? <ContentState status="loading" busyLabel="Carregando observações" /> : observations.isError ? <ContentState status="error" title="Não foi possível carregar as observações." action={<Button onClick={() => observations.refetch()}>Tentar novamente</Button>} /> : rows.length ? <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{rows.map((row) => <ObservationCard key={row.id} observation={row} />)}</ul> : <div className="border-2 border-dashed border-charcoal bg-surface p-8"><p className="font-bold">{search || status ? 'Nenhuma ficha corresponde aos filtros.' : 'Nenhuma observação registrada.'}</p>{(search || status) && <Button size="sm" className="mt-4" onClick={() => { setSearch(''); setStatus(''); }}>Limpar filtros</Button>}</div>}
      {observations.hasNextPage && <Button onClick={() => observations.fetchNextPage()} disabled={observations.isFetchingNextPage}>{observations.isFetchingNextPage ? 'Carregando…' : 'Carregar mais observações'}</Button>}
    </section>
    <section className="border-l-4 border-primary bg-mint/30 px-4 py-3"><h2 className="font-bold uppercase">Explorar taxonomia</h2><p className="mt-1 text-sm">O catálogo apresenta também espécies que você não registrou. Suas observações estão nas fichas acima.</p><Link to="/taxonomy" className="mt-2 inline-block border-b-2 border-charcoal font-bold">Abrir navegador taxonômico →</Link></section>
  </PageContainer>;
}
