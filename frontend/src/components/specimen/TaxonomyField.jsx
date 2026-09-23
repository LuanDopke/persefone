import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Input from '../ui/Input';
import { Button } from '../ui/Button';
import { createLocalSpecies, searchSpecies, queryKeys } from '../../services/apiClient';

export default function TaxonomyField({ term, onTermChange, selected, onSelect, error }) {
  const queryClient = useQueryClient();
  const normalizedTerm = term.trim();
  const query = useQuery({
    queryKey: queryKeys.species.search(normalizedTerm),
    queryFn: () => searchSpecies(normalizedTerm),
    enabled: normalizedTerm.length > 1,
  });
  const results = query.data?.results || [];
  const createMutation = useMutation({
    mutationFn: () => createLocalSpecies(normalizedTerm),
    onSuccess: (species) => {
      onSelect(species);
      queryClient.invalidateQueries({ queryKey: queryKeys.species.all });
    },
  });
  const createError = createMutation.error?.response?.data?.scientific_name;
  const createErrorText = Array.isArray(createError) ? createError.join(' ') : createError;

  return (
    <div className="space-y-3">
      <label className="block font-bold" htmlFor="taxonomy-search">Buscar espécie ou gênero</label>
      <Input
        id="taxonomy-search"
        value={term}
        onChange={(event) => onTermChange(event.target.value)}
        aria-describedby={error ? 'taxonomy-error' : undefined}
        aria-invalid={Boolean(error)}
        autoComplete="off"
      />
      {selected && <p className="border-2 border-charcoal bg-lime px-3 py-2 font-bold">Selecionada: {selected.scientific_name}</p>}
      {error && <p id="taxonomy-error" className="font-bold text-red-700">{error}</p>}
      {query.isFetching && <p role="status">Buscando taxonomia…</p>}
      {query.isError && <p role="alert">Não foi possível pesquisar o catálogo.</p>}
      {normalizedTerm.length > 1 && query.isSuccess && (
        <div id="taxonomy-results" role="listbox" aria-label="Resultados de taxonomia" className="space-y-2">
          {results.length === 0 ? <p>Nenhuma taxonomia encontrada.</p> : results.map((species) => (
            <button
              key={species.id}
              type="button"
              role="option"
              aria-selected={selected?.id === species.id}
              aria-label={`Selecionar ${species.scientific_name}`}
              onClick={() => onSelect(species)}
              className="min-h-11 w-full border-2 border-charcoal bg-offwhite px-3 py-2 text-left font-semibold focus:ring-4 focus:ring-lime"
            >
              <span className="block italic">{species.scientific_name}</span>
              {species.common_name && <span className="block text-sm">{species.common_name}</span>}
            </button>
          ))}
        </div>
      )}
      {normalizedTerm.length > 1 && query.isSuccess && results.length === 0 && !selected && (
        <div className="space-y-3 border-4 border-charcoal bg-gray-50 p-4">
          <label className="block font-bold" htmlFor="taxonomy-create-name">Nome da nova taxonomia</label>
          <Input
            id="taxonomy-create-name"
            value={term}
            onChange={(event) => onTermChange(event.target.value)}
            aria-invalid={Boolean(createErrorText)}
            aria-describedby={createErrorText ? 'taxonomy-create-error' : undefined}
          />
          {createErrorText && <p id="taxonomy-create-error" className="font-bold text-red-700">{createErrorText}</p>}
          <Button type="button" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Cadastrando…' : `Cadastrar ${normalizedTerm}`}
          </Button>
        </div>
      )}
    </div>
  );
}
