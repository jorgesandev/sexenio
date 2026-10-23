export const ROUTES = {
  explorar: "/explorar/",
  comparar: "/comparar/",
  constructor: "/constructor/",
  metodologia: "/metodologia/",
} as const;

export function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized.length > 0 ? normalized : "/";
}

export function isRouteActive(pathname: string, route: string): boolean {
  return normalizePathname(pathname) === normalizePathname(route);
}
