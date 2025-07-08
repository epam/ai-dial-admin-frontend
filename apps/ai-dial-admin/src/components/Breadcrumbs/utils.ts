import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/constants';
import { ActivityAuditI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { EmbeddedApp } from '@/src/context/AppContext';
import { ApplicationRoute } from '@/src/types/routes';
import { breadcrumbConfig } from './constants';
import { BreadcrumbConfig, Breadcrumb } from './models';

const IGNORE_BREADCRUMBS = [ApplicationRoute.Home, ApplicationRoute.Forbidden];
const TRANSLATE_BREADCRUMBS = { [SYSTEM_ROLLBACK_ID]: ActivityAuditI18nKey.RollbackSystem };

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

  if (IGNORE_BREADCRUMBS.includes(rootSegment as ApplicationRoute) || !config) {
    return [];
  }

  return pathSegments.map((pathSegment, index) => {
    const configSegment = config.segments[index];
    const translated = TRANSLATE_BREADCRUMBS[pathSegment as keyof typeof TRANSLATE_BREADCRUMBS];
    return {
      key: translated ? (translated as unknown as MenuI18nKey) : configSegment.i18nKey,
      name: pathSegment,
      href:
        configSegment.href !== false
          ? `/${[locale, ...pathSegments.slice(0, index + 1)].filter(Boolean).join('/')}`
          : '',
    };
  });
}
