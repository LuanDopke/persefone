import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

function Probe() { const { isAuthenticated, displayName } = useAuth(); return <span>{isAuthenticated ? displayName : 'anonymous'}</span>; }

beforeEach(() => localStorage.clear());

test('restores a valid token on the first render', () => {
  const expiresTomorrow = Math.floor(Date.now() / 1000) + 86400;
  localStorage.setItem('access_token', 'a.' + btoa(JSON.stringify({ exp: expiresTomorrow })) + '.c');
  localStorage.setItem('access_email', 'ana.silva@example.com');

  render(<AuthProvider><Probe /></AuthProvider>);

  expect(screen.getByText('ana.silva')).toBeInTheDocument();
});

test('does not restore an expired token', () => {
  localStorage.setItem('access_token', 'a.' + btoa(JSON.stringify({ exp: 1 })) + '.c');
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(screen.getByText('anonymous')).toBeInTheDocument();
});
