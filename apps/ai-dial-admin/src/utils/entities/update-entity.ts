import { UpdateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

const createEntityMap: Record<string, UpdateI18nKey> = {
  [ApplicationRoute.Models]: UpdateI18nKey.Model,
  [ApplicationRoute.Applications]: UpdateI18nKey.Application,
  [ApplicationRoute.AssetsApplications]: UpdateI18nKey.Application,
  [ApplicationRoute.ApplicationRunners]: UpdateI18nKey.ApplicationRunner,
  [ApplicationRoute.Keys]: UpdateI18nKey.Key,
  [ApplicationRoute.Roles]: UpdateI18nKey.Role,
  [ApplicationRoute.Interceptors]: UpdateI18nKey.Interceptor,
  [ApplicationRoute.Prompts]: UpdateI18nKey.Prompt,
  [ApplicationRoute.Routes]: UpdateI18nKey.Route,
  [ApplicationRoute.Adapters]: UpdateI18nKey.Adapter,
  [ApplicationRoute.Toolsets]: UpdateI18nKey.Toolsets,
  [ApplicationRoute.AssetsToolsets]: UpdateI18nKey.Toolsets,
  [ApplicationRoute.InterceptorTemplates]: UpdateI18nKey.InterceptorTemplate,
  [ApplicationRoute.SystemProperties]: UpdateI18nKey.SystemProperties,
};

export const getUpdateNotificationTitle = (
  view: ApplicationRoute,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(UpdateI18nKey.NotificationTitle, { entity: t(createEntityMap[view]) });
};

export const getUpdateNotificationDescription = (
  view: ApplicationRoute,
  entityId: string | undefined,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(UpdateI18nKey.NotificationDescription, { entity: t(createEntityMap[view]), entityId: entityId || '' });
};
