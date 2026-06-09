import { DeleteI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { getApplications } from '@/src/app/[lang]/applications/actions';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { getModelsListAction } from '@/src/app/[lang]/models/actions';
import { getInterceptorsList } from '@/src/app/[lang]/interceptors/actions';
import { ImageVersion } from '@/src/models/deployments/images';
import { getContainers } from '@/src/app/actions/deployments';
import { getImageType } from '@/src/utils/deployments/images';
import { getRouteByType } from '@/src/utils/deployments/entity';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { Container } from '@/src/models/deployments/containers';
import { AllVersionValue } from '@/src/components/EntityView/Modals/Delete/constants';
import { isAssetView, isDeploymentManagerView, isEvaluationView } from '@/src/utils/is-view';

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
  [ApplicationRoute.Datasets]: DeleteI18nKey.Dataset,
  [ApplicationRoute.TestCases]: DeleteI18nKey.TestCase,
  [ApplicationRoute.Runs]: DeleteI18nKey.Run,
  [ApplicationRoute.McpContainers]: DeleteI18nKey.McpContainer,
  [ApplicationRoute.InterceptorContainers]: DeleteI18nKey.InterceptorContainer,
  [ApplicationRoute.ModelServings]: DeleteI18nKey.ModelServing,
  [ApplicationRoute.AdapterContainers]: DeleteI18nKey.AdapterContainer,
  [ApplicationRoute.ApplicationContainers]: DeleteI18nKey.ApplicationContainer,
  [ApplicationRoute.Images]: DeleteI18nKey.Image,
  [ApplicationRoute.Conversations]: DeleteI18nKey.Conversation,
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
  if (isAssetView(view) || isEvaluationView(view) || isDeploymentManagerView(view)) {
    return t(DeleteI18nKey.NotificationDescriptionWithoutRollback, { entity: t(deleteEntityMap[view]), entityId });
  }

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
    case ApplicationRoute.Images:
      return t(DeleteI18nKey.ImageWarning);
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
    case ApplicationRoute.Images:
      return t(DeleteI18nKey.RelatedContainers);
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
  return getModelsListAction().then((res) => {
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

const getRelatedContainers = (image: {
  existingVersions: ImageVersion[];
  $type: IMAGE_TYPE;
  selectedVersion: string;
}) => {
  const { $type, selectedVersion, existingVersions } = image;
  return getContainers(getImageType(getRouteByType($type))).then(({ success, response }) => {
    if (success) {
      const reference =
        selectedVersion === AllVersionValue
          ? existingVersions.map((v) => v.id)
          : existingVersions.filter((v) => v.version === selectedVersion).map((v) => v.id);
      return response.filter((c: Container) => reference.includes(c.source.imageDefinitionId as string));
    }
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
    case ApplicationRoute.Images:
      return getRelatedContainers(
        entity as { existingVersions: ImageVersion[]; $type: IMAGE_TYPE; selectedVersion: string },
      );
    default:
      return Promise.resolve([]);
  }
};
