import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ConfirmAccessPage from '../ConfirmAccessPage';
import { AuthProvider } from '../../context/AuthContext';

vi.mock('../../services/apiClient', () => ({ default: { post: vi.fn().mockRejectedValue(new Error('invalid')) } }));

test('offers a new request when confirmation fails', async () => {
  window.history.pushState({}, '', '/access/confirm?token=bad');
  render(<BrowserRouter><AuthProvider><ConfirmAccessPage /></AuthProvider></BrowserRouter>);
  expect(await screen.findByRole('alert')).toHaveTextContent(/expirou/i);
  expect(screen.getByRole('link', { name: /solicitar novo/i })).toHaveAttribute('href', '/access');
});
