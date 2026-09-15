import { Link } from 'react-router-dom';
import { navigationItems } from '../../config/navigation';
import { Icon } from '../ui/Icon';

export default function MobileNavigation({ items = navigationItems, pathname = '/' }) {
  const visibleItems = [...items].sort((a, b) => a.mobilePriority - b.mobilePriority).slice(0, 5);
  return (
    <nav aria-label="Navegação móvel" className="safe-area-bottom fixed inset-x-0 bottom-0 z-40 border-t-4 border-charcoal bg-offwhite lg:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}>
        {visibleItems.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.id} className="min-w-0">
              <Link to={item.to} aria-current={active ? 'page' : undefined} className={`flex min-h-14 min-w-11 flex-col items-center justify-center gap-1 border-r-2 border-charcoal px-1 text-center text-[11px] font-bold uppercase last:border-r-0 ${active ? 'bg-lime text-charcoal' : 'bg-offwhite text-charcoal/70'}`}>
                <Icon name={item.icon} size={20} />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
