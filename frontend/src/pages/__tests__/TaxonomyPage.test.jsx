import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import TaxonomyPage from '../TaxonomyPage';
import apiClient from '../../services/apiClient';

const rows = {
  order: { key: 1, scientific_name: 'Alismatales', rank: 'order', num_descendants: 10 },
  family: { key: 2, scientific_name: 'Araceae', rank: 'family', order: 'Alismatales', order_key: 1, num_descendants: 8 },
  genus: { key: 3, scientific_name: 'Monstera', rank: 'genus', order: 'Alismatales', order_key: 1, family: 'Araceae', family_key: 2, num_descendants: 2 },
  species: { key: 4, scientific_name: 'Monstera deliciosa', rank: 'species', authorship: 'Liebm.', order: 'Alismatales', order_key: 1, family: 'Araceae', family_key: 2, genus: 'Monstera', genus_key: 3, num_descendants: 0 },
};

function profile(id) {
  const taxon = Object.values(rows).find((row) => row.key === Number(id)) || rows.species;
  return { taxon: { ...taxon, kingdom: 'Plantae' }, descriptions: [], profiles: [], vernacular_names: [], distributions: [], occurrence_count: 12, image_count: 0, images: [], literature: [], warnings: [] };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(apiClient, 'get').mockImplementation((url, config) => {
    const profileMatch = url.match(/taxonomy\/(\d+)\/profile/);
    if (profileMatch) return Promise.resolve({ data: profile(profileMatch[1]) });
    return Promise.resolve({ data: { count: 1, offset: 0, limit: 24, end_of_records: true, results: [rows[config.params.rank]] } });
  });
});

it('abre dinamicamente ordem, família, gênero e espécie', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><TaxonomyPage /></QueryClientProvider>);

  fireEvent.click(await screen.findByRole('button', { name: /alismatales/i }));
  fireEvent.click(await screen.findByRole('button', { name: /araceae/i }));
  fireEvent.click(await screen.findByRole('button', { name: /^monstera\b/i }));
  fireEvent.click(await screen.findByRole('button', { name: /monstera deliciosa/i }));

  expect(await screen.findByRole('heading', { name: 'Monstera deliciosa' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /abrir no gbif/i })).toHaveAttribute('href', 'https://www.gbif.org/species/4');
  await waitFor(() => expect(apiClient.get.mock.calls.filter(([url]) => url === '/api/species/taxonomy/')).toHaveLength(4));
});

it('busca um gênero sem exigir navegação prévia e recompõe seus ancestrais', async () => {
  apiClient.get.mockImplementation((url, config) => {
    const profileMatch = url.match(/taxonomy\/(\d+)\/profile/);
    if (profileMatch) return Promise.resolve({ data: profile(profileMatch[1]) });
    const result = config.params.rank === 'genus'
      ? { key: 2874710, scientific_name: 'Begonia', rank: 'genus', order: 'Cucurbitales', order_key: 7224005, family: 'Begoniaceae', family_key: 6638 }
      : rows[config.params.rank];
    return Promise.resolve({ data: { count: 1, offset: 0, limit: 24, end_of_records: true, results: [result] } });
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><TaxonomyPage /></QueryClientProvider>);

  const input = screen.getByLabelText('Buscar gêneros');
  fireEvent.change(input, { target: { value: 'Begonia' } });
  fireEvent.submit(input.closest('form'));
  fireEvent.click(await screen.findByRole('button', { name: /^begonia\b/i }));

  expect(screen.getByLabelText('Caminho taxonômico selecionado')).toHaveTextContent(/Plantae.*Cucurbitales.*Begoniaceae.*Begonia/);
  expect(apiClient.get).toHaveBeenCalledWith('/api/species/taxonomy/', expect.objectContaining({ params: expect.objectContaining({ rank: 'genus', q: 'Begonia' }) }));
});
