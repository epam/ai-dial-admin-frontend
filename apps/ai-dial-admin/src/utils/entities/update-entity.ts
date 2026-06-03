import { UpdateI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetView, isEvaluationView } from '../is-view';

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
  [ApplicationRoute.Toolsets]: UpdateI18nKey.Toolset,
  [ApplicationRoute.AssetsToolsets]: UpdateI18nKey.Toolset,
  [ApplicationRoute.InterceptorTemplates]: UpdateI18nKey.InterceptorTemplate,
  [ApplicationRoute.SystemProperties]: UpdateI18nKey.SystemProperties,
  [ApplicationRoute.Files]: UpdateI18nKey.File,
  [ApplicationRoute.TestSuites]: UpdateI18nKey.TestSuite,
  [ApplicationRoute.Datasets]: UpdateI18nKey.Dataset,
  [ApplicationRoute.FilePublications]: UpdateI18nKey.Publication,
  [ApplicationRoute.PromptPublications]: UpdateI18nKey.Publication,
  [ApplicationRoute.ApplicationPublications]: UpdateI18nKey.Publication,
  [ApplicationRoute.ToolsetPublications]: UpdateI18nKey.Publication,
  [ApplicationRoute.ConversationPublications]: UpdateI18nKey.Publication,
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
  if (isAssetView(view) || isEvaluationView(view)) {
    return t(UpdateI18nKey.NotificationDescriptionWithoutRollback, {
      entity: t(createEntityMap[view]),
      entityId: entityId || '',
    });
  }
  return t(UpdateI18nKey.NotificationDescription, { entity: t(createEntityMap[view]), entityId: entityId || '' });
};
