import { ApplicationRoute } from '@/src/types/routes';
import { DialActivity } from '@/src/models/activity-audit';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { Container, DEPLOYMENT_ENTITY } from '@/src/models/deployments';

export const onOpenInNewTab = (
  locale: string,
  route?: ApplicationRoute,
  entity?: unknown,
  entityType?: DEPLOYMENT_ENTITY,
) => {
  const url = getUrnForEntity(locale, route, entity, entityType);
  window.open(url, '_blank');
};

export const getUrnForEntity = (
  locale: string,
  route?: ApplicationRoute,
  entity?: unknown,
  entityType?: DEPLOYMENT_ENTITY,
) => {
  const path = getEntityPath(route, entity, false, entityType);
  const originalRoute = route?.split('/')?.[1];
  return `/${locale}/${originalRoute}/${path}`;
};

export const getEntityPath = (
  route: ApplicationRoute | undefined,
  data: unknown,
  forRemove?: boolean,
  entityType?: DEPLOYMENT_ENTITY,
) => {
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

    case ApplicationRoute.InterceptorDeployments:
      return `${encodeURIComponent((data as Container).id)}?entityType=${entityType || ''}`;

    default:
      return encodeURIComponent((data as BaseEntity).name || '');
  }
};
