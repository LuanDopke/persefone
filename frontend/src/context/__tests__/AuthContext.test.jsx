import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

function Probe() { const { isAuthenticated, displayName } = useAuth(); return <span>{isAuthenticated ? displayName : 'anonymous'}</span>; }
test('does not restore an expired token', () => {
  localStorage.setItem('access_token', 'a.' + btoa(JSON.stringify({ exp: 1 })) + '.c');
  render(<AuthProvider><Probe /></AuthProvider>);
  expect(screen.getByText('anonymous')).toBeInTheDocument();
});
