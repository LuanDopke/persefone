import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import ObservationKeyRuns from '../ObservationKeyRuns';
import apiClient from '../../../services/apiClient';

const step = { id: 's1', prompt: 'Há flores?', choices: [
  { text: 'Sim', taxon: { key: 400, rank: 'species', name: 'Begonia maculata' } },
  { text: 'Não', taxon: { key: 401, rank: 'species', name: 'Begonia venosa' } },
] };

it('pausa e retoma o percurso sem confirmar a espécie', async () => {
  let runs = [];
  vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
    if (url.includes('key-runs')) return { data: runs };
    if (url.includes('identification-keys') && url.endsWith('/')) return { data: { count: 1, results: [{ id: 'key-1', title: 'Begônias', scope_rank: 'genus', scope_name: 'Begonia' }] } };
    return { data: { version_id: 'version-1' } };
  });
  const post = vi.spyOn(apiClient, 'post').mockImplementation(async (url, payload) => {
    if (url.endsWith('/key-runs/')) runs = [{ id: 'run-1', key_id: 'key-1', key_title: 'Begônias', version_number: 1, scope_name: 'Begonia', status: 'active', graph: { start: 's1', steps: [step] }, answers: [], step, result_taxon: null, revisions: [] }];
    if (url.endsWith('/answers/') && payload.choice_index == null) runs = [{ ...runs[0], status: 'paused' }];
    if (url.endsWith('/answers/') && payload.choice_index === 0) runs = [{ ...runs[0], status: 'completed', answers: [{ step_id: 's1', choice_index: 0, note: '', evidence_id: null }], step: null, result_taxon: step.choices[0].taxon }];
    return { data: runs[0] };
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const observation = { id: 'observation-1', evidence: [] };
  render(<MemoryRouter><QueryClientProvider client={client}><ObservationKeyRuns observation={observation} onChanged={async () => {}} /></QueryClientProvider></MemoryRouter>);
  fireEvent.click(await screen.findByRole('button', { name: 'Iniciar' }));
  fireEvent.click(await screen.findByRole('button', { name: /Ainda não consigo observar/ }));
  expect(await screen.findByText(/Aguardando observação/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Sim' }));
  await waitFor(() => expect(post).toHaveBeenCalledWith('/api/observations/observation-1/key-runs/run-1/answers/', expect.objectContaining({ step_id: 's1', choice_index: 0 })));
  expect(await screen.findByText(/confirmação da espécie continua manual/)).toBeInTheDocument();
});
