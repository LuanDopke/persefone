import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';
import { Card } from '../Card';
import { Table } from '../Table';
import { Badge } from '../Badge';
import { Modal } from '../Modal';

describe('Button component', () => {
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies neobrutalist border and shadow classes', () => {
    render(<Button>Styled</Button>);
    const btn = screen.getByRole('button', { name: /styled/i });
    expect(btn.className).toContain('border-4');
    expect(btn.className).toContain('border-charcoal');
    expect(btn.className).toContain('shadow-hard');
  });

  it('fires onClick handler', () => {
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Press</Button>);
    fireEvent.click(screen.getByRole('button', { name: /press/i }));
    expect(clicked).toBe(true);
  });

  it('renders lime variant with correct accent', () => {
    render(<Button variant="lime">Lime</Button>);
    const btn = screen.getByRole('button', { name: /lime/i });
    expect(btn.className).toContain('bg-lime');
  });
});

describe('Card component', () => {
  it('renders children content', () => {
    render(<Card><p>Card Content</p></Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies neobrutalist container styles', () => {
    const { container } = render(<Card>Test</Card>);
    const card = container.firstChild;
    expect(card.className).toContain('border-4');
    expect(card.className).toContain('border-charcoal');
    expect(card.className).toContain('shadow-hard');
  });

  it('renders with optional title', () => {
    render(<Card title="Species Data">Body</Card>);
    expect(screen.getByText('Species Data')).toBeInTheDocument();
  });
});

describe('Table component', () => {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'family', label: 'Family' },
  ];
  const data = [
    { name: 'Monstera', family: 'Araceae' },
    { name: 'Ficus', family: 'Moraceae' },
  ];

  it('renders table headers', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
  });

  it('renders all data rows', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Ficus')).toBeInTheDocument();
  });

  it('applies neobrutalist border styling to the table', () => {
    const { container } = render(<Table columns={columns} data={data} />);
    const table = container.querySelector('table');
    expect(table.className).toContain('border-4');
  });
});

describe('Badge component', () => {
  it('renders Owned badge with lime accent', () => {
    render(<Badge status="owned" />);
    const badge = screen.getByText(/owned/i);
    expect(badge.className).toContain('bg-lime');
  });

  it('renders Missing badge with grayscale', () => {
    render(<Badge status="missing" />);
    const badge = screen.getByText(/missing/i);
    expect(badge.className).toContain('bg-gray-200');
  });
});

describe('Modal component', () => {
  it('renders when open is true', () => {
    render(<Modal open={true} onClose={() => {}} title="Test Modal"><p>Modal Body</p></Modal>);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Body')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<Modal open={false} onClose={() => {}} title="Hidden"><p>Hidden Body</p></Modal>);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    let closed = false;
    render(<Modal open={true} onClose={() => { closed = true; }} title="Close Test"><p>Body</p></Modal>);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(closed).toBe(true);
  });
});
