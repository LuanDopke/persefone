export default function PageHeader({ title, description, eyebrow, search, primaryAction, secondaryActions, className = '' }) {
  return (
    <header className={`grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="font-mono text-xs font-bold uppercase tracking-widest text-charcoal/60">{eyebrow}</p>}
        <h1 className="break-words text-3xl font-extrabold uppercase tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-charcoal/70">{description}</p>}
      </div>
      {(primaryAction || secondaryActions) && <div className="flex flex-wrap items-center gap-3 lg:justify-end">{secondaryActions}{primaryAction}</div>}
      {search && <div className="min-w-0 lg:col-span-2">{search}</div>}
    </header>
  );
}
