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
  tree: <><path d="M12 21v-6M8 21h8M12 3c-3 0-5 2-5 5-2 0-3 2-3 4 0 2 2 4 4 4h8c2 0 4-2 4-4 0-2-1-4-3-4 0-3-2-5-5-5Z" /></>,
  shrub: <><path d="M4 20h16M8 20v-5M16 20v-5M4 15c-2-1-2-5 1-6 0-3 3-4 5-2 2-2 5-1 5 2 3 1 3 5 1 6H4Z" /><path d="M13 15c-1-2 0-4 2-5 2-2 5-1 5 2 2 1 2 3 0 4h-4" /></>,
  herb: <><path d="M12 21V9M12 15c-5 0-7-3-7-6 4 0 7 2 7 6ZM12 12c0-4 2-7 6-8 1 4-1 7-6 8ZM5 21h14" /></>,
  vine: <><path d="M18 3v18M12 21c-5-3-5-7 0-10 4-2 4-5 0-8M12 11c-4 0-6-2-6-5 3 0 5 1 6 5ZM12 17c4 0 6-2 6-5-3 0-5 1-6 5Z" /></>,
  epiphyte: <><path d="M3 18h18M7 18v-5M17 18v-5M12 18V9M12 13c-4 0-6-2-6-5 3 0 5 1 6 5ZM12 11c0-4 2-6 5-7 0 3-1 5-5 7Z" /></>,
  aquaticPlant: <><path d="M12 16V7M12 11C9 11 7 9 7 6c3 0 5 2 5 5ZM12 10c0-3 2-5 5-6 0 3-2 5-5 6ZM2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0 2 2 2 2" /></>,
  ground: <><path d="M2 16h20M12 16V7M12 11C9 11 7 9 7 6c3 0 5 2 5 5ZM12 10c0-3 2-5 5-6 0 3-2 5-5 6ZM9 20l3-4 3 4" /></>,
  rocky: <><path d="M2 20h20l-3-7-4 2-3-5-4 3-3-1-3 8ZM12 10V4M12 7c-2 0-3-1-3-3 2 0 3 1 3 3ZM12 7c0-2 1-3 3-3 0 2-1 3-3 3Z" /></>,
  forest: <><path d="M7 21v-6M17 21v-6M7 3 2 15h10L7 3ZM17 5l-5 10h10L17 5ZM3 21h18" /></>,
  grassland: <><path d="M3 20h18M6 20l-3-8M6 20l3-10M12 20l-2-12M12 20l3-9M18 20l-2-10M18 20l3-7" /></>,
  wetland: <><path d="M5 15V6M5 10 3 7M5 12l2-3M18 15V4M18 9l-2-3M18 12l3-4M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0 2 2 2 2" /></>,
  landscape: <><path d="M2 20h20M3 16l5-6 4 4 4-7 5 9M17 3h.01" /><circle cx="17" cy="4" r="2" /></>,
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
