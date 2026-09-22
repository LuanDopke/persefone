import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi, it, beforeEach, expect } from 'vitest';
import CareLogTimeline from '../CareLogTimeline';
import apiClient from '../../../services/apiClient';

beforeEach(() => vi.restoreAllMocks());

it('exibe atividade localizada e ocorrência', async () => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { count: 1, next: null, results: [{ id: '1', type: 'watering', occurred_at: '2026-09-15T09:00:00Z', created_at: '2026-09-15T09:01:00Z', notes: 'Nota' }] } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><CareLogTimeline specimenId="abc" /></QueryClientProvider>);
  expect(await screen.findByRole('heading', { name: 'Rega' })).toBeInTheDocument();
  expect(screen.getByText('Nota')).toBeInTheDocument();
  expect(screen.getByText('Registro 01')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Rega' }).closest('div')).toHaveClass('bg-info');
  expect(screen.getByRole('button', { name: /excluir rega de/i })).toBeInTheDocument();
});

it('confirma a exclusão e mostra a foto vinculada ao mesmo registro', async () => {
  const observation = { id: '7', type: 'observation', occurred_at: '2026-09-15T09:00:00Z', created_at: '2026-09-15T09:01:00Z', notes: 'Folha inclinada', visual_entry: { image: '/media/observation.avif' } };
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { count: 1, next: null, results: [observation] } });
  vi.spyOn(apiClient, 'delete').mockResolvedValue({});
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><CareLogTimeline specimenId="abc" /></QueryClientProvider>);
  expect(await screen.findByRole('img', { name: 'Foto anexada ao registro de observação' })).toHaveAttribute('src', '/media/observation.avif');
  fireEvent.click(screen.getByRole('button', { name: /excluir observação de/i }));
  expect(screen.getByRole('dialog', { name: 'Excluir registro' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Excluir definitivamente' }));
  await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/care-logs/7/', { params: { specimen_id: 'abc' } }));
});
