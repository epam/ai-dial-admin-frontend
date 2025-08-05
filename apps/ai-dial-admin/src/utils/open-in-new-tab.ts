import { ApplicationRoute } from '@/src/types/routes';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';

export const onOpenInNewTab = (route?: ApplicationRoute, entity?: unknown) => {
  const path = getEntityPath(route, entity);
  const originalRoute = route?.split('/')?.[1];
  window.open(`/${originalRoute}/${path}`, '_blank');
};

export const getEntityPath = (route: ApplicationRoute | undefined, data: unknown, forRemove?: boolean) => {
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
