import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import TaxonomyTree from '../TaxonomyTree';

const observations = [{
  id: 'observation-1',
  image: '/begonia.avif',
  species_detail: { id: 1, scientific_name: 'Begonia maculata', common_name: '', order: 'Cucurbitales', family: 'Begoniaceae', genus: 'Begonia' },
  related_species: [{ id: 2, scientific_name: 'Begonia rex', common_name: '', family: 'Begoniaceae', genus: 'Begonia' }],
}];

it('exibe a hierarquia e permite recolher os ramos', () => {
  render(<TaxonomyTree observations={observations} />);
  expect(screen.getByText('Cucurbitales')).toBeInTheDocument();
  expect(screen.getByText('Begoniaceae')).toBeInTheDocument();
  expect(screen.getByText('Begonia maculata')).toBeInTheDocument();
  expect(screen.getByText('Begonia rex')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /cucurbitales/i }));
  expect(screen.queryByText('Begoniaceae')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /cucurbitales/i })).toHaveAttribute('aria-expanded', 'false');
});
