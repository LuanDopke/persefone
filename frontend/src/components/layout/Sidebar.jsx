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
        'hidden h-full w-56 border-r-4 border-charcoal bg-offwhite lg:flex',
        'flex flex-col',
        className,
      ].join(' ')}
    >
      <nav className="flex-1 py-4" aria-label="Navegação principal">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = item.match(pathname);
            return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex items-center gap-3 px-5 py-3',
                  'text-sm font-bold uppercase tracking-wider',
                  'min-h-12 border-y-4 border-r-4 border-transparent transition-colors duration-75',
                  active
                    ? 'border-charcoal bg-lime text-charcoal'
                    : 'border-transparent text-charcoal/60 hover:border-charcoal hover:bg-gray-100 hover:text-charcoal',
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
      <div className="border-t-4 border-charcoal px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">
          Persefone v0.1.0
        </p>
      </div>
    </aside>
  );
}
