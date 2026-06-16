import { DuplicateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

export const duplicateEntityMap: Record<string, DuplicateI18nKey> = {
  [ApplicationRoute.Models]: DuplicateI18nKey.Model,
  [ApplicationRoute.Applications]: DuplicateI18nKey.Application,
  [ApplicationRoute.AssetsApplications]: DuplicateI18nKey.Application,
  [ApplicationRoute.AssetsToolsets]: DuplicateI18nKey.Toolsets,
  [ApplicationRoute.Toolsets]: DuplicateI18nKey.Toolsets,
  [ApplicationRoute.Interceptors]: DuplicateI18nKey.Interceptor,
  [ApplicationRoute.Routes]: DuplicateI18nKey.Route,
  [ApplicationRoute.ApplicationRunners]: DuplicateI18nKey.ApplicationRunner,
  [ApplicationRoute.Keys]: DuplicateI18nKey.Key,
  [ApplicationRoute.Roles]: DuplicateI18nKey.Role,
  [ApplicationRoute.Prompts]: DuplicateI18nKey.Prompt,
  [ApplicationRoute.Files]: DuplicateI18nKey.File,
  [ApplicationRoute.Adapters]: DuplicateI18nKey.Adapter,
  [ApplicationRoute.InterceptorTemplates]: DuplicateI18nKey.InterceptorTemplate,
  [ApplicationRoute.TestSuites]: DuplicateI18nKey.TestSuite,
  [ApplicationRoute.Datasets]: DuplicateI18nKey.Dataset,
};

export const duplicateModalDescriptionMap: Record<string, DuplicateI18nKey> = {
  [ApplicationRoute.Models]: DuplicateI18nKey.ModelDescription,
};

export const getCloneTitle = (view: ApplicationRoute, t: (str: string, props?: Record<string, string>) => string) => {
  return t(DuplicateI18nKey.Title, { entity: t(duplicateEntityMap[view]) });
};

export const getClonedEntityName = (name?: string, withoutBrackets?: boolean, splitSymbol = '_'): string => {
  const copySuffix = 'copy';
  if (name?.includes(copySuffix)) {
    return name;
  }

  if (withoutBrackets) {
    return name ? `${name}-${copySuffix}` : '';
  }
  return `${name}${splitSymbol}(${copySuffix})`;
};
