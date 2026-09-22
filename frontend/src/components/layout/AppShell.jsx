/**
 * AppShell — Main responsive application layout.
 * Constitution Principle I: Neobrutalist Chlorophyll Noir aesthetic.
 * Constitution Principle II: Desktop sidebar + mobile responsive drawer.
 */

import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import { useAuth } from '../../context/AuthContext';

export default function AppShell({ children }) {
  const { displayName, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="paper-grid grid h-dvh min-w-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-offwhite lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="lg:col-start-2"><Navbar displayName={displayName} onLogout={logout} /></div>
      <div className="hidden min-h-0 lg:row-span-2 lg:row-start-1 lg:block"><Sidebar pathname={pathname} /></div>
      <div className="min-h-0 min-w-0 lg:col-start-2">
        <main className="h-full min-w-0 overflow-y-auto overflow-x-hidden pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNavigation pathname={pathname} />
    </div>
  );
}
