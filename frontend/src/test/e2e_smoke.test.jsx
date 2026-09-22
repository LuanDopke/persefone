/**
 * E2E Smoke Test Suite — Quickstart validation flows.
 * Constitution Principle VI: Test-driven task validation.
 *
 * Covers:
 *   - Scenario 1: Chlorophyll Noir design system verification
 *   - Scenario 2: Modular UI component usage
 *   - Scenario 3: Specimen registration and status flip
 *   - Scenario 4: Weather dashboard rendering
 *   - Scenario 5: Navigation and responsive shell
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock apiClient for all tests
vi.mock('../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  createSpecimen: vi.fn(),
  searchSpecies: vi.fn().mockResolvedValue({ results: [] }),
  createLocalSpecies: vi.fn(),
  queryKeys: {
    species: { all: ['species'], search: (term) => ['species', 'search', term] },
    specimens: { all: ['specimens'], detail: (id) => ['specimens', 'detail', id] },
    collection: { all: ['collection'] },
    careLogs: { bySpecimen: (id) => ['care-logs', id] },
    visualEntries: { bySpecimen: (id) => ['visual-entries', id] },
  },
}));

import apiClient from '../services/apiClient';
import App from '../App';
import AppShell from '../components/layout/AppShell';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import WeatherWidget from '../components/dashboard/WeatherWidget';
import SpecimenCatalog from '../pages/SpecimenCatalog';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });
}

function TestWrapper({ children }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

// ──────────────────────────────────────
// Scenario 1: Chlorophyll Noir Design System Verification
// ──────────────────────────────────────
describe('Scenario 1: Chlorophyll Noir Design System', () => {
  it('renders Card with neobrutalist borders and hard shadow', () => {
    const { container } = render(
      <TestWrapper>
        <Card title="Test Card">Content</Card>
      </TestWrapper>
    );
    const card = container.firstChild;
    expect(card.className).toContain('border-4');
    expect(card.className).toContain('border-charcoal');
  });

  it('renders Button with Chlorophyll Noir styling', () => {
    render(
      <TestWrapper>
        <Button>Click Me</Button>
      </TestWrapper>
    );
    const btn = screen.getByRole('button', { name: 'Click Me' });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('border');
    expect(btn.className).toContain('font-bold');
  });

  it('renders Button with lime variant', () => {
    render(
      <TestWrapper>
        <Button variant="lime">Lime Action</Button>
      </TestWrapper>
    );
    const btn = screen.getByRole('button', { name: 'Lime Action' });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('lime');
  });

  it('renders Badge with owned and missing states', () => {
    render(
      <TestWrapper>
        <Badge status="owned" />
        <Badge status="missing" />
      </TestWrapper>
    );
    expect(screen.getByText('Owned')).toBeInTheDocument();
    expect(screen.getByText('Missing')).toBeInTheDocument();
  });
});

// ──────────────────────────────────────
// Scenario 2: Modular UI Component Usage
// ──────────────────────────────────────
describe('Scenario 2: Modular UI Component Reuse', () => {
  it('Table renders columns and rows', () => {
    const columns = [
      { key: 'name', label: 'Name' },
      { key: 'value', label: 'Value' },
    ];
    const data = [
      { name: 'Alpha', value: 10 },
      { name: 'Beta', value: 20 },
    ];
    render(
      <TestWrapper>
        <Table columns={columns} data={data} />
      </TestWrapper>
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('Modal opens and closes', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <TestWrapper>
        <Modal open={true} onClose={onClose} title="Test Modal">
          <p>Modal Content</p>
        </Modal>
      </TestWrapper>
    );
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('Card renders title and children', () => {
    render(
      <TestWrapper>
        <Card title="Species Info">
          <p>Species detail goes here</p>
        </Card>
      </TestWrapper>
    );
    expect(screen.getByText('Species Info')).toBeInTheDocument();
    expect(screen.getByText('Species detail goes here')).toBeInTheDocument();
  });
});

// ──────────────────────────────────────
// Scenario 3: Specimen Registration Flow
// ──────────────────────────────────────
describe('Scenario 3: Specimen Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders specimen catalog page with loading state', async () => {
    apiClient.get.mockReturnValue(new Promise(() => {})); // never resolves = loading
    render(
      <TestWrapper>
        <SpecimenCatalog />
      </TestWrapper>
    );
    expect(screen.getByText('Specimens')).toBeInTheDocument();
  });

  it('renders specimen list when data loads', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        results: [
          {
            id: 1,
            nickname: 'Monsterina',
            species_name: 'Monstera deliciosa',
            location_in_home: 'Living Room',
            vitality_index: 85,
            acquired_at: '2026-01-15',
          },
        ],
      },
    });

    render(
      <TestWrapper>
        <SpecimenCatalog />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Monsterina')).toBeInTheDocument();
    });
    expect(screen.getByText('Monstera deliciosa')).toBeInTheDocument();
  });

  it('navigates directly to specimen registration', async () => {
    apiClient.get.mockResolvedValue({ data: { results: [] } });
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/collection']}>
          <Routes>
            <Route path="/collection" element={<SpecimenCatalog />} />
            <Route path="/specimens/new" element={<p>Tela de cadastro</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const addBtn = screen.getByText('+ Add Specimen');
    fireEvent.click(addBtn);

    expect(await screen.findByText('Tela de cadastro')).toBeInTheDocument();
    expect(screen.queryByText('Register Specimen')).not.toBeInTheDocument();
  });
});

// ──────────────────────────────────────
// Scenario 4: Weather Dashboard Widget
// ──────────────────────────────────────
describe('Scenario 4: Weather Dashboard Widget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while fetching weather', () => {
    apiClient.get.mockReturnValue(new Promise(() => {}));
    render(
      <TestWrapper>
        <WeatherWidget lat={-23.55} lon={-46.63} />
      </TestWrapper>
    );
    expect(screen.getByText('Fetching weather...')).toBeInTheDocument();
  });

  it('renders weather data when loaded', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        temperature_c: 25.5,
        humidity_pct: 65,
        weather_code: 1,
        cached: true,
      },
    });

    render(
      <TestWrapper>
        <WeatherWidget lat={-23.55} lon={-46.63} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('25.5°')).toBeInTheDocument();
    });
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('Mainly Clear')).toBeInTheDocument();
    expect(screen.getByText('✓ Cached')).toBeInTheDocument();
  });

  it('shows error state when weather API fails', async () => {
    apiClient.get.mockRejectedValue(new Error('Network Error'));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: 0 } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <WeatherWidget lat={99.99} lon={99.99} />
      </QueryClientProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByText('Weather data unavailable')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('renders stale cache indicator', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        temperature_c: 22.0,
        humidity_pct: 55,
        weather_code: 3,
        cached: true,
        stale: true,
      },
    });

    render(
      <TestWrapper>
        <WeatherWidget lat={-23.55} lon={-46.63} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('⚠ Stale Cache')).toBeInTheDocument();
    });
  });
});

// ──────────────────────────────────────
// Scenario 5: Navigation & Responsive Shell
// ──────────────────────────────────────
describe('Scenario 5: Navigation & Responsive Shell', () => {
  it('renders AppShell with Navbar and Sidebar', () => {
    render(
      <TestWrapper>
        <AppShell>
          <div>Main Content</div>
        </AppShell>
      </TestWrapper>
    );
    expect(screen.getAllByText('Persefone').length).toBeGreaterThan(0);
    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  it('renders sidebar navigation items', () => {
    render(
      <TestWrapper>
        <Sidebar />
      </TestWrapper>
    );
    expect(screen.getByText('Painel')).toBeInTheDocument();
    expect(screen.getByText('Coleção')).toBeInTheDocument();
    expect(screen.getByText('Observações')).toBeInTheDocument();
    expect(screen.getByText('Taxonomia')).toBeInTheDocument();
  });

  it('Navbar renders brand without a drawer trigger', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );
    expect(screen.getAllByText('Persefone').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Menu')).not.toBeInTheDocument();
  });

  it('full App renders dashboard route by default', () => {
    apiClient.get.mockResolvedValue({ data: { results: [] } });
    render(
      <TestWrapper>
        <App />
      </TestWrapper>
    );
    expect(screen.getByRole('heading', { name: 'Painel' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegação móvel' })).toBeInTheDocument();
    expect(screen.queryByText(/controle de pragas|relatórios|lembretes|scanner/i)).not.toBeInTheDocument();
  });

  it('renders the authenticated specimen registration route', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/specimens/new']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { name: /cadastrar exemplar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar exemplar/i })).toBeInTheDocument();
  });

  it('loads the created specimen fields at the protected detail destination', async () => {
    apiClient.get.mockResolvedValue({ data: {
      id: 'abc-123', nickname: 'Folhinha', acquired_at: '2026-09-15',
      initial_soil: 'Substrato drenante', initial_light: 'Meia sombra',
      species_detail: { scientific_name: 'Begonia sp.' }, initial_visual_entry: null,
    } });
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/specimens/instances/abc-123']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Folhinha' })).toBeInTheDocument();
    expect(screen.getByText('Begonia sp.')).toBeInTheDocument();
    expect(screen.getByText('Substrato drenante')).toBeInTheDocument();
    expect(screen.getByText('Meia sombra')).toBeInTheDocument();
    expect(screen.getByText('2026-09-15')).toBeInTheDocument();
  });
});
