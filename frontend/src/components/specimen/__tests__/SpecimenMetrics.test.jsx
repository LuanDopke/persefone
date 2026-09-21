import { render, screen } from '@testing-library/react';
import SpecimenMetrics from '../SpecimenMetrics';

it('mantém o quadro de métricas como placeholder para dados futuros da taxonomia', () => {
  render(<SpecimenMetrics />);
  expect(screen.getByRole('heading', { name: 'Métricas atuais' })).toBeInTheDocument();
  expect(screen.getByText('Placeholder de taxonomia')).toBeInTheDocument();
  expect(screen.getByText('Métricas em breve')).toBeInTheDocument();
  expect(screen.queryByText('Vitalidade')).not.toBeInTheDocument();
});
