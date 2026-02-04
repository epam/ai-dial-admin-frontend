import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/Rollback/constants';
import { RollbackI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { breadcrumbConfig } from './constants';
import { Breadcrumb } from './models';

const IGNORE_BREADCRUMBS = [ApplicationRoute.Home];
const TRANSLATE_BREADCRUMBS = { [SYSTEM_ROLLBACK_ID]: RollbackI18nKey.System };

export function getBreadcrumbs(pathname: string, currentLocale: string): Breadcrumb[] {
  const segments = pathname.split('/').filter((segment) => segment);
  const isLocale = currentLocale?.includes(segments[0]);
  const locale = isLocale ? segments[0] : null;
  const pathSegments = isLocale ? segments.slice(1) : segments;
  const rootSegment = `/${pathSegments[0]}`;
  const config = breadcrumbConfig[rootSegment as ApplicationRoute];

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
