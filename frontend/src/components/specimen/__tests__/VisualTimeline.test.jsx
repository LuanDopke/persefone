import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi, it, beforeEach } from 'vitest';
import VisualTimeline from '../VisualTimeline';
import apiClient from '../../../services/apiClient';

beforeEach(() => vi.restoreAllMocks());

it('exibe e amplia fotos sem oferecer criação visual independente', async () => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { count: 1, next: null, results: [{ id: '1', image: '/photo.avif', captured_at: '2026-09-15T09:00:00Z', notes: 'Folha nova' }] } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><VisualTimeline specimenId="abc" specimenName="Folhinha" /></QueryClientProvider>);
  expect(await screen.findByText('Folha nova')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Adicionar foto' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /ampliar foto de folhinha/i }));
  expect(screen.getByRole('dialog', { name: /registro visual — folhinha/i })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Registro visual ampliado de Folhinha' })).toHaveAttribute('src', '/photo.avif');
});
