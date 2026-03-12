import { HELP_DOCUMENTATION_LINKS } from '@/src/constants/help-documentation-links';
import { ApplicationRoute } from '@/src/types/routes';

const getBaseRouteFromPathname = (pathname: string): string | null => {
  if (!pathname || pathname === '/') return null;

  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const possibleLocale = segments[0];
  const isLikelyLocale = possibleLocale.length === 2 && /^[a-z]{2}$/i.test(possibleLocale);

  const routeSegment = isLikelyLocale && segments.length >= 2 ? segments[1] : segments[0];
  const baseRoute = `/${routeSegment}`;

  const validRoutes = Object.values(ApplicationRoute) as string[];
  return validRoutes.includes(baseRoute) ? baseRoute : null;
};

export const getHelpUrl = (pathname: string) => {
  const baseRoute = getBaseRouteFromPathname(pathname);
  return HELP_DOCUMENTATION_LINKS[baseRoute as ApplicationRoute];
};

export const isListView = (pathname: string) => {
  if (!pathname || pathname === '/') return false;

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return false;

  const possibleLocale = segments[0];
  const isLikelyLocale = possibleLocale.length === 2 && /^[a-z]{2}$/i.test(possibleLocale);
  const expectedSegmentsLength = isLikelyLocale ? 2 : 1;

  return Boolean(getBaseRouteFromPathname(pathname)) && segments.length === expectedSegmentsLength;
};
