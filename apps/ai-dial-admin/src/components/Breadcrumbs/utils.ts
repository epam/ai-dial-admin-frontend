import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/Rollback/constants';
import { RollbackI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { breadcrumbConfig } from './constants';
import { Breadcrumb } from './models';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { Dispatch, SetStateAction } from 'react';

const IGNORE_BREADCRUMBS = [ApplicationRoute.Home];
const TRANSLATE_BREADCRUMBS = { [SYSTEM_ROLLBACK_ID]: RollbackI18nKey.Rollback };

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

export function enrichWithFolderBreadcrumbs(
  breadcrumbs: Breadcrumb[],
  path?: string,
  setFilePath?: Dispatch<SetStateAction<string>>,
): Breadcrumb[] {
  if (!path) {
    return breadcrumbs;
  }

  const trimmedPath = path.replace(/^\/|\/$/g, '');
  const parts = trimmedPath.split('/');
  let newBreadcrumbs: Breadcrumb[] = [];
  let href = '';

  parts.forEach((part) => {
    href += part + '/';
    newBreadcrumbs.push({
      name: part,
      href: href,
      callback: (href: string) => {
        setFilePath?.(href);
      },
    });
  });

  if (newBreadcrumbs.length > 3) {
    const firstPart = newBreadcrumbs[0];
    const hiddenPart = newBreadcrumbs.slice(1, -2);
    const secondPart = newBreadcrumbs.slice(-2);

    newBreadcrumbs = [
      firstPart,
      {
        name: '...',
        href: '',
        hiddenBreadcrumbs: hiddenPart,
      },
      ...secondPart,
    ];
  }

  return [...breadcrumbs, ...newBreadcrumbs];
}

export function getRouteDataByPath(pathname: string, currentLocale: string) {
  const segments = pathname.split('/').filter((segment) => segment);
  const isLocale = currentLocale?.includes(segments[0]);
  const pathSegments = isLocale ? segments.slice(1) : segments;
  const rootSegment = `/${pathSegments[0]}`;

  return { view: rootSegment, pathSegments, config: breadcrumbConfig[rootSegment as ApplicationRoute] };
}

export function getFolderContext(pathname: string, currentLocale: string) {
  const { view } = getRouteDataByPath(pathname, currentLocale);

  switch (view) {
    case ApplicationRoute.AssetsApplications:
      return useAppsFolder;
    case ApplicationRoute.Prompts:
      return usePromptFolder;
    case ApplicationRoute.AssetsToolsets:
      return useToolsetFolder;
    case ApplicationRoute.Files:
      return useFileFolder;
    default:
      return null;
  }
}

export function shouldEnrichWithFolderBreadcrumbs(pathname: string, currentLocale: string) {
  const { pathSegments, config } = getRouteDataByPath(pathname, currentLocale);

  return config?.segments?.[pathSegments.length - 1]?.shouldEnrichWithFolderBreadcrumbs;
}
