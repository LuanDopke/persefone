import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import ObservationCatalogPage from '../ObservationCatalogPage';
import apiClient from '../../services/apiClient';

beforeEach(() => vi.restoreAllMocks());

it('apresenta o cadastro e o estado inicial da árvore', async () => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { count: 0, results: [] } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><ObservationCatalogPage /></QueryClientProvider>);
  expect(screen.getByRole('heading', { level: 1, name: 'Catálogo de observações' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Registrar observação' })).toBeInTheDocument();
  expect(await screen.findByText('Nenhuma observação registrada')).toBeInTheDocument();
});
