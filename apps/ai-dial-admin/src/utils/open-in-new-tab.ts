import { ApplicationRoute } from '@/src/types/routes';
import { DialActivity } from '@/src/models/activity-audit';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { DEPLOYMENT_ENTITY } from '@/src/models/deployments/deployments';

export const onOpenInNewTab = (route?: ApplicationRoute, entity?: unknown, entityType?: DEPLOYMENT_ENTITY) => {
  const url = getUrnForEntity(route, entity, entityType);
  window.open(url, '_blank');
};

export const getUrnForEntity = (route?: ApplicationRoute, entity?: unknown, entityType?: DEPLOYMENT_ENTITY) => {
  const path = getEntityPath(route, entity, false, entityType);
  const originalRoute = route?.split('/')?.[1];
  return `/${originalRoute}/${path}`;
};

export const getEntityPath = (
  route: ApplicationRoute | undefined,
  data: unknown,
  forRemove?: boolean,
  entityType?: DEPLOYMENT_ENTITY,
  version?: string,
) => {
  switch (route) {
    case ApplicationRoute.ApplicationRunners:
      return encodeURIComponent(`${(data as DialApplicationScheme).$id}`);

    case ApplicationRoute.Prompts:
    case ApplicationRoute.Files:
    case ApplicationRoute.AssetsApplications:
    case ApplicationRoute.AssetsToolsets: {
      const path = version
        ? `${(data as DialPrompt).folderId}${(data as DialPrompt).name}__${version}`
        : (data as DialPrompt).path ||
          `${(data as DialPrompt).folderId}${(data as DialPrompt).name}__${(data as DialPrompt).version}`;

      return forRemove
        ? decodeURIComponent(path)
        : `${encodeURIComponent((data as DialPrompt).name as string)}?path=${encodeURIComponent(path)}`;
    }

    case ApplicationRoute.PromptPublications:
    case ApplicationRoute.FilePublications:
    case ApplicationRoute.ApplicationPublications:
    case ApplicationRoute.ToolsetPublications:
      return `${encodeURIComponent((data as Publication).requestName)}?path=${(data as Publication).path}`;

    case ApplicationRoute.ActivityAudit:
      return (data as DialActivity).activityId;

    case ApplicationRoute.McpDeployments:
    case ApplicationRoute.InterceptorDeployments:
    case ApplicationRoute.ModelDeployments:
      return `${encodeURIComponent((data as { id: string }).id)}?entityType=${entityType || ''}`;

    default:
      return encodeURIComponent((data as BaseEntity).name || '');
  }
};
