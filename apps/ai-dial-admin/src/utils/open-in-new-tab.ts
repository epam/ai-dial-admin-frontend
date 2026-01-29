import { ApplicationRoute } from '@/src/types/routes';
import { DialActivity } from '@/src/models/activity-audit';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';

export const onOpenInNewTab = (route?: ApplicationRoute, entity?: unknown) => {
  const url = getUrnForEntity(route, entity);
  window.open(url, '_blank');
};

export const getUrnForEntity = (route?: ApplicationRoute, entity?: unknown) => {
  const path = getEntityPath(route, entity, false);
  const originalRoute = route?.split('/')?.[1];
  return `/${originalRoute}/${path}`;
};

export const getEntityPath = (
  route: ApplicationRoute | undefined,
  data: unknown,
  forRemove?: boolean,
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
    case ApplicationRoute.ModelServings:
      return `${encodeURIComponent((data as { name: string }).name)}`;
    case ApplicationRoute.Images:
      return `${encodeURIComponent((data as { id: string }).id)}`;

    default:
      return encodeURIComponent((data as BaseEntity).name || '');
  }
};
