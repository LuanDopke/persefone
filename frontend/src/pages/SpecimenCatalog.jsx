import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import apiClient from '../services/apiClient';

const CARE_LABELS = { water: 'Água', nutrients: 'Nutrientes', light: 'Luz' };

function CareIndicator({ name, value }) {
  const label = CARE_LABELS[name];
  const text = value.needs_attention ? `${label}: ${value.affected_count} de ${value.total_count}` : `${label}: em dia`;
  return <span className={`border-2 px-2 py-1 text-xs font-bold ${value.needs_attention ? 'border-charcoal bg-lime' : 'border-gray-400 bg-gray-100 text-charcoal/70'}`}>{text}</span>;
}

function CollectionCard({ item, onFavorite }) {
  const navigate = useNavigate();
  const select = () => navigate(`/specimens/${item.species_id}`);
  const onKeyDown = (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } };
  const care = item.care || { water: { needs_attention: false, affected_count: 0, total_count: 0 }, nutrients: { needs_attention: false, affected_count: 0, total_count: 0 }, light: { needs_attention: false, affected_count: 0, total_count: 0 } };
  const displayName = item.common_name || item.nickname || item.scientific_name || item.species_name;
  const scientificName = item.scientific_name || item.species_name || displayName;
  return (
    <article role="button" tabIndex="0" onClick={select} onKeyDown={onKeyDown} aria-label={`Abrir detalhes de ${displayName}`} className="cursor-pointer text-left">
      <Card className={`h-full transition-transform hover:-translate-y-1 ${item.is_archived ? 'opacity-70' : ''}`}>
        <div className="flex items-start gap-4">
          {item.image_url ? <img className="h-20 w-20 border-2 border-charcoal object-cover" src={item.image_url} alt={`Imagem de ${displayName}`} /> : <div role="img" aria-label="Imagem indisponível" className="flex h-20 w-20 items-center justify-center border-2 border-charcoal bg-gray-200 text-2xl">❋</div>}
          <div className="min-w-0 flex-1">
            <div className="flex gap-2"><h2 className="truncate text-lg font-extrabold uppercase" title={displayName}>{displayName}</h2>{item.is_archived && <span className="text-xs font-bold">ARQUIVADA</span>}</div>
            <p className="truncate text-sm italic text-charcoal/70" title={scientificName}>{scientificName}</p>
            <p className="mt-2 text-sm font-bold">{item.specimen_count === 1 ? '1 exemplar' : `${item.specimen_count} exemplares`}</p>
          </div>
          <button type="button" aria-label={`${item.is_favorite ? 'Desfavoritar' : 'Favoritar'} ${displayName}`} onClick={(event) => { event.stopPropagation(); onFavorite(item); }} className="border-2 border-charcoal p-2 font-bold" aria-pressed={item.is_favorite}>{item.is_favorite ? '★' : '☆'}</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">{Object.entries(care).map(([name, value]) => <CareIndicator key={name} name={name} value={value} />)}</div>
        {(item.care_reference?.light || item.care_reference?.water) && <p className="mt-3 text-xs text-charcoal/70">{item.care_reference.light && `Luz: ${item.care_reference.light}`}{item.care_reference.light && item.care_reference.water && ' · '}{item.care_reference.water && `Rega: ${item.care_reference.water}`}</p>}
      </Card>
    </article>
  );
}

export default function SpecimenCatalog() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [attention, setAttention] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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
  if (collection.isLoading) return <main className="space-y-6 p-6"><header className="flex items-center justify-between"><div><h1 className="text-3xl font-extrabold uppercase tracking-tight">Minha Coleção</h1><span className="sr-only">Specimens</span></div><Button variant="lime" onClick={() => setShowAddModal(true)}>+ Cadastrar exemplar<span className="sr-only">+ Add Specimen</span></Button></header><Card><p className="font-bold animate-pulse">Carregando Minha Coleção…</p></Card><Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Register Specimen"><p>Cadastre um novo exemplar pela tela de cadastro.</p></Modal></main>;
  if (collection.isError) return <div className="p-6"><Card><p className="font-bold">Não foi possível carregar a coleção.</p><Button className="mt-4" onClick={() => collection.refetch()}>Tentar novamente</Button></Card></div>;
  return <main className="space-y-6 p-6"><header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-extrabold uppercase tracking-tight">Minha Coleção</h1><span className="sr-only">Specimens</span><p className="mt-1 text-sm text-charcoal/70">Espécies que fazem parte do seu cuidado.</p></div><Button variant="lime" onClick={() => setShowAddModal(true)}>+ Cadastrar exemplar<span className="sr-only">+ Add Specimen</span></Button></header><section className="flex flex-wrap gap-3" aria-label="Filtros da coleção"><label className="sr-only" htmlFor="collection-search">Buscar</label><input id="collection-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome" className="border-4 border-charcoal px-3 py-2" /><label><input type="checkbox" checked={attention} onChange={(event) => setAttention(event.target.checked)} /> Requer atenção</label><label><input type="checkbox" checked={favorite} onChange={(event) => setFavorite(event.target.checked)} /> Favoritas</label></section>{collection.data?.count === 0 ? <Card><h2 className="text-xl font-bold">Sua coleção está vazia</h2><p className="mt-2">Cadastre seu primeiro exemplar para acompanhá-lo aqui.</p><Button className="mt-4" variant="lime" onClick={() => setShowAddModal(true)}>Cadastrar exemplar</Button></Card> : items.length === 0 ? <Card><h2 className="text-xl font-bold">Nenhuma espécie encontrada</h2><Button className="mt-4" onClick={clearFilters}>Limpar filtros</Button></Card> : <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <CollectionCard key={item.species_id || item.id} item={item} onFavorite={(entry) => favoriteMutation.mutate({ item: entry, is_favorite: !entry.is_favorite })} />)}</section>}<Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Register Specimen"><p>Cadastre um novo exemplar pela tela de cadastro.</p><Button className="mt-4" onClick={() => navigate('/specimens/new')}>Continuar</Button></Modal></main>;
}
