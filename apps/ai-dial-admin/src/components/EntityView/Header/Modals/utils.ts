import { DeleteI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

const deleteEntityMap: Record<string, DeleteI18nKey> = {
  [ApplicationRoute.Models]: DeleteI18nKey.Model,
  [ApplicationRoute.Applications]: DeleteI18nKey.Application,
  [ApplicationRoute.AssetsApplications]: DeleteI18nKey.Application,
  [ApplicationRoute.AssetsToolsets]: DeleteI18nKey.Toolsets,
  [ApplicationRoute.Toolsets]: DeleteI18nKey.Toolsets,
  [ApplicationRoute.Interceptors]: DeleteI18nKey.Interceptor,
  [ApplicationRoute.Routes]: DeleteI18nKey.Route,
  // TODO: Add all r

  [ApplicationRoute.ApplicationRunners]: DeleteI18nKey.ApplicationRunnerTitle,
  [ApplicationRoute.Keys]: DeleteI18nKey.Key,
  [ApplicationRoute.Roles]: DeleteI18nKey.Role,
  [ApplicationRoute.Prompts]: DeleteI18nKey.Prompt,
  [ApplicationRoute.Files]: DeleteI18nKey.File,
  [ApplicationRoute.Adapters]: DeleteI18nKey.AdapterTitle,
  [ApplicationRoute.InterceptorTemplates]: DeleteI18nKey.InterceptorTemplateTitle,
};

export const getTitle = (view: ApplicationRoute, t: (str: string, props?: Record<string, string>) => string) => {
  return t(DeleteI18nKey.Title, { entity: t(deleteEntityMap[view]) });
};

export const getConfirmation = (view: ApplicationRoute, t: (str: string, props?: Record<string, string>) => string) => {
  return t(DeleteI18nKey.Confirming, { entity: t(deleteEntityMap[view]) });
};

export const getNotificationTitle = (
  view: ApplicationRoute,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(DeleteI18nKey.NotificationTitle, { entity: t(deleteEntityMap[view]) });
};

export const getNotificationDescription = (
  view: ApplicationRoute,
  entityId: string,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(DeleteI18nKey.NotificationDescription, { entity: t(deleteEntityMap[view]), entityId });
};
