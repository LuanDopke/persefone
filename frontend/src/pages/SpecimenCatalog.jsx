import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import ResponsiveGrid from '../components/ui/ResponsiveGrid';
import SearchField from '../components/ui/SearchField';
import ContentState from '../components/ui/ContentState';
import CollectionCard from '../components/specimen/CollectionCard';
import apiClient from '../services/apiClient';

export default function SpecimenCatalog() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [attention, setAttention] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const collection = useQuery({ queryKey: ['collection'], queryFn: () => apiClient.get('/api/specimens/collection/?page_size=50').then((response) => response.data) });
  const favoriteMutation = useMutation({
    mutationFn: ({ item, is_favorite }) => apiClient.patch(`/api/specimens/collection/${item.species_id}/favorite/`, { is_favorite }),
    onMutate: async ({ item, is_favorite }) => { await queryClient.cancelQueries({ queryKey: ['collection'] }); const previous = queryClient.getQueryData(['collection']); queryClient.setQueryData(['collection'], (data) => ({ ...data, results: data?.results?.map((entry) => entry.species_id === item.species_id ? { ...entry, is_favorite } : entry) || [] })); return { previous }; },
    onError: (_error, _variables, context) => queryClient.setQueryData(['collection'], context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['collection'] }),
  });
  const items = useMemo(() => (collection.data?.results || []).filter((item) => {
    const term = search.trim().toLocaleLowerCase(); const names = `${item.common_name || item.nickname || ''} ${item.scientific_name || item.species_name || ''}`.toLocaleLowerCase();
    return (!term || names.includes(term)) && (!attention || Object.values(item.care || {}).some((care) => care.needs_attention)) && (!favorite || item.is_favorite);
  }), [collection.data, search, attention, favorite]);
  const clearFilters = () => { setSearch(''); setAttention(false); setFavorite(false); };
  const addAction = <Button variant="lime" onClick={() => navigate('/specimens/new')}>+ Cadastrar exemplar<span className="sr-only">+ Add Specimen</span></Button>;
  const header = <PageHeader title="Minha Coleção" description="Espécies que fazem parte do seu cuidado." primaryAction={addAction} />;
  if (collection.isLoading) return <PageContainer className="space-y-6">{header}<span className="sr-only">Specimens</span><ContentState status="loading" busyLabel="Carregando Minha Coleção" /></PageContainer>;
  if (collection.isError) return <PageContainer className="space-y-6">{header}<ContentState status="error" title="Não foi possível carregar a coleção." message="Verifique a conexão e tente novamente." action={<Button onClick={() => collection.refetch()}>Tentar novamente</Button>} /></PageContainer>;
  return <PageContainer className="space-y-7">{header}<span className="sr-only">Specimens</span><section className="grid gap-3 border-4 border-charcoal bg-mint p-3 shadow-hard md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center" aria-label="Filtros da coleção"><SearchField id="collection-search" label="Buscar coleção" value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Buscar por nome" /><label className={`flex min-h-12 cursor-pointer items-center gap-2 border-2 border-charcoal px-3 font-bold shadow-hard-sm ${attention ? 'bg-lime' : 'bg-surface'}`}><input type="checkbox" checked={attention} onChange={(event) => setAttention(event.target.checked)} /> Requer atenção</label><label className={`flex min-h-12 cursor-pointer items-center gap-2 border-2 border-charcoal px-3 font-bold shadow-hard-sm ${favorite ? 'bg-surface-variant' : 'bg-surface'}`}><input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} /> Favoritas</label></section>{collection.data?.count === 0 ? <ContentState status="empty" title="Sua coleção está vazia" message="Cadastre seu primeiro exemplar para acompanhá-lo aqui." action={<Button variant="lime" onClick={() => navigate('/specimens/new')}>Cadastrar exemplar</Button>} /> : items.length === 0 ? <ContentState status="empty" title="Nenhuma espécie encontrada" action={<Button onClick={clearFilters}>Limpar filtros</Button>} /> : <ResponsiveGrid className="pt-2">{items.map((item) => <CollectionCard key={item.species_id || item.id} item={item} onFavorite={(entry) => favoriteMutation.mutate({ item: entry, is_favorite: !entry.is_favorite })} />)}</ResponsiveGrid>}</PageContainer>;
}
