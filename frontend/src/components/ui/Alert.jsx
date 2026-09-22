import { Icon } from './Icon';

const TONES = {
  neutral: ['border-charcoal bg-offwhite text-charcoal', 'info'],
  info: ['border-info bg-blue-50 text-charcoal', 'info'],
  stable: ['border-botanical bg-green-50 text-charcoal', 'stable'],
  warning: ['border-amber bg-amber-50 text-charcoal', 'warning'],
  critical: ['border-critical bg-red-50 text-critical', 'critical'],
  disabled: ['border-gray-400 bg-gray-100 text-gray-600', 'info'],
};

export default function Alert({ tone = 'neutral', children, className = '', ...props }) {
  const [classes, icon] = TONES[tone] || TONES.neutral;
  return <div role={tone === 'critical' ? 'alert' : 'status'} className={`flex items-start gap-3 border-4 p-4 font-semibold shadow-hard-sm ${classes} ${className}`} {...props}><Icon name={icon} className="mt-0.5 shrink-0" /><div>{children}</div></div>;
}
