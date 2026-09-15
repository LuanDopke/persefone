import { Card } from './Card';

export default function ContentState({ status, title, message, action, busyLabel = 'Carregando conteúdo' }) {
  if (status === 'loading') return <Card><div role="status" aria-label={busyLabel} className="flex items-center gap-3 font-bold"><span aria-hidden="true" className="h-4 w-4 animate-pulse border-4 border-charcoal bg-lime motion-reduce:animate-none" />{busyLabel}</div></Card>;
  return (
    <Card>
      <div role={status === 'error' ? 'alert' : 'status'}>
        <h2 className="text-xl font-extrabold uppercase">{title}</h2>
        {message && <p className="mt-2 text-charcoal/70">{message}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </Card>
  );
}
