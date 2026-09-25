import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import IdentificationKeysPage from '../IdentificationKeysPage';
import apiClient from '../../services/apiClient';


it('busca fontes externas e abre a importação como rascunho', async () => {
  vi.spyOn(apiClient, 'get').mockImplementation(async (url) => {
    if (url.endsWith('/discover/')) return { data: { errors: [], results: [{
      source_kind: 'plazi', external_id: 'A'.repeat(32), title: 'Chave publicada para Begonia',
      scope_name: 'Begonia', coverage: 'Nordeste da Índia', project: 'Plazi TreatmentBank',
      reader_url: 'https://treatment.plazi.org/example',
    }] } };
    return { data: { count: 0, next: null, results: [] } };
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<MemoryRouter initialEntries={['/keys?search=Begonia']}><QueryClientProvider client={client}><IdentificationKeysPage /></QueryClientProvider></MemoryRouter>);
  expect(await screen.findByText('Chave publicada para Begonia')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Importar para revisão' }));
  expect(screen.getByRole('region', { name: 'Importar chave' })).toBeInTheDocument();
  expect(screen.getByText(/cria um rascunho privado/i)).toBeInTheDocument();
});
