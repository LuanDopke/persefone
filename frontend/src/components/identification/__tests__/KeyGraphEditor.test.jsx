import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import KeyGraphEditor from '../KeyGraphEditor';
import apiClient from '../../../services/apiClient';

function Editor() {
  const [graph, setGraph] = useState({ start: '', steps: [] });
  return <><KeyGraphEditor graph={graph} onChange={setGraph} scopeRank="family" scopeKey={100} /><output data-testid="graph">{JSON.stringify(graph)}</output></>;
}

it('cria passo com duas alternativas e escolhe gênero do grupo', async () => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { results: [
    { key: 200, scientific_name: 'Begonia', family_key: 100 },
    { key: 201, scientific_name: 'Outro gênero', family_key: 999 },
  ] } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><Editor /></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar passo' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Característica observada' }), { target: { value: 'Disposição das folhas' } });
  fireEvent.change(screen.getAllByRole('textbox', { name: 'Descrição' })[0], { target: { value: 'Alternas' } });
  fireEvent.click(screen.getAllByRole('button', { name: 'Resultado' })[0]);
  fireEvent.change(screen.getByRole('searchbox', { name: 'Táxon da alternativa 1' }), { target: { value: 'Begonia' } });
  fireEvent.click(await screen.findByRole('button', { name: 'Begonia' }));
  await waitFor(() => expect(JSON.parse(screen.getByTestId('graph').textContent).steps[0].choices[0].taxon).toEqual({ key: 200, rank: 'genus', name: 'Begonia' }));
  expect(screen.queryByRole('button', { name: 'Outro gênero' })).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Resultado' })[0]).toHaveAttribute('aria-pressed', 'true');
});
