import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { vi, it, beforeEach, expect } from 'vitest';
import CareActivityForm from '../CareActivityForm';
import apiClient from '../../../services/apiClient';

beforeEach(() => vi.restoreAllMocks());

it('confirma uma atividade e desabilita o envio durante a requisição', async () => {
  let resolve;
  vi.spyOn(apiClient, 'post').mockReturnValue(new Promise((r) => { resolve = r; }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><CareActivityForm specimenId="abc" /></QueryClientProvider>);
  fireEvent.change(screen.getByLabelText('Observação (opcional)'), { target: { value: 'Reguei' } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar no histórico' }));
  expect(await screen.findByRole('button', { name: 'Salvando…' })).toBeDisabled();
  expect(apiClient.post).toHaveBeenCalledWith('/api/care-logs/', expect.objectContaining({
    specimen: 'abc', type: 'watering', notes: 'Reguei', occurred_at: expect.any(String),
  }));
  await act(async () => { resolve({ data: { id: '1' } }); });
});

it('exibe o tipo recebido da ação e não solicita tipo ou data', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><CareActivityForm initialType="repotting" specimenId="abc" /></QueryClientProvider>);
  expect(screen.getByText('Tipo selecionado')).toBeInTheDocument();
  expect(screen.getByText('Replante')).toBeInTheDocument();
  expect(screen.queryByLabelText(/tipo de atividade/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/data e hora/i)).not.toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Observação (opcional)' })).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
