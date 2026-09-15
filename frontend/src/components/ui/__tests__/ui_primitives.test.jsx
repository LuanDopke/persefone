import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';
import { Card } from '../Card';
import { Table } from '../Table';
import { Badge } from '../Badge';
import { Modal } from '../Modal';
import { Icon } from '../Icon';
import ContentState from '../ContentState';
import ResponsiveGrid from '../ResponsiveGrid';
import MediaFrame from '../MediaFrame';
import SearchField from '../SearchField';
import FormField from '../FormField';
import Input from '../Input';
import PageContainer from '../../layout/PageContainer';
import PageHeader from '../../layout/PageHeader';
import { activeNavigationItem, navigationItems } from '../../../config/navigation';
import Alert from '../Alert';

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

  it('prevents interaction and visual pressing while disabled', () => {
    let clicked = false;
    render(<Button disabled onClick={() => { clicked = true; }}>Indisponível</Button>);
    const button = screen.getByRole('button', { name: 'Indisponível' });
    fireEvent.click(button);
    expect(clicked).toBe(false);
    expect(button).toHaveClass('disabled:active:translate-x-0');
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

  it('exposes an accessible action instead of relying only on row click', () => {
    let selected;
    render(<Table columns={columns} data={data} onRowClick={(row) => { selected = row; }} rowActionLabel={(row) => `Abrir ${row.name}`} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Monstera' }));
    expect(selected.name).toBe('Monstera');
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
    fireEvent.click(screen.getByRole('button', { name: /fechar/i }));
    expect(closed).toBe(true);
  });

  it('closes with Escape and returns focus to the opener', () => {
    let open = false;
    function Harness() {
      return <><button onClick={() => { open = true; }}>Abrir</button><Modal open={open} onClose={() => { open = false; }} title="Diálogo"><button>Dentro</button></Modal></>;
    }
    const { rerender } = render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Abrir' });
    opener.focus(); fireEvent.click(opener); rerender(<Harness />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' }); rerender(<Harness />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});

describe('shared interface contracts', () => {
  it('pairs semantic alert tones with an icon and text', () => {
    render(<Alert tone="warning">Requer atenção</Alert>);
    expect(screen.getByRole('status')).toHaveTextContent('Requer atenção');
    expect(screen.getByRole('status').querySelector('svg')).toBeInTheDocument();
  });

  it('maps child routes to one active navigation section', () => {
    expect(navigationItems).toHaveLength(4);
    expect(activeNavigationItem('/specimens/new')?.id).toBe('collection');
    expect(activeNavigationItem('/specimens/instances/abc')?.id).toBe('collection');
    expect(activeNavigationItem('/specimens/42')?.id).toBe('discover');
  });

  it('renders local icons as decorative or named', () => {
    const { rerender } = render(<Icon name="collection" />);
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    rerender(<Icon name="collection" label="Coleção" />);
    expect(screen.getByRole('img', { name: 'Coleção' })).toBeInTheDocument();
  });

  it('keeps a single page title and optional slots compact', () => {
    render(<PageContainer><PageHeader title="Coleção" primaryAction={<Button>Adicionar</Button>} /></PageContainer>);
    expect(screen.getByRole('heading', { level: 1, name: 'Coleção' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
    expect(document.querySelector('main')).not.toBeInTheDocument();
  });

  it('announces loading, empty and error states', () => {
    const { rerender } = render(<ContentState status="loading" busyLabel="Carregando coleção" />);
    expect(screen.getByRole('status', { name: 'Carregando coleção' })).toBeInTheDocument();
    rerender(<ContentState status="empty" title="Sem dados" />);
    expect(screen.getByRole('status')).toHaveTextContent('Sem dados');
    rerender(<ContentState status="error" title="Falha" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha');
  });

  it('preserves grid child order', () => {
    render(<ResponsiveGrid variant="analytics"><span>Primeiro</span><span>Segundo</span></ResponsiveGrid>);
    expect(screen.getByText('Primeiro').compareDocumentPosition(screen.getByText('Segundo')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows a media fallback after image failure', () => {
    render(<MediaFrame src="/broken.avif" alt="Begônia" />);
    fireEvent.error(screen.getByRole('img', { name: 'Begônia' }));
    expect(screen.getByRole('img', { name: 'Imagem indisponível' })).toBeInTheDocument();
  });

  it('controls and clears search through named actions', () => {
    let value = 'folha';
    const setValue = (next) => { value = next; };
    const { rerender } = render(<SearchField label="Buscar coleção" value={value} onChange={setValue} onClear={() => setValue('')} />);
    fireEvent.click(screen.getByRole('button', { name: 'Limpar buscar coleção' }));
    rerender(<SearchField label="Buscar coleção" value={value} onChange={setValue} onClear={() => setValue('')} />);
    expect(screen.getByRole('searchbox', { name: 'Buscar coleção' })).toHaveValue('');
  });

  it('associates form hints and errors with the input', () => {
    render(<FormField id="nickname" label="Apelido" hint="Opcional" error="Inválido"><Input /></FormField>);
    expect(screen.getByLabelText('Apelido')).toHaveAttribute('aria-describedby', 'nickname-hint nickname-error');
    expect(screen.getByLabelText('Apelido')).toHaveAttribute('aria-invalid', 'true');
  });
});
