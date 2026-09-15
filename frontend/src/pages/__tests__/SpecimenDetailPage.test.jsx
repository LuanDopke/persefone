import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import SpecimenDetailPage from '../SpecimenDetailPage';
import apiClient from '../../services/apiClient';

const specimen = {
  id: 'abc', nickname: 'Folhinha', acquired_at: '2026-09-01', initial_soil: 'Solo drenante', initial_light: 'Meia sombra',
  species_detail: { scientific_name: 'Begonia maculata' },
  initial_visual_entry: { image: '/media/initial.avif', captured_at: '2026-09-01T10:00:00Z' },
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/specimens/instances/abc']}><Routes><Route path="/specimens/instances/:specimenId" element={<SpecimenDetailPage />} /></Routes></MemoryRouter></QueryClientProvider>);
}

describe('SpecimenDetailPage', () => {
  beforeEach(() => { vi.restoreAllMocks(); vi.spyOn(apiClient, 'get').mockResolvedValue({ data: specimen }); });

  it('keeps the page hierarchy while loading and renders specimen data', async () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /detalhe do exemplar/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Folhinha' })).toBeInTheDocument();
    expect(screen.getByText('Begonia maculata')).toBeInTheDocument();
    expect(screen.getByText('Solo drenante')).toBeInTheDocument();
  });

  it('uses a media fallback when the initial image fails', async () => {
    renderPage();
    const image = await screen.findByRole('img', { name: /foto inicial de folhinha/i });
    fireEvent.error(image);
    expect(screen.getByRole('img', { name: /imagem indisponível/i })).toBeInTheDocument();
  });

  it('announces an error and exposes retry', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('network'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível carregar/i);
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });
});
