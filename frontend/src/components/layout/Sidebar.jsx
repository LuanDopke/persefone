/**
 * Sidebar — Desktop navigation sidebar with Chlorophyll Noir styling.
 * Constitution Principle I: 4px border, hard shadow, sharp corners.
 * Constitution Principle II: Desktop-optimized analytical navigation panel.
 */

import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '◉' },
  { to: '/collection', label: 'Minha Coleção', legacyLabel: 'Specimens', icon: '❋' },
  { to: '/specimens', label: 'Discover', icon: '⌕' },
  { to: '/taxonomy', label: 'Taxonomy', icon: '⊞' },
];

export default function Sidebar({ className = '' }) {
  return (
    <aside
      data-testid="sidebar"
      className={[
        'w-56 min-h-full border-r-4 border-charcoal bg-offwhite',
        'flex flex-col',
        className,
      ].join(' ')}
    >
      <nav className="flex-1 py-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => [
                  'flex items-center gap-3 px-5 py-3',
                  'text-sm font-bold uppercase tracking-wider',
                  'border-l-4 transition-all duration-75',
                  isActive
                    ? 'border-lime bg-lime/20 text-charcoal'
                    : 'border-transparent text-charcoal/60 hover:border-charcoal hover:bg-gray-100 hover:text-charcoal',
                ].join(' ')}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}{item.legacyLabel && <span className="sr-only">{item.legacyLabel}</span>}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* System info footer */}
      <div className="border-t-4 border-charcoal px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">
          Persefone v0.1.0
        </p>
      </div>
    </aside>
  );
}
