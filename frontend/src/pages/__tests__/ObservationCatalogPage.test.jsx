import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import ObservationCatalogPage from '../ObservationCatalogPage';
import apiClient from '../../services/apiClient';

beforeEach(() => vi.restoreAllMocks());

it('permite iniciar uma observação sem espécie nem foto', async () => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { count: 0, results: [] } });
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { id: 'new-observation' } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<MemoryRouter><QueryClientProvider client={client}><ObservationCatalogPage /></QueryClientProvider></MemoryRouter>);
  expect(screen.getByRole('heading', { level: 1, name: 'Observações' })).toBeInTheDocument();
  expect(await screen.findByText('Nenhuma observação registrada.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Nova observação' }));
  fireEvent.change(screen.getByLabelText('Título da ficha'), { target: { value: 'Planta da praça' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar observação' }));
  await waitFor(() => expect(post).toHaveBeenCalled());
  const data = post.mock.calls[0][1];
  expect(data.get('title')).toBe('Planta da praça');
  expect(data.get('species')).toBeNull();
  expect(data.get('image')).toBeNull();
});

it('busca e filtra as fichas antes de carregar a lista', async () => {
  const get = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { count: 0, results: [] } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<MemoryRouter><QueryClientProvider client={client}><ObservationCatalogPage /></QueryClientProvider></MemoryRouter>);
  await screen.findByText('Nenhuma observação registrada.');
  fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar observações' }), { target: { value: 'Begonia' } });
  fireEvent.click(screen.getByRole('button', { name: 'Em identificação' }));
  await waitFor(() => expect(get).toHaveBeenCalledWith('/api/observations/', { params: { page: 1, search: 'Begonia', status: 'pending' } }));
  expect(screen.getByRole('button', { name: 'Em identificação' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('link', { name: /Abrir navegador taxonômico/ })).toHaveAttribute('href', '/taxonomy');
});
