import { DeleteI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { getApplications } from '@/src/app/[lang]/applications/actions';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { getModels } from '@/src/app/[lang]/models/actions';
import { getInterceptorsList } from '@/src/app/[lang]/interceptors/actions';

const deleteEntityMap: Record<string, DeleteI18nKey> = {
  [ApplicationRoute.Models]: DeleteI18nKey.Model,
  [ApplicationRoute.Applications]: DeleteI18nKey.Application,
  [ApplicationRoute.AssetsApplications]: DeleteI18nKey.Application,
  [ApplicationRoute.AssetsToolsets]: DeleteI18nKey.Toolset,
  [ApplicationRoute.Toolsets]: DeleteI18nKey.Toolset,
  [ApplicationRoute.Interceptors]: DeleteI18nKey.Interceptor,
  [ApplicationRoute.Routes]: DeleteI18nKey.Route,
  [ApplicationRoute.ApplicationRunners]: DeleteI18nKey.ApplicationRunner,
  [ApplicationRoute.Keys]: DeleteI18nKey.Key,
  [ApplicationRoute.Roles]: DeleteI18nKey.Role,
  [ApplicationRoute.Prompts]: DeleteI18nKey.Prompt,
  [ApplicationRoute.Files]: DeleteI18nKey.File,
  [ApplicationRoute.Adapters]: DeleteI18nKey.Adapter,
  [ApplicationRoute.InterceptorTemplates]: DeleteI18nKey.InterceptorTemplate,
  [ApplicationRoute.TestSuites]: DeleteI18nKey.TestSuite,
};

const bulkDeleteEntityMap: Record<string, DeleteI18nKey> = {
  [ApplicationRoute.AssetsApplications]: DeleteI18nKey.Applications,
  [ApplicationRoute.AssetsToolsets]: DeleteI18nKey.Toolsets,
  [ApplicationRoute.Prompts]: DeleteI18nKey.Prompts,
};

export const getBulkNotificationTitle = (
  view: ApplicationRoute,
  t: (str: string, props?: Record<string, string>) => string,
) => {
  return t(DeleteI18nKey.NotificationTitle, { entity: t(bulkDeleteEntityMap[view]) });
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

export const getWarningText = (view: ApplicationRoute, t: (str: string) => string) => {
  switch (view) {
    case ApplicationRoute.ApplicationRunners:
      return t(DeleteI18nKey.ApplicationRunnerWarning);
    case ApplicationRoute.InterceptorTemplates:
      return t(DeleteI18nKey.InterceptorTemplateWarning);
    case ApplicationRoute.Adapters:
      return t(DeleteI18nKey.AdapterWarning);
    default:
      return '';
  }
};

export const getRelatedText = (view: ApplicationRoute, t: (str: string) => string) => {
  switch (view) {
    case ApplicationRoute.ApplicationRunners:
      return t(DeleteI18nKey.RelatedApplications);
    case ApplicationRoute.InterceptorTemplates:
      return t(DeleteI18nKey.RelatedInterceptors);
    case ApplicationRoute.Adapters:
      return t(DeleteI18nKey.RelatedModels);
    default:
      return '';
  }
};

export const getNoRelatedText = (view: ApplicationRoute, t: (str: string) => string) => {
  switch (view) {
    case ApplicationRoute.ApplicationRunners:
      return t(DeleteI18nKey.NoApplications);
    case ApplicationRoute.InterceptorTemplates:
      return t(DeleteI18nKey.NoInterceptors);
    case ApplicationRoute.Adapters:
      return t(DeleteI18nKey.NoModels);
    default:
      return '';
  }
};

const getRelatedApplications = (entity: { applications?: string[] }) => {
  return getApplications().then((res) => {
    return res.response?.reduce((acc, curr) => {
      if (entity.applications?.includes(curr.name as string)) {
        acc.push(curr);
      }
      return acc;
    }, [] as BaseEntity[]);
  });
};

const getRelatedModels = (entity: { models?: string[] }) => {
  return getModels().then((res) => {
    return res.response?.reduce((acc, curr) => {
      if (entity.models?.includes(curr.name as string)) {
        acc.push(curr);
      }
      return acc;
    }, [] as BaseEntity[]);
  });
};

const getRelatedInterceptors = (entity: { interceptors?: string[] }) => {
  return getInterceptorsList().then((res) => {
    return res?.response?.reduce((acc, curr) => {
      if (entity.interceptors?.includes(curr.name as string)) {
        acc.push(curr);
      }
      return acc;
    }, [] as BaseEntity[]);
  });
};

export const getRelatedArtifacts = (view: ApplicationRoute, entity: BaseEntity) => {
  switch (view) {
    case ApplicationRoute.ApplicationRunners:
      return getRelatedApplications(entity as { applications?: string[] });
    case ApplicationRoute.Adapters:
      return getRelatedModels(entity as { models?: string[] });
    case ApplicationRoute.InterceptorTemplates:
      return getRelatedInterceptors(entity as { interceptors?: string[] });
    default:
      return Promise.resolve([]);
  }
};
