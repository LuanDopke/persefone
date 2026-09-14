/**
 * AppShell — Main responsive application layout.
 * Constitution Principle I: Neobrutalist Chlorophyll Noir aesthetic.
 * Constitution Principle II: Desktop sidebar + mobile responsive drawer.
 */

import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { displayName, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-offwhite">
      {/* Top Navbar */}
      <Navbar onMenuToggle={() => setMobileOpen((prev) => !prev)} displayName={displayName} onLogout={logout} />

      <div className="flex flex-1">
        {/* Desktop Sidebar — hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Drawer Overlay */}
        {mobileOpen && (
          <div data-testid="mobile-drawer" className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-charcoal/50"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer panel */}
            <div className="relative z-10 h-full w-64 border-r-4 border-charcoal bg-offwhite shadow-hard-lg">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
