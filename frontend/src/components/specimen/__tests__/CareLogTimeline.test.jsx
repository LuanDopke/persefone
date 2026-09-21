import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { vi, it, beforeEach } from 'vitest';
import CareLogTimeline from '../CareLogTimeline';
import apiClient from '../../../services/apiClient';

beforeEach(() => vi.restoreAllMocks());

it('exibe atividade localizada e ocorrência', async () => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { count: 1, next: null, results: [{ id: '1', type: 'watering', occurred_at: '2026-09-15T09:00:00Z', created_at: '2026-09-15T09:01:00Z', notes: 'Nota' }] } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><CareLogTimeline specimenId="abc" /></QueryClientProvider>);
  expect(await screen.findByText('Rega')).toBeInTheDocument();
  expect(screen.getByText('Nota')).toBeInTheDocument();
});
