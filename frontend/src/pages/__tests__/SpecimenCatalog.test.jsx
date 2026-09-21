import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import SpecimenCatalog from '../SpecimenCatalog';
import apiClient from '../../services/apiClient';

const item = {
  species_id: 7, specimen_id: '00000000-0000-0000-0000-000000000007', common_name: 'Costela-de-adão', scientific_name: 'Monstera deliciosa', image_url: null,
  specimen_count: 3, is_archived: false, is_favorite: false,
  care: { water: { needs_attention: true, affected_count: 1, total_count: 3 }, nutrients: { needs_attention: false, affected_count: 0, total_count: 3 }, light: { needs_attention: false, affected_count: 0, total_count: 3 } },
  care_reference: { light: 'Luz indireta', water: 'Semanal' },
};

function renderWithProviders(ui = <SpecimenCatalog />) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>);
}

describe('SpecimenCatalog page', () => {
  beforeEach(() => { vi.restoreAllMocks(); vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { count: 1, next: null, results: [item] } }); vi.spyOn(apiClient, 'patch').mockResolvedValue({ data: { ...item, is_favorite: true } }); });
  it('renders Minha Coleção with one species card and accessible fallback image', async () => {
    renderWithProviders(); expect(screen.getByRole('heading', { name: /minha coleção/i })).toBeInTheDocument();
    expect(await screen.findByText('Costela-de-adão')).toBeInTheDocument(); expect(screen.getByText('3 exemplares')).toBeInTheDocument(); expect(screen.getByRole('img', { name: /imagem indisponível/i })).toBeInTheDocument(); expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /abrir detalhes de costela/i })).toHaveAttribute('href', '/specimens/instances/00000000-0000-0000-0000-000000000007');
  });
  it('shows independent attention and neutral care indicators', async () => {
    renderWithProviders(); expect(await screen.findByText('Água: 1 de 3')).toBeInTheDocument(); expect(screen.getByText('Nutrientes: em dia')).toBeInTheDocument(); expect(screen.getByText('Luz: em dia')).toBeInTheDocument();
  });
  it('filters locally and clears an empty result state', async () => {
    renderWithProviders(); await screen.findByText('Costela-de-adão'); fireEvent.change(screen.getByLabelText(/buscar/i), { target: { value: 'ficus' } }); expect(screen.getByText(/nenhuma espécie encontrada/i)).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: /limpar filtros/i })); expect(screen.getByText('Costela-de-adão')).toBeInTheDocument();
  });
  it('updates favorite without selecting the card', async () => {
    renderWithProviders(); fireEvent.click(await screen.findByRole('button', { name: /favoritar costela/i })); await waitFor(() => expect(apiClient.patch).toHaveBeenCalledWith('/api/specimens/collection/7/favorite/', { is_favorite: true }));
  });
  it('offers error retry action', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('network')); renderWithProviders(); expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível carregar/i); expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });
  it('keeps the page header visible while loading', () => {
    apiClient.get.mockReturnValueOnce(new Promise(() => {})); renderWithProviders(); expect(screen.getByRole('heading', { level: 1, name: /minha coleção/i })).toBeInTheDocument(); expect(screen.getByRole('status', { name: /carregando minha coleção/i })).toBeInTheDocument();
  });
  it('replaces a broken collection image with an accessible fallback', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { count: 1, results: [{ ...item, image_url: '/broken.avif' }] } }); renderWithProviders(); const image = await screen.findByRole('img', { name: /imagem de costela/i }); fireEvent.error(image); expect(screen.getByRole('img', { name: /imagem indisponível/i })).toBeInTheDocument();
  });
});
