import { SYSTEM_ROLLBACK_ID } from '@/src/components/ActivityAudit/Rollback/constants';
import { RollbackI18nKey, MenuI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { breadcrumbConfig } from './constants';
import { Breadcrumb } from './models';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useProjectFolder } from '@/src/context/assets/ProjectFolderContext';
import { useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { Dispatch, SetStateAction } from 'react';
import { useConversationFolder } from '@/src/context/assets/ConversationsFolderContext';
import { RUN_COMPARE_SEGMENT } from '@/src/components/Runs/Compare/constants';

const IGNORE_BREADCRUMBS = [ApplicationRoute.Home];
const TRANSLATE_BREADCRUMBS = {
  [SYSTEM_ROLLBACK_ID]: RollbackI18nKey.Rollback,
  [RUN_COMPARE_SEGMENT]: RunsI18nKey.RunComparison,
};

const decodePathSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

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
    const defaultHref =
      configSegment.href !== false ? `/${[locale, ...pathSegments.slice(0, index + 1)].filter(Boolean).join('/')}` : '';

    return {
      key: translated ? (translated as unknown as MenuI18nKey) : configSegment.i18nKey,
      name: decodePathSegment(pathSegment),
      href: defaultHref,
    };
  });
}

const getFolderBreadcrumbs = (path: string, onFolderClick?: (href: string) => void): Breadcrumb[] => {
  const trimmedPath = path.replace(/^\/|\/$/g, '');
  const parts = trimmedPath.split('/');
  let newBreadcrumbs: Breadcrumb[] = [];
  let href = '';

  parts.forEach((part) => {
    href += part + '/';
    newBreadcrumbs.push({
      name: decodePathSegment(part),
      href: href,
      callback: (href: string) => {
        onFolderClick?.(href);
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

  return newBreadcrumbs;
};

export function enrichWithFolderBreadcrumbs(
  breadcrumbs: Breadcrumb[],
  path?: string,
  setFilePath?: Dispatch<SetStateAction<string>>,
): Breadcrumb[] {
  if (!path) {
    return breadcrumbs;
  }

  return [...breadcrumbs, ...getFolderBreadcrumbs(path, (href) => setFilePath?.(href))];
}

/**
 * The folder an entity lives in, from the `path` its details URL carries (`public/folder/name__1.0`
 * gives `public/folder/`); `undefined` when the entity has no folder part.
 */
export function getEntityFolderPath(entityPath?: string | null): string | undefined {
  const separatorIndex = entityPath?.lastIndexOf('/') ?? -1;

  return separatorIndex > 0 ? entityPath?.slice(0, separatorIndex + 1) : undefined;
}

/**
 * Puts the entity's folders between the section crumb and the entity crumb of a details page, so the
 * trail reads `Applications > public > folder > name`. Each folder crumb reports its own path.
 */
export function enrichDetailsWithFolderBreadcrumbs(
  breadcrumbs: Breadcrumb[],
  folderPath?: string,
  onFolderClick?: (href: string) => void,
): Breadcrumb[] {
  if (!folderPath || breadcrumbs.length < 2) {
    return breadcrumbs;
  }

  return [...breadcrumbs.slice(0, -1), ...getFolderBreadcrumbs(folderPath, onFolderClick), breadcrumbs.at(-1)!];
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
    case ApplicationRoute.Skills:
      return useSkillFolder;
    case ApplicationRoute.Projects:
      return useProjectFolder;
    case ApplicationRoute.Files:
      return useFileFolder;
    case ApplicationRoute.Conversations:
      return useConversationFolder;
    default:
      return null;
  }
}

export function shouldEnrichWithFolderBreadcrumbs(pathname: string, currentLocale: string) {
  const { pathSegments, config } = getRouteDataByPath(pathname, currentLocale);

  return config?.segments?.[pathSegments.length - 1]?.shouldEnrichWithFolderBreadcrumbs;
}

export function shouldEnrichDetailsWithFolderBreadcrumbs(pathname: string, currentLocale: string) {
  const { pathSegments, config } = getRouteDataByPath(pathname, currentLocale);

  return pathSegments.length > 1 && !!config?.segments?.[0]?.shouldEnrichWithFolderBreadcrumbs;
}
