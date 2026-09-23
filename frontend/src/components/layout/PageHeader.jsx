export default function PageHeader({ title, description, eyebrow, search, primaryAction, secondaryActions, titleClassName = '', className = '' }) {
  return (
    <header className={`relative grid min-w-0 gap-4 border-b-4 border-charcoal pb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end ${className}`}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-charcoal/70">{eyebrow}</p>}
        <h1 className={`break-words text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.055em] [text-shadow:3px_3px_0_#BDFF00] md:text-5xl ${titleClassName}`}>{title}</h1>
        {description && <p className="mt-3 max-w-3xl border-l-4 border-coral pl-3 font-medium text-charcoal/75">{description}</p>}
      </div>
      {(primaryAction || secondaryActions) && <div className="flex flex-wrap items-center gap-3 lg:justify-end">{secondaryActions}{primaryAction}</div>}
      {search && <div className="min-w-0 lg:col-span-2">{search}</div>}
    </header>
  );
}
