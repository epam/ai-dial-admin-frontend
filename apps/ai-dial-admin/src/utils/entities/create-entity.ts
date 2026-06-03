import { CreateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

const createEntityMap: Record<string, CreateI18nKey> = {
  [ApplicationRoute.Models]: CreateI18nKey.Model,
  [ApplicationRoute.Applications]: CreateI18nKey.Application,
  [ApplicationRoute.ApplicationRunners]: CreateI18nKey.ApplicationRunner,
  [ApplicationRoute.Keys]: CreateI18nKey.Key,
  [ApplicationRoute.Roles]: CreateI18nKey.Role,
  [ApplicationRoute.Interceptors]: CreateI18nKey.Interceptor,
  [ApplicationRoute.Prompts]: CreateI18nKey.Prompt,
  [ApplicationRoute.Routes]: CreateI18nKey.Route,
  [ApplicationRoute.Adapters]: CreateI18nKey.Adapter,
  [ApplicationRoute.Toolsets]: CreateI18nKey.Toolsets,
  [ApplicationRoute.InterceptorTemplates]: CreateI18nKey.InterceptorTemplate,
  [ApplicationRoute.AssetsApplications]: CreateI18nKey.Application,
  [ApplicationRoute.AssetsToolsets]: CreateI18nKey.Toolsets,
  [ApplicationRoute.TestSuites]: CreateI18nKey.TestSuite,
  [ApplicationRoute.Datasets]: CreateI18nKey.Dataset,
};

export const getCreateEntityTitle = (
  view: ApplicationRoute,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(CreateI18nKey.Title, { entity: t(createEntityMap[view]) });
};

export const getCreateNotificationTitle = (
  view: ApplicationRoute,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(CreateI18nKey.NotificationTitle, { entity: t(createEntityMap[view]) });
};

export const getCreateNotificationDescription = (
  view: ApplicationRoute,
  entityId: string | undefined,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(CreateI18nKey.NotificationDescription, { entity: t(createEntityMap[view]), entityId: entityId || '' });
};
