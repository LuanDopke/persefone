import { Icon } from '../ui/Icon';

const LABELS = { water: 'Água', nutrients: 'Nutrientes', light: 'Luz' };

export default function CareIndicator({ name, value }) {
  const label = LABELS[name] || name;
  const attention = Boolean(value?.needs_attention);
  const text = attention ? `${label}: ${value.affected_count} de ${value.total_count}` : `${label}: em dia`;
  return <span className={`inline-flex items-center gap-1 border-2 border-charcoal px-2 py-1 text-xs font-bold ${attention ? 'bg-amber text-charcoal' : 'bg-botanical text-white'}`}><Icon name={attention ? 'warning' : 'stable'} size={14} /><span>{text}</span></span>;
}
