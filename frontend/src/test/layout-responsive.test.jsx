import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import AppShell from '../components/layout/AppShell';
import PageContainer from '../components/layout/PageContainer';
import ResponsiveGrid from '../components/ui/ResponsiveGrid';

describe('responsive layout contracts', () => {
  it('confines scrolling and reserves space for mobile navigation', () => {
    const { container } = render(<MemoryRouter><AppShell><PageContainer>Conteúdo</PageContainer></AppShell></MemoryRouter>);
    expect(container.firstChild).toHaveClass('h-dvh', 'overflow-hidden');
    expect(screen.getByRole('main')).toHaveClass('overflow-y-auto', 'overflow-x-hidden', 'pb-20', 'lg:pb-0');
  });

  it('provides touch targets and one shared mobile row', () => {
    render(<MemoryRouter><AppShell>Conteúdo</AppShell></MemoryRouter>);
    const mobile = screen.getByRole('navigation', { name: 'Navegação móvel' });
    expect(mobile).toHaveClass('safe-area-bottom', 'lg:hidden');
    mobile.querySelectorAll('a').forEach((link) => expect(link).toHaveClass('min-h-14', 'min-w-11'));
  });

  it('uses responsive page margins and preserves grid order', () => {
    const { container } = render(<PageContainer><ResponsiveGrid><span>1</span><span>2</span></ResponsiveGrid></PageContainer>);
    expect(container.firstChild).toHaveClass('p-4', 'md:p-8', 'overflow-x-clip');
    expect(container.querySelector('.grid')).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'xl:grid-cols-3');
  });
});
