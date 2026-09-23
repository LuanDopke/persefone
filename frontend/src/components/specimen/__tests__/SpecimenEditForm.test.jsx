import { fireEvent, render, screen } from '@testing-library/react';
import { it, vi, expect } from 'vitest';
import SpecimenEditForm from '../SpecimenEditForm';

it('renderiza campos permitidos sem seletor de espécie', () => {
  render(<SpecimenEditForm open onClose={() => {}} onSave={vi.fn()} specimen={{ nickname: 'Folha', location_in_home: 'Sala', acquired_at: '2026-01-01', initial_soil: 'Solo', initial_light: 'Sombra', vitality_index: 90, soil_moisture: 50, lux_intensity: 1000, updated_at: '2026-09-16T10:00:00Z' }} />);
  expect(screen.getByLabelText(/^Nome/)).toHaveValue('Folha');
  expect(screen.queryByLabelText(/espécie/i)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: 'Nova folha' } });
  expect(screen.getByLabelText(/^Nome/)).toHaveValue('Nova folha');
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: 'Sol pleno' }));
  expect(screen.getByRole('radio', { name: 'Sol pleno' })).toBeChecked();
});
