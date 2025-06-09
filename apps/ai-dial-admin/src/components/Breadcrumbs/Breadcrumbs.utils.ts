import { MenuI18nKey } from '@/src/constants/i18n';
import { EmbeddedApp } from '@/src/context/AppContext';
import { ApplicationRoute } from '@/src/types/routes';
import { breadcrumbConfig } from './Breadcrumbs.config';

const IGNORE_BREADCRUMBS = [ApplicationRoute.Home];

export interface BreadcrumbConfig {
  segments: {
    name: string;
    i18nKey?: MenuI18nKey;
    href?: boolean;
  }[];
}

export interface Breadcrumb {
  key?: MenuI18nKey;
  name: string;
  href: string;
}

const getEmbeddedPluginBreadcrumb = (route: ApplicationRoute, apps?: EmbeddedApp[]): BreadcrumbConfig | null => {
  const app = apps?.find((a) => a.slug === route);
  if (app) {
    return {
      segments: [
        { name: app.slug, i18nKey: app.key as MenuI18nKey },
        { name: 'Id', href: false },
      ],
    };
  }
  return null;
};

const getBreadcrumbConfig = (route: ApplicationRoute, embeddedApps?: EmbeddedApp[]): BreadcrumbConfig | null => {
  const fromConfig = breadcrumbConfig[route];
  if (fromConfig) return fromConfig;

  const embedded = getEmbeddedPluginBreadcrumb(route, embeddedApps);
  return embedded || null;
};

export function getBreadcrumbs(pathname: string, currentLocale: string, embeddedApps?: EmbeddedApp[]): Breadcrumb[] {
  const segments = pathname.split('/').filter((segment) => segment);
  const isLocale = currentLocale?.includes(segments[0]);
  const locale = isLocale ? segments[0] : null;
  const pathSegments = isLocale ? segments.slice(1) : segments;
  const rootSegment = `/${pathSegments[0]}`;
  const config = getBreadcrumbConfig(rootSegment as ApplicationRoute, embeddedApps);

  if (IGNORE_BREADCRUMBS.includes(rootSegment as ApplicationRoute)) {
    return [];
  }

  if (!config) {
    return pathSegments.map((segment, index) => ({
      name: segment,
      href: `/${[locale, ...pathSegments.slice(0, index + 1)].filter(Boolean).join('/')}`,
    }));
  }

  return pathSegments.map((pathSegment, index) => {
    const configSegment = config.segments[index];
    return {
      key: configSegment.i18nKey,
      name: pathSegment,
      href:
        configSegment.href !== false
          ? `/${[locale, ...pathSegments.slice(0, index + 1)].filter(Boolean).join('/')}`
          : '',
    };
  });
}
