/**
 * Navbar — Top navigation bar with Chlorophyll Noir styling.
 * Constitution Principle I: 4px border, hard shadow, lime accent, Lexend font.
 */

import { Button } from '../ui/Button';

export default function Navbar({ displayName, onLogout, actions }) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b-4 border-charcoal bg-charcoal px-5 py-3">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-extrabold uppercase tracking-tight text-lime">
          Persefone
        </span>
        <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest text-offwhite/60">
          Botanical Archival System
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-3">
      {actions}
      {displayName && <><span className="hidden truncate font-bold text-offwhite sm:inline">{displayName}</span><Button variant="ghost" size="sm" onClick={onLogout} className="border-2 border-lime text-lime hover:bg-lime hover:text-charcoal">Sair</Button></>}
      </div>
    </header>
  );
}
