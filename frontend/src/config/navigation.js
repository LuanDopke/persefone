export const navigationItems = [
  { id: 'dashboard', to: '/', label: 'Painel', icon: 'dashboard', mobilePriority: 1, match: (path) => path === '/' },
  { id: 'collection', to: '/collection', label: 'Coleção', icon: 'collection', mobilePriority: 2, match: (path) => path === '/collection' || path === '/specimens/new' || path.startsWith('/specimens/instances/') },
  { id: 'discover', to: '/specimens', label: 'Observações', icon: 'search', mobilePriority: 3, match: (path) => path === '/specimens' || path.startsWith('/observations/') || (/^\/specimens\/[^/]+$/.test(path) && path !== '/specimens/new') },
  { id: 'taxonomy', to: '/taxonomy', label: 'Taxonomia', icon: 'taxonomy', mobilePriority: 4, match: (path) => path === '/taxonomy' || path.startsWith('/taxonomy/') || path.startsWith('/keys') },
];

export function activeNavigationItem(pathname) {
  return navigationItems.find((item) => item.match(pathname)) || null;
}
