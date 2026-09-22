/**
 * Sidebar — Desktop navigation sidebar with Chlorophyll Noir styling.
 * Constitution Principle I: 4px border, hard shadow, sharp corners.
 * Constitution Principle II: Desktop-optimized analytical navigation panel.
 */

import { Link } from 'react-router-dom';
import { navigationItems } from '../../config/navigation';
import { Icon } from '../ui/Icon';

export default function Sidebar({ items = navigationItems, pathname = '/', className = '' }) {
  return (
    <aside
      data-testid="sidebar"
      className={[
        'hidden h-full w-60 border-r-4 border-charcoal bg-charcoal text-offwhite lg:flex',
        'flex flex-col',
        className,
      ].join(' ')}
    >
      <div className="border-b-4 border-offwhite/20 px-5 py-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-lime">Herbário doméstico</p>
        <p className="mt-2 text-2xl font-extrabold uppercase leading-none">Cuide.<br /><span className="text-coral">Observe.</span><br />Registre.</p>
      </div>
      <nav className="flex-1 py-4" aria-label="Navegação principal">
        <ul className="space-y-2 px-3">
          {items.map((item) => {
            const active = item.match(pathname);
            return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={[
                  'analog-hover flex items-center gap-3 px-3 py-3',
                  'text-sm font-bold uppercase tracking-wider',
                  'min-h-12 border-4 transition-colors duration-75',
                  active
                    ? 'border-offwhite bg-lime text-charcoal shadow-[4px_4px_0_#FFFDF5]'
                    : 'border-transparent text-offwhite/70 hover:border-offwhite hover:bg-primary hover:text-offwhite hover:shadow-[4px_4px_0_#FFFDF5]',
                ].join(' ')}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            </li>
          );})}
        </ul>
      </nav>

      {/* System info footer */}
      <div className="border-t-4 border-offwhite/20 px-5 py-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-offwhite/50">
          Arquivo 001 · v0.1.0
        </p>
      </div>
    </aside>
  );
}
