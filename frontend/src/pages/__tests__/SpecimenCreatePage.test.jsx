import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import SpecimenCreatePage from '../SpecimenCreatePage';
import { createLocalSpecies, createSpecimen, searchSpecies } from '../../services/apiClient';

vi.mock('../../services/apiClient', () => ({
  default: {},
  createSpecimen: vi.fn(),
  searchSpecies: vi.fn(),
  createLocalSpecies: vi.fn(),
  queryKeys: {
    species: { all: ['species'], search: (term) => ['species', 'search', term] },
    specimens: { all: ['specimens'], detail: (id) => ['specimens', 'detail', id] },
    collection: { all: ['collection'] },
  },
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/specimens/new']}>
        <Routes>
          <Route path="/specimens/new" element={<SpecimenCreatePage />} />
          <Route path="/specimens/instances/:specimenId" element={<p>Detalhe criado</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function selectSpecies() {
  fireEvent.change(screen.getByLabelText(/buscar espécie ou gênero/i), { target: { value: 'Monstera' } });
  fireEvent.click(await screen.findByRole('option', { name: /selecionar monstera deliciosa/i }));
}

describe('SpecimenCreatePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchSpecies.mockResolvedValue({ results: [{ id: 7, scientific_name: 'Monstera deliciosa', common_name: 'Costela-de-adão', genus: 'Monstera' }] });
  });

  it('starts with the local date and exact light choices', () => {
    renderPage();
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(screen.getByLabelText(/data de aquisição/i)).toHaveValue(localDate);
    expect(screen.getByLabelText(/data de aquisição/i)).toHaveAttribute('max', localDate);
    expect(screen.queryByRole('combobox', { name: /luminosidade inicial/i })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Sombra' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Meia sombra' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Sol pleno' })).toBeInTheDocument();
  });

  it('searches and keeps a single selected taxonomy', async () => {
    renderPage();
    await selectSpecies();
    expect(searchSpecies).toHaveBeenCalledWith('Monstera');
    expect(screen.getByText(/selecionada: monstera deliciosa/i)).toBeInTheDocument();
  });

  it('shows contextual required errors without submitting', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /cadastrar exemplar/i }));
    expect(await screen.findByText(/selecione uma espécie ou gênero/i)).toBeInTheDocument();
    expect(screen.getByText(/informe a condição inicial do solo/i)).toBeInTheDocument();
    expect(createSpecimen).not.toHaveBeenCalled();
  });

  it('blocks duplicate submission and navigates to detail', async () => {
    let resolveCreate;
    createSpecimen.mockReturnValue(new Promise((resolve) => { resolveCreate = resolve; }));
    renderPage();
    await selectSpecies();
    fireEvent.change(screen.getByLabelText(/solo inicial/i), { target: { value: 'Substrato drenante' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Meia sombra' }));
    const submit = screen.getByRole('button', { name: /cadastrar exemplar/i });
    fireEvent.click(submit);
    fireEvent.click(submit);
    await waitFor(() => expect(createSpecimen).toHaveBeenCalledTimes(1));
    expect(submit).toBeDisabled();
    resolveCreate({ id: 'abc-123' });
    expect(await screen.findByText('Detalhe criado')).toBeInTheDocument();
  });

  it('creates and immediately selects a missing taxonomy', async () => {
    searchSpecies.mockResolvedValue({ results: [] });
    createLocalSpecies.mockResolvedValue({ id: 9, scientific_name: 'Begonia sp.', genus: 'Begonia', created: true });
    renderPage();
    fireEvent.change(screen.getByLabelText(/buscar espécie ou gênero/i), { target: { value: 'Begonia sp.' } });
    fireEvent.click(await screen.findByRole('button', { name: /cadastrar begonia sp\./i }));
    expect(await screen.findByText(/selecionada: begonia sp\./i)).toBeInTheDocument();
  });

  it('keeps the entered taxonomy name when local creation fails', async () => {
    searchSpecies.mockResolvedValue({ results: [] });
    createLocalSpecies.mockRejectedValue({ response: { data: { scientific_name: ['Nome inválido.'] } } });
    renderPage();
    const input = screen.getByLabelText(/buscar espécie ou gênero/i);
    fireEvent.change(input, { target: { value: 'Begonia sp.' } });
    fireEvent.click(await screen.findByRole('button', { name: /cadastrar begonia sp\./i }));
    expect(await screen.findByText('Nome inválido.')).toBeInTheDocument();
    expect(input).toHaveValue('Begonia sp.');
  });

  it('submits an optional nickname and one valid photo', async () => {
    createSpecimen.mockResolvedValue({ id: 'with-photo' });
    renderPage();
    await selectSpecies();
    fireEvent.change(screen.getByLabelText(/solo inicial/i), { target: { value: 'Solo úmido' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Sombra' }));
    fireEvent.change(screen.getByLabelText(/apelido/i), { target: { value: 'Folhinha' } });
    const photo = new File(['image'], 'folha.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/foto inicial/i), { target: { files: [photo] } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar exemplar/i }));

    await waitFor(() => expect(createSpecimen).toHaveBeenCalledTimes(1));
    const payload = createSpecimen.mock.calls[0][0];
    expect(payload.get('nickname')).toBe('Folhinha');
    expect(payload.get('initial_photo')).toBe(photo);
  });

  it('shows a contextual photo error and preserves other fields', async () => {
    renderPage();
    const soil = screen.getByLabelText(/solo inicial/i);
    fireEvent.change(soil, { target: { value: 'Solo preservado' } });
    const invalid = new File(['text'], 'notas.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText(/foto inicial/i), { target: { files: [invalid] } });

    expect(await screen.findByText(/selecione um arquivo de imagem/i)).toBeInTheDocument();
    expect(soil).toHaveValue('Solo preservado');
  });

  it('rejects only photos above the 10 MB limit', async () => {
    renderPage();
    const oversized = new File([new Uint8Array((10 * 1024 * 1024) + 1)], 'grande.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText(/foto inicial/i), { target: { files: [oversized] } });

    expect(await screen.findByText(/a foto deve ter no máximo 10 mb/i)).toBeInTheDocument();
  });
});
