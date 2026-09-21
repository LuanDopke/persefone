import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { vi, it, beforeEach } from 'vitest';
import VisualTimeline from '../VisualTimeline';
import apiClient from '../../../services/apiClient';

beforeEach(() => vi.restoreAllMocks());

it('exibe registro visual e ação de adicionar', async () => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { count: 1, next: null, results: [{ id: '1', image: '/photo.avif', captured_at: '2026-09-15T09:00:00Z', notes: 'Folha nova' }] } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><VisualTimeline specimenId="abc" specimenName="Folhinha" onAdd={() => {}} /></QueryClientProvider>);
  expect(await screen.findByText('Folha nova')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Adicionar foto' })).toBeInTheDocument();
});
