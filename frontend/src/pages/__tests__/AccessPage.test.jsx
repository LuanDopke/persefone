import { fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import apiClient from '../../services/apiClient';
import AccessPage from '../AccessPage';

vi.mock('../../services/apiClient', () => ({ default: { post: vi.fn() } }));

test('rejects invalid email and has no password field', async () => {
  render(<BrowserRouter><AccessPage /></BrowserRouter>);
  expect(screen.queryByLabelText(/senha/i)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /solicitar acesso/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/e-mail válido/i);
});

test('shows neutral confirmation after request', async () => {
  apiClient.post.mockResolvedValueOnce({ data: { detail: 'Link solicitado.' } });
  render(<BrowserRouter><AccessPage /></BrowserRouter>);
  fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'ana@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: /solicitar acesso/i }));
  expect(await screen.findByRole('status')).toHaveTextContent('Link solicitado.');
});
