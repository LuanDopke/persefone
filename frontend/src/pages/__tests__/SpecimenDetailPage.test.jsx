import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import SpecimenDetailPage from '../SpecimenDetailPage';
import apiClient from '../../services/apiClient';

const specimen = {
  id: 'abc', nickname: 'Folhinha', acquired_at: '2026-09-01', initial_soil: 'Solo drenante', initial_light: 'Meia sombra',
  vitality_index: 88, soil_moisture: 42, lux_intensity: 65, metrics_updated_at: '2026-09-01T10:00:00Z',
  species_detail: { scientific_name: 'Begonia maculata' },
  latest_care_log: { type: 'observation', notes: 'Última observação da planta', occurred_at: '2026-09-16T14:01:00Z', created_at: '2026-09-16T14:01:00Z' },
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
    expect(screen.getByText('Última observação da planta')).toBeInTheDocument();
    expect(screen.getByText('Solo drenante')).toBeInTheDocument();
  });

  it('renders the specimen monitoring composition', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'Folhinha' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Métricas atuais' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Linha do tempo visual' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ações de cuidado' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Histórico de crescimento e cuidados' })).toBeInTheDocument();
    expect(screen.queryAllByRole('progressbar')).toHaveLength(0);
  });

  it('uses a media fallback when the initial image fails', async () => {
    renderPage();
    const image = await screen.findByRole('img', { name: /foto inicial de folhinha/i });
    fireEvent.error(image);
    expect(screen.getByRole('img', { name: /imagem indisponível/i })).toBeInTheDocument();
  });

  it('sincroniza cor e símbolo do registro com a ação selecionada', async () => {
    renderPage();
    await screen.findByRole('heading', { level: 1, name: 'Folhinha' });
    const fertilizing = screen.getByRole('button', { name: /adubação/i });
    fireEvent.click(fertilizing);
    expect(fertilizing).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Registrar atividade')).toHaveAttribute('data-care-type', 'fertilizing');
    expect(screen.getByLabelText('Registrar atividade')).toHaveClass('bg-green-50');
  });

  it('announces an error and exposes retry', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('network'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível carregar/i);
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('expõe edição e confirmação de arquivamento', async () => {
    apiClient.patch = vi.fn().mockResolvedValue({ data: specimen });
    renderPage();
    await screen.findByRole('heading', { level: 1, name: 'Folhinha' });
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    expect(screen.getByRole('heading', { name: 'Editar exemplar' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /fechar/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Arquivar' }));
    expect(screen.getByRole('heading', { name: 'Arquivar exemplar' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(apiClient.patch).not.toHaveBeenCalled();
  });
});
