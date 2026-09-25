import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import ObservationDetailPage from '../ObservationDetailPage';
import apiClient from '../../services/apiClient';

afterEach(() => vi.restoreAllMocks());

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<MemoryRouter initialEntries={['/observations/entry-1']}><QueryClientProvider client={client}><Routes><Route path="/observations/:observationId" element={<ObservationDetailPage />} /></Routes></QueryClientProvider></MemoryRouter>);
}

function mockObservationGet(value) {
  vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
    if (url.endsWith('/key-runs/')) return { data: [] };
    if (url === '/api/identification-keys/') return { data: { count: 0, results: [] } };
    return { data: typeof value === 'function' ? value() : value };
  });
}

it('registra nota de outro indivíduo e hipótese livre sem espécie inicial', async () => {
  mockObservationGet({
    id: 'entry-1', title: 'Planta da praça', species: null, species_detail: null, confirmed_hypothesis: null,
    observed_at: '2026-09-22T12:00:00Z', latitude: null, longitude: null,
    evidence: [], hypotheses: [], identification_events: [],
  });
  const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: { id: 'created' } });
  renderPage();
  expect(await screen.findByRole('heading', { level: 1, name: 'Planta da praça' })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Adicionar evidência' })).toHaveLength(2);
  expect(screen.getByText(/uma nota sobre outro indivíduo parecido/i)).toBeInTheDocument();
  expect(screen.getByText(/identificação provisória/i)).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Adicionar evidência' })[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Outro indivíduo' }));
  expect(screen.getByRole('button', { name: 'Outro indivíduo' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.change(screen.getByLabelText('Nota'), { target: { value: 'Flores amarelas' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar evidência' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/api/observations/entry-1/evidence/', expect.any(FormData), expect.any(Object)));
  expect(post.mock.calls[0][1].get('subject')).toBe('comparison');

  fireEvent.click(screen.getAllByRole('button', { name: 'Novo palpite' })[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Texto livre' }));
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Begonia' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar hipótese' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/api/observations/entry-1/hypotheses/', expect.objectContaining({ source: 'manual', name: 'Begonia' })));
});

it('oferece confirmação para hipótese do catálogo e reabertura da ficha', async () => {
  const base = {
    id: 'entry-1', title: 'Planta da praça', species: null, species_detail: null, confirmed_hypothesis: null,
    observed_at: '2026-09-22T12:00:00Z', latitude: null, longitude: null, evidence: [],
    hypotheses: [{ id: 'candidate-1', name: 'Begonia maculata', rank: 'species', source: 'catalog', notes: '', discarded_at: null, created_at: '2026-09-22T12:00:00Z' }],
    identification_events: [],
  };
  let current = base;
  mockObservationGet(() => current);
  const post = vi.spyOn(apiClient, 'post').mockImplementation(async (url) => {
    if (url.endsWith('/confirm/')) current = { ...base, species: 3, species_detail: { scientific_name: 'Begonia maculata' }, confirmed_hypothesis: 'candidate-1' };
    if (url.endsWith('/reopen/')) current = base;
    return { data: current };
  });
  renderPage();
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmar espécie' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar espécie' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/api/observations/entry-1/confirm/', { hypothesis_id: 'candidate-1', notes: '' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Reabrir identificação' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/api/observations/entry-1/reopen/', { notes: '' }));
});

it('permite ampliar e comparar fotos e corrigir nota com histórico', async () => {
  mockObservationGet({
    id: 'entry-1', title: 'Planta da praça', species: null, species_detail: null, confirmed_hypothesis: null,
    observed_at: '2026-09-22T12:00:00Z', updated_at: '2026-09-22T12:00:00Z', latitude: null, longitude: null,
    evidence: [
      { id: 'photo-1', image: '/one.avif', notes: 'Folhas verdes', subject: 'original', observed_at: '2026-09-22T12:00:00Z', latitude: null, longitude: null, revisions: [{ id: 'revision-1', before: { notes: 'Folhas' }, after: { notes: 'Folhas verdes' }, created_at: '2026-09-22T13:00:00Z' }] },
      { id: 'photo-2', image: '/two.avif', notes: 'Flores amarelas', subject: 'comparison', observed_at: '2026-09-22T13:00:00Z', latitude: null, longitude: null, revisions: [] },
    ],
    hypotheses: [], identification_events: [],
  });
  const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: {} });
  renderPage();
  expect(await screen.findByText('Folhas verdes')).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Comparar fotos' })[0]);
  expect(within(screen.getByRole('dialog')).getAllByRole('img')).toHaveLength(2);
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Fechar' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Corrigir registro' })[0]);
  fireEvent.change(screen.getByRole('textbox', { name: 'Nota' }), { target: { value: 'Folhas com nervuras claras' } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar correção' }));
  await waitFor(() => expect(patch).toHaveBeenCalledWith('/api/observations/entry-1/evidence/photo-1/', expect.objectContaining({ notes: 'Folhas com nervuras claras' })));
  fireEvent.click(screen.getByText('Correções (1)'));
  expect(screen.getByText(/Folhas → Folhas verdes/)).toBeInTheDocument();
});
