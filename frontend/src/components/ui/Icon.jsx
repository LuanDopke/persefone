const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
  collection: <><path d="M5 20c6-1 10-6 11-15 5 6 4 13-1 16-4 2-8 1-10-1Z" /><path d="M7 19c3-4 6-7 10-9" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  taxonomy: <><path d="M12 3v5M5 21v-5h14v5M5 16v-4h14v4M12 8v4" /><circle cx="12" cy="3" r="1" /></>,
  close: <path d="m5 5 14 14M19 5 5 19" />,
  favorite: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  warning: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v5M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  stable: <path d="m4 12 5 5L20 6" />,
  critical: <><circle cx="12" cy="12" r="9" /><path d="m8 8 8 8M16 8l-8 8" /></>,
  water: <><path d="M12 3S6 10 6 14a6 6 0 0 0 12 0c0-4-6-11-6-11Z" /><path d="M9 15c.3 1.2 1.2 2 2.5 2.3" /></>,
  leaf: <><path d="M20 4C11 4 5 8 5 15c0 2.8 2.2 5 5 5 7 0 10-6 10-16Z" /><path d="M4 20c3-4 7-7 12-9" /></>,
  repot: <><path d="M6 10h12l-1 10H7L6 10Z" /><path d="M4 10h16M9 7c0-2 1-4 3-4s3 2 3 4" /></>,
  pruning: <><path d="m5 5 6 6M19 5l-6 6M11 11 6 19M13 11l5 8" /><circle cx="5" cy="5" r="2" /><circle cx="19" cy="5" r="2" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5M12 7v5l3 2" /></>,
  camera: <><path d="M4 7h4l1.5-2h5L16 7h4v12H4V7Z" /><circle cx="12" cy="13" r="3.5" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" /></>,
};

export function Icon({ name, label, size = 24, className = '' }) {
  const graphic = paths[name];
  if (!graphic) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {graphic}
    </svg>
  );
}
