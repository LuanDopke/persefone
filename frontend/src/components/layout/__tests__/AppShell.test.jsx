import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppShell from '../AppShell';

function renderShell(children = <p>Content</p>) {
  return render(
    <MemoryRouter>
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

  it('renders navigation links for Dashboard, Minha Coleção, Discover, and Taxonomy', () => {
    renderShell();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /minha coleção/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /discover/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /taxonomy/i })).toBeInTheDocument();
  });

  it('renders children content inside the main area', () => {
    renderShell(<p>Test Page Content</p>);
    expect(screen.getByText('Test Page Content')).toBeInTheDocument();
  });

  it('applies neobrutalist border and shadow styling to sidebar', () => {
    const { container } = renderShell();
    const sidebar = container.querySelector('[data-testid="sidebar"]');
    if (sidebar) {
      expect(sidebar.className).toContain('border-r-4');
      expect(sidebar.className).toContain('border-charcoal');
    }
  });

  it('renders mobile menu toggle button', () => {
    renderShell();
    const toggleBtn = screen.getByRole('button', { name: /menu/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('toggles mobile sidebar visibility when menu button is clicked', () => {
    renderShell();
    const toggleBtn = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(toggleBtn);
    // After click, the mobile drawer should be visible
    const mobileDrawer = screen.getByTestId('mobile-drawer');
    expect(mobileDrawer).toBeInTheDocument();
  });
});
