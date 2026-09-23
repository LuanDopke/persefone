import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import TaxonProfile from '../TaxonProfile';

const query = {
  isLoading: false,
  isError: false,
  data: {
    taxon: { key: 7303475, scientific_name: 'Begonia maculata', authorship: 'Raddi', rank: 'species', kingdom: 'Plantae', order: 'Cucurbitales', family: 'Begoniaceae', genus: 'Begonia' },
    descriptions: [{ text: 'Erva terrestre com folhas assimétricas e manchas claras.', source: 'Flora' }],
    profiles: [{ values: { lifeForm: 'Subarbusto', habitat: 'Terrícola' }, source: 'Flora e Funga do Brasil' }],
    vernacular_names: [{ name: 'Begônia', language: 'por' }],
    distributions: [{ locality: 'Brazil Southeast', establishment_means: '' }],
    occurrence_count: 415,
    image_count: 1,
    images: [{ url: 'https://images.example/begonia.jpg', creator: 'Ana', publisher: 'iNaturalist', license: 'CC BY 4.0', references: 'https://example.test/occurrence' }],
    literature: [{ id: 'paper-1', title: 'Morphoanatomical evidence in Begonia', authors: ['A. Silva'], year: 2024, source: 'Phytotaxa', abstract: 'Estudo taxonômico.', url: 'https://doi.org/example', peer_review: true, open_access: false }],
    warnings: [],
  },
};

it('exibe metadados, fotografia ampliável e literatura da espécie', () => {
  render(<TaxonProfile query={query} />);

  expect(screen.getByText('Erva terrestre com folhas assimétricas e manchas claras.')).toBeInTheDocument();
  expect(screen.getByText('415')).toBeInTheDocument();
  expect(screen.getByText('ocorrências no GBIF')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Morphoanatomical evidence in Begonia' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /ampliar fotografia 1/i }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /fotografia ampliada de begonia maculata/i })).toBeInTheDocument();
});

it('prioriza nomes por idioma, limita fotos e destaca o nível IUCN', () => {
  const images = Array.from({ length: 6 }, (_, index) => ({
    url: `https://images.example/begonia-${index}.jpg`,
    creator: `Autoria ${index}`,
  }));
  const richQuery = {
    ...query,
    data: {
      ...query.data,
      vernacular_names: [
        { name: 'Spotted begonia', language: 'eng' },
        { name: 'Bégonia', language: 'fra' },
        { name: 'Begônia pintada', language: 'por' },
      ],
      conservation: { category: 'VULNERABLE', code: 'VU' },
      image_count: 6,
      images,
    },
  };

  render(<TaxonProfile query={richQuery} />);

  const names = screen.getByRole('heading', { name: 'Nomes populares' }).parentElement.textContent;
  expect(names.indexOf('Begônia pintada')).toBeLessThan(names.indexOf('Spotted begonia'));
  expect(names.indexOf('Spotted begonia')).toBeLessThan(names.indexOf('Bégonia'));
  expect(screen.getByText('VU').closest('[aria-current="true"]')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /ampliar fotografia/i })).toHaveLength(5);

  fireEvent.click(screen.getByRole('button', { name: /carregar mais imagens/i }));
  expect(screen.getAllByRole('button', { name: /ampliar fotografia/i })).toHaveLength(6);
});
