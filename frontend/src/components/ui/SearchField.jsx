import Input from './Input';
import { Icon } from './Icon';

export default function SearchField({ label, value, onChange, onClear, id = 'search-field', placeholder = 'Buscar', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
      <Input id={id} type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-12 pl-12 pr-24" />
      {value && <button type="button" onClick={onClear} className="absolute right-2 top-1/2 min-h-10 -translate-y-1/2 border-2 border-charcoal bg-coral px-3 font-bold shadow-hard-sm active:translate-x-0.5 active:shadow-none focus-visible:ring-4 focus-visible:ring-lime" aria-label={`Limpar ${label.toLocaleLowerCase()}`}>Limpar</button>}
    </div>
  );
}
