/**
 * Navbar — Top navigation bar with Chlorophyll Noir styling.
 * Constitution Principle I: 4px border, hard shadow, lime accent, Lexend font.
 */

import { Button } from '../ui/Button';

export default function Navbar({ displayName, onLogout, actions }) {
  return (
    <header className="ink-speckle sticky top-0 z-40 flex min-h-[4.5rem] items-center justify-between border-b-4 border-charcoal bg-primary px-4 py-3 text-offwhite md:px-6">
      {/* Logo / Brand */}
      <div className="flex min-w-0 items-center gap-3">
        <span className="-rotate-1 border-4 border-charcoal bg-lime px-2 py-1 text-xl font-extrabold uppercase tracking-[-0.08em] text-charcoal shadow-hard-sm sm:text-2xl">
          Persefone
        </span>
        <span className="hidden border-l-2 border-offwhite/60 pl-3 font-mono text-[10px] font-bold uppercase leading-tight tracking-widest text-offwhite/80 md:inline">
          Arquivo<br />botânico pessoal
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-2 md:gap-3">
      {actions}
      {displayName && <><span className="hidden max-w-40 truncate border-2 border-offwhite bg-charcoal px-2 py-1 font-mono text-xs font-bold text-offwhite sm:inline">{displayName}</span><Button variant="ghost" size="sm" onClick={onLogout} className="border-2 border-charcoal bg-coral text-charcoal shadow-hard-sm hover:bg-lime">Sair</Button></>}
      </div>
    </header>
  );
}
