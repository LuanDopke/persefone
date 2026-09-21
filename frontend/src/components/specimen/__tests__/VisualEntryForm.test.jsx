import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi, it, beforeEach, expect } from 'vitest';
import VisualEntryForm from '../VisualEntryForm';
import apiClient from '../../../services/apiClient';

beforeEach(() => vi.restoreAllMocks());

it('valida imagem e preserva o formulário enquanto salva', () => {
  vi.spyOn(apiClient, 'post').mockReturnValue(new Promise(() => {}));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><VisualEntryForm open onClose={() => {}} specimenId="abc" /></QueryClientProvider>);
  fireEvent.submit(screen.getByRole('button', { name: 'Registrar foto' }).closest('form'));
  expect(screen.getByRole('alert')).toHaveTextContent(/selecione uma imagem/i);
});
