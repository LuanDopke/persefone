import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { browseTaxonomy } from '../../services/apiClient';

export default function TaxonPicker({ rank, parentKey, value, onChange, label }) {
  const [term, setTerm] = useState('');
  const results = useQuery({
    queryKey: ['identification-taxon-picker', rank, term],
    queryFn: () => browseTaxonomy({ rank, search: term.trim(), limit: 50 }),
    enabled: term.trim().length >= 2,
  });
  const parentField = rank === 'genus' ? 'family_key' : rank === 'species' ? 'genus_key' : null;
  const matches = (results.data?.results || []).filter((row) => !parentKey || row[parentField] === parentKey);
  return <div className="space-y-2">
    <label className="block font-bold">{label}
      <input type="search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder={`Buscar ${rank === 'family' ? 'família' : rank === 'genus' ? 'gênero' : 'espécie'}`} className="mt-2 w-full border-2 border-charcoal bg-offwhite px-3 py-2" />
    </label>
    {value && <p className="border-l-4 border-primary bg-mint px-3 py-2 text-sm">Selecionado: <i>{value.name}</i></p>}
    {term.trim().length >= 2 && <div className="max-h-48 space-y-1 overflow-auto" aria-label={`Resultados de ${label}`}>
      {results.isFetching && <p role="status">Buscando táxons…</p>}
      {results.isError && <p role="alert">Não foi possível consultar a taxonomia.</p>}
      {!results.isFetching && !matches.length && <p className="text-sm">Nenhum táxon deste grupo nos resultados. Refine a busca.</p>}
      {matches.map((row) => <button key={row.key} type="button" aria-pressed={value?.key === row.key} onClick={() => { onChange({ key: row.key, rank, name: row.scientific_name }); setTerm(''); }} className={`block w-full border-2 border-charcoal px-3 py-2 text-left ${value?.key === row.key ? 'bg-lime' : 'bg-surface hover:bg-mint'}`}>{row.scientific_name}</button>)}
    </div>}
  </div>;
}
