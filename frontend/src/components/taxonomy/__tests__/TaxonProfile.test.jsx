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
  expect(screen.getByText('Subarbusto')).toBeInTheDocument();
  expect(screen.getByText('Terrícola')).toBeInTheDocument();
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
  expect(names).not.toContain('Bégonia');
  expect(screen.getByText('VU').closest('[aria-current="true"]')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /ampliar fotografia/i })).toHaveLength(5);

  fireEvent.click(screen.getByRole('button', { name: /carregar mais imagens/i }));
  expect(screen.getAllByRole('button', { name: /ampliar fotografia/i })).toHaveLength(6);
});

it('mostra idioma, fonte e licença da descrição alternativa', () => {
  render(<TaxonProfile query={{
    ...query,
    data: {
      ...query.data,
      descriptions: [{
        text: 'Begonia maculata is a flowering plant with spotted leaves native to Brazil.',
        source: 'Wikipédia',
        source_url: 'https://en.wikipedia.org/wiki/Begonia_maculata',
        language: 'en',
        license: 'CC BY-SA 4.0',
        license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
      }],
    },
  }} />);

  expect(screen.getByText(/English ·/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Fonte: Wikipédia/ })).toHaveAttribute('href', 'https://en.wikipedia.org/wiki/Begonia_maculata');
  expect(screen.getByRole('link', { name: 'CC BY-SA 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0/');
});

it('oculta características e perfil biológico acima de espécie', () => {
  render(<TaxonProfile query={{
    ...query,
    data: { ...query.data, taxon: { ...query.data.taxon, rank: 'genus', scientific_name: 'Begonia' } },
  }} />);

  expect(screen.queryByRole('heading', { name: 'Características disponíveis' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Perfil biológico' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Classificação taxonômica' })).toBeInTheDocument();
});

it('separa valores do perfil biológico e omite categorias sem dados', () => {
  render(<TaxonProfile query={{
    ...query,
    data: {
      ...query.data,
      profiles: [{
        values: {
          lifeForm: 'Subarbusto',
          vegetationType: 'Floresta Ombrófila, Vegetação Sobre Afloramentos Rochosos',
          hybrid: false,
        },
        value_items: {
          lifeForm: ['Subarbusto'],
          vegetationType: ['Floresta Ombrófila', 'Vegetação Sobre Afloramentos Rochosos'],
        },
        source: 'Flora e Funga do Brasil',
        source_url: 'https://www.gbif.org/species/114698094',
      }],
    },
  }} />);

  expect(screen.getByRole('heading', { name: 'Forma de vida' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Habitat' })).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Vegetação' })).toBeInTheDocument();
  expect(screen.getByText('Floresta Ombrófila')).toBeInTheDocument();
  expect(screen.getByText('Vegetação Sobre Afloramentos Rochosos')).toBeInTheDocument();
  expect(screen.getByText('Subarbusto').closest('li').querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.getByText('Híbrido:').parentElement).toHaveTextContent('Não');
  expect(screen.getByRole('link', { name: /Fonte: Flora e Funga do Brasil/ })).toHaveAttribute('href', 'https://www.gbif.org/species/114698094');
});

it('mantém termos em inglês e desconhecidos legíveis com pictogramas decorativos', () => {
  render(<TaxonProfile query={{
    ...query,
    data: {
      ...query.data,
      profiles: [{
        values: { lifeForm: 'Tree, Unknown growth form', habitat: 'Forest' },
        value_items: { lifeForm: ['Tree', 'Unknown growth form'], habitat: ['Forest'] },
        source: 'Checklist',
      }],
    },
  }} />);

  for (const value of ['Tree', 'Unknown growth form', 'Forest']) {
    const row = screen.getByText(value).closest('li');
    expect(row.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  }
  expect(screen.queryByRole('heading', { name: 'Vegetação' })).not.toBeInTheDocument();
});
