import { CreateI18nKey, DeleteI18nKey, EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';

export const listViewTitleMap: Record<string, MenuI18nKey> = {
  [ApplicationRoute.Models]: MenuI18nKey.Models,
  [ApplicationRoute.Applications]: MenuI18nKey.Applications,
  [ApplicationRoute.Adapters]: MenuI18nKey.Adapters,
  [ApplicationRoute.Assistants]: MenuI18nKey.Assistants,
  [ApplicationRoute.Interceptors]: MenuI18nKey.Interceptors,
  [ApplicationRoute.Keys]: MenuI18nKey.Keys,
  [ApplicationRoute.Roles]: MenuI18nKey.Roles,
  [ApplicationRoute.ApplicationRunners]: MenuI18nKey.ApplicationRunners,
  [ApplicationRoute.Prompts]: MenuI18nKey.Prompts,
  [ApplicationRoute.Files]: MenuI18nKey.Files,
  [ApplicationRoute.AssetsApplications]: MenuI18nKey.Applications,
  [ApplicationRoute.Addons]: MenuI18nKey.Addons,
  [ApplicationRoute.Routes]: MenuI18nKey.Routes,
  [ApplicationRoute.PromptPublications]: MenuI18nKey.PromptPublications,
  [ApplicationRoute.FilePublications]: MenuI18nKey.FilePublications,
  [ApplicationRoute.ApplicationPublications]: MenuI18nKey.ApplicationPublications,
  [ApplicationRoute.ActivityAudit]: MenuI18nKey.ActivityAudit,
  [ApplicationRoute.InterceptorTemplates]: MenuI18nKey.InterceptorTemplates,
};

export const emptyDataTitleMap: Record<string, EntitiesI18nKey> = {
  [ApplicationRoute.Models]: EntitiesI18nKey.NoModels,
  [ApplicationRoute.Applications]: EntitiesI18nKey.NoApplications,
  [ApplicationRoute.ApplicationRunners]: EntitiesI18nKey.NoApplicationRunners,
  [ApplicationRoute.Assistants]: EntitiesI18nKey.NoAssistants,
  [ApplicationRoute.Interceptors]: EntitiesI18nKey.NoInterceptors,
  [ApplicationRoute.Adapters]: EntitiesI18nKey.NoAdapters,
  [ApplicationRoute.Keys]: EntitiesI18nKey.NoKeys,
  [ApplicationRoute.Roles]: EntitiesI18nKey.NoRoles,
  [ApplicationRoute.Addons]: EntitiesI18nKey.NoAddons,
  [ApplicationRoute.Routes]: EntitiesI18nKey.NoRoutes,
  [ApplicationRoute.Prompts]: EntitiesI18nKey.NoPrompts,
  [ApplicationRoute.Files]: EntitiesI18nKey.NoFiles,
  [ApplicationRoute.AssetsApplications]: EntitiesI18nKey.NoApplications,
  [ApplicationRoute.PromptPublications]: EntitiesI18nKey.NoPublications,
  [ApplicationRoute.FilePublications]: EntitiesI18nKey.NoPublications,
  [ApplicationRoute.ApplicationPublications]: EntitiesI18nKey.NoPublications,
  [ApplicationRoute.ActivityAudit]: EntitiesI18nKey.NoActivityAudit,
  [ApplicationRoute.InterceptorTemplates]: EntitiesI18nKey.NoInterceptorTemplates,
};

export const deleteModalTitleMap: Record<string, DeleteI18nKey> = {
  [ApplicationRoute.Models]: DeleteI18nKey.Model,
  [ApplicationRoute.Applications]: DeleteI18nKey.Application,
  [ApplicationRoute.ApplicationRunners]: DeleteI18nKey.ApplicationRunnerTitle,
  [ApplicationRoute.Interceptors]: DeleteI18nKey.Interceptor,
  [ApplicationRoute.Keys]: DeleteI18nKey.Key,
  [ApplicationRoute.Roles]: DeleteI18nKey.Role,
  [ApplicationRoute.Addons]: DeleteI18nKey.Addons,
  [ApplicationRoute.Assistants]: DeleteI18nKey.Model,
  [ApplicationRoute.Prompts]: DeleteI18nKey.Prompt,
  [ApplicationRoute.Files]: DeleteI18nKey.File,
  [ApplicationRoute.AssetsApplications]: DeleteI18nKey.Application,
  [ApplicationRoute.Routes]: DeleteI18nKey.Route,
  [ApplicationRoute.Adapters]: DeleteI18nKey.AdapterTitle,
  [ApplicationRoute.InterceptorTemplates]: DeleteI18nKey.InterceptorTemplateTitle,
};

export const createModalTitleMap: Record<string, CreateI18nKey> = {
  [ApplicationRoute.Models]: CreateI18nKey.Model,
  [ApplicationRoute.Applications]: CreateI18nKey.Application,
  [ApplicationRoute.ApplicationRunners]: CreateI18nKey.ApplicationRunner,
  [ApplicationRoute.Keys]: CreateI18nKey.Key,
  [ApplicationRoute.Roles]: CreateI18nKey.Role,
  [ApplicationRoute.Interceptors]: CreateI18nKey.Interceptor,
  [ApplicationRoute.Addons]: CreateI18nKey.Addons,
  [ApplicationRoute.Assistants]: CreateI18nKey.Assistant,
  [ApplicationRoute.Prompts]: CreateI18nKey.Prompt,
  [ApplicationRoute.Routes]: CreateI18nKey.Route,
  [ApplicationRoute.Adapters]: CreateI18nKey.Adapter,
  [ApplicationRoute.InterceptorTemplates]: CreateI18nKey.InterceptorTemplate,
};

export const getEntityPath = (route: ApplicationRoute, data: unknown, forRemove?: boolean) => {
  switch (route) {
    case ApplicationRoute.ApplicationRunners:
      return encodeURIComponent(`${(data as DialApplicationScheme).$id}`);

    case ApplicationRoute.Prompts:
    case ApplicationRoute.Files:
    case ApplicationRoute.AssetsApplications:
      return forRemove
        ? decodeURIComponent((data as DialPrompt).path)
        : `${encodeURIComponent((data as DialPrompt).name as string)}?path=${encodeURIComponent((data as DialPrompt).path)}`;

    case ApplicationRoute.PromptPublications:
    case ApplicationRoute.FilePublications:
    case ApplicationRoute.ApplicationPublications:
      return `${encodeURIComponent((data as Publication).requestName)}?path=${(data as DialPrompt).path}`;

    case ApplicationRoute.ActivityAudit:
      return (data as DialActivity).activityId;

    default:
      return encodeURIComponent((data as DialBaseNamedEntity).name || '');
  }
};
