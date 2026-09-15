import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppShell from '../AppShell';

function renderShell(children = <p>Content</p>, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppShell>{children}</AppShell>
    </MemoryRouter>
  );
}

describe('AppShell component', () => {
  it('renders the application name in the navbar', () => {
    renderShell();
    const elements = screen.getAllByText(/persefone/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('renders the same four named destinations in desktop and mobile navigation', () => {
    renderShell();
    expect(screen.getAllByRole('link', { name: /painel/i })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /coleção/i })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /descobrir/i })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: /taxonomia/i })).toHaveLength(2);
  });

  it('renders children content inside the main area', () => {
    renderShell(<p>Test Page Content</p>);
    expect(screen.getByText('Test Page Content')).toBeInTheDocument();
    expect(screen.getAllByRole('main')).toHaveLength(1);
  });

  it('applies neobrutalist border and shadow styling to sidebar', () => {
    const { container } = renderShell();
    const sidebar = container.querySelector('[data-testid="sidebar"]');
    if (sidebar) {
      expect(sidebar.className).toContain('border-r-4');
      expect(sidebar.className).toContain('border-charcoal');
    }
  });

  it('marks creation and instance routes as Collection in both navigations', () => {
    renderShell(undefined, '/specimens/instances/abc');
    const active = screen.getAllByRole('link', { name: /coleção/i });
    expect(active).toHaveLength(2);
    active.forEach((link) => expect(link).toHaveAttribute('aria-current', 'page'));
  });

  it('uses a persistent mobile navigation instead of a drawer trigger', () => {
    renderShell();
    expect(screen.getByRole('navigation', { name: /navegação móvel/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
  });
});
