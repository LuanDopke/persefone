import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '../components/layout/PageContainer';
import PageHeader from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import ContentState from '../components/ui/ContentState';
import ExternalKeyImportPanel from '../components/identification/ExternalKeyImportPanel';
import { discoverIdentificationKeys, listIdentificationKeys, queryKeys } from '../services/apiClient';

export default function IdentificationKeysPage() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(1);
  const [importTarget, setImportTarget] = useState(null);
  const rank = params.get('scope_rank') || '';
  const scopeKey = params.get('scope_gbif_key') || '';
  const filters = { search: search.trim(), mine: mine ? 1 : undefined, scope_rank: rank || undefined, scope_gbif_key: scopeKey || undefined, page };
  const query = useQuery({ queryKey: queryKeys.identificationKeys.list(filters), queryFn: () => listIdentificationKeys(filters) });
  const discoveryTerm = search.trim();
  const discovery = useQuery({ queryKey: queryKeys.identificationKeys.discovery(discoveryTerm), queryFn: () => discoverIdentificationKeys(discoveryTerm), enabled: !mine && discoveryTerm.length >= 2 });
  return <PageContainer width="wide" className="space-y-7">
    <PageHeader eyebrow="Identificação colaborativa" title="Chaves de identificação" description="Busque chaves locais e em catálogos externos. Os percursos podem ser sequenciais ou por seleção livre de características." primaryAction={<div className="flex flex-wrap gap-2"><Link to="/keys/new" className="inline-flex border-4 border-charcoal bg-lime px-5 py-2.5 font-bold uppercase shadow-hard focus-visible:ring-4 focus-visible:ring-lime">Criar chave</Link><Button variant="secondary" onClick={() => setImportTarget({ source_kind: 'sdd' })}>Importar SDD</Button></div>} />
    {importTarget && <ExternalKeyImportPanel candidate={importTarget.external_id ? importTarget : null} onClose={() => setImportTarget(null)} />}
    <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de chave"><Button size="sm" variant={!mine ? 'lime' : 'secondary'} aria-pressed={!mine} onClick={() => { setMine(false); setPage(1); }}>Públicas</Button><Button size="sm" variant={mine ? 'lime' : 'secondary'} aria-pressed={mine} onClick={() => { setMine(true); setPage(1); }}>Minhas chaves</Button></div>
    {(rank || scopeKey) && <p className="border-l-4 border-primary bg-mint p-3 text-sm">Exibindo chaves para o grupo selecionado na taxonomia. <Link to="/keys" className="font-bold underline">Ver todas</Link></p>}
    <label className="block max-w-lg font-bold">Buscar chaves<input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="mt-2 w-full border-2 border-charcoal bg-surface px-3 py-2" placeholder="Título, família ou gênero" /></label>
    {query.isPending ? <ContentState status="loading" busyLabel="Carregando chaves" /> : query.isError ? <ContentState status="error" title="Não foi possível carregar as chaves." action={<Button onClick={() => query.refetch()}>Tentar novamente</Button>} /> : <>
      <p className="font-mono text-xs uppercase">{query.data.count} chaves</p>
      {query.data.results.length ? <ul className="grid gap-4 md:grid-cols-2">{query.data.results.map((item) => <li key={item.id}><Link to={`/keys/${item.id}`} className="block h-full space-y-2 border-2 border-charcoal bg-surface p-4 shadow-hard-sm hover:bg-mint/40 focus-visible:ring-4 focus-visible:ring-lime"><span className="font-mono text-xs uppercase">{item.scope_rank === 'family' ? 'Família' : 'Gênero'} · {item.scope_name}</span><h2 className="text-lg font-bold">{item.title}</h2><p className="line-clamp-2 text-sm">{item.coverage}</p><p className="text-xs">{item.published_version ? `Versão ${item.published_version} · Criada pela comunidade` : 'Rascunho privado'}{item.archived && ' · Arquivada'}</p></Link></li>)}</ul> : <p className="border-2 border-dashed border-charcoal p-5">Nenhuma chave encontrada.</p>}
      <div className="flex gap-2">{page > 1 && <Button size="sm" onClick={() => setPage(page - 1)}>Anterior</Button>}{query.data.next && <Button size="sm" onClick={() => setPage(query.data.next)}>Próxima página</Button>}</div>
    </>}
    {!mine && discoveryTerm.length >= 2 && <section className="space-y-4" aria-label="Chaves encontradas em fontes externas"><div><h2 className="inline-block border-4 border-charcoal bg-amber px-4 py-2 font-bold uppercase">Fontes externas</h2><p className="mt-2 text-sm">Resultados da KeyBase e da Plazi. A chave só entra no catálogo local depois de importada, revisada e publicada.</p></div>
      {discovery.isFetching && <p role="status">Consultando fontes externas…</p>}
      {discovery.isError && <p role="alert">Não foi possível consultar as fontes externas.</p>}
      {discovery.data?.errors?.length > 0 && <p className="text-sm">Fontes temporariamente indisponíveis: {discovery.data.errors.join(', ')}.</p>}
      {discovery.data?.results?.length > 0 ? <ul className="grid gap-4 md:grid-cols-2">{discovery.data.results.map((item) => <li key={`${item.source_kind}-${item.external_id}`} className="space-y-3 border-2 border-charcoal bg-surface p-4 shadow-hard-sm"><p className="font-mono text-xs uppercase">{item.source_kind === 'keybase' ? 'KeyBase' : 'Plazi'} · {item.scope_name}</p><h3 className="font-bold">{item.title}</h3><p className="text-sm">{item.coverage}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="lime" onClick={() => setImportTarget(item)}>Importar para revisão</Button><Link to={`/keys/external?source=${item.source_kind}&id=${item.external_id}`} className="border-2 border-charcoal px-3 py-1.5 text-sm font-bold">Ler no Persefone</Link></div></li>)}</ul> : !discovery.isFetching && discovery.data && <p className="border-2 border-dashed border-charcoal p-4">Nenhuma chave externa encontrada.</p>}
    </section>}
  </PageContainer>;
}
