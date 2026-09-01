import { getCompareRunsPath } from '@/src/components/Runs/Compare/utils';
import { ApplicationRoute } from '@/src/types/routes';
import { DialActivity } from '@/src/models/activity-audit';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';

export const escapePercentSign = (str: string): string => {
  return str.replace(/%/g, '%25');
};

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

    case ApplicationRoute.Conversations:
    case ApplicationRoute.Prompts:
    case ApplicationRoute.Files:
    case ApplicationRoute.AssetsApplications:
    case ApplicationRoute.AssetsToolsets:
    case ApplicationRoute.Skills: {
      const path = version
        ? `${(data as DialPrompt).folderId}${(data as DialPrompt).name}__${version}`
        : (data as DialPrompt).path ||
          `${(data as DialPrompt).folderId}${(data as DialPrompt).name}__${(data as DialPrompt).version}`;

      return forRemove
        ? decodeURIComponent(escapePercentSign(path))
        : `${encodeURIComponent((data as DialPrompt).name as string)}?path=${encodeURIComponent(path)}`;
    }

    case ApplicationRoute.PlatformModels:
    case ApplicationRoute.PlatformAppRunners:
    case ApplicationRoute.PlatformInterceptors:
    case ApplicationRoute.PlatformRoutes:
    case ApplicationRoute.PlatformRoles:
    case ApplicationRoute.PlatformKeys: {
      // Flat platform entities: `parseEncodedFlatPath` always yields `path === name`, so the `[id]`
      // segment alone identifies the resource. No `?path=` needed.
      const { name, $id } = data as { name?: string; $id?: string };
      // $id falls back here raw (not pre-encoded) so it goes through the same single
      // `encodeURIComponent` below that the `name` branch relies on — row-click navigation reads
      // the grid row's already-decoded `name`, so both entry points must produce the same segment.
      const resolvedName = name || $id || '';

      return forRemove ? decodeURIComponent(escapePercentSign(resolvedName)) : encodeURIComponent(resolvedName);
    }

    case ApplicationRoute.PromptPublications:
    case ApplicationRoute.FilePublications:
    case ApplicationRoute.ApplicationPublications:
    case ApplicationRoute.ToolsetPublications:
    case ApplicationRoute.ConversationPublications:
    case ApplicationRoute.SkillPublications:
      return `${encodeURIComponent((data as Publication).requestName)}?path=${(data as Publication).path}`;

    case ApplicationRoute.ActivityAudit:
      return (data as DialActivity).activityId;

    case ApplicationRoute.McpContainers:
    case ApplicationRoute.InterceptorContainers:
    case ApplicationRoute.ModelServings:
      return `${encodeURIComponent((data as { name: string }).name)}`;
    case ApplicationRoute.Images:
    case ApplicationRoute.TestSuites:
    case ApplicationRoute.TestCases:
    case ApplicationRoute.Datasets:
    case ApplicationRoute.AnalyticsQueries:
      return `${encodeURIComponent((data as { id: string }).id)}`;
    case ApplicationRoute.Runs: {
      const { id, testRunName } = data as { id: string; testRunName?: string };
      if (forRemove) {
        return `${encodeURIComponent(id)}`;
      }
      return `${encodeURIComponent(testRunName || id)}?id=${encodeURIComponent(id)}`;
    }
    case ApplicationRoute.RunsCompare: {
      const { id, compareWithId } = data as { id: string; compareWithId: string };
      return getCompareRunsPath(id, compareWithId);
    }

    default:
      return encodeURIComponent((data as BaseEntity).name || '');
  }
};

export const getEntityAuditFilterId = (
  entity?: BaseEntity | DialApplicationScheme | { id?: string; name?: string },
): string | undefined =>
  (entity as DialApplicationScheme | undefined)?.$id ||
  (entity as { id?: string } | undefined)?.id ||
  (entity as BaseEntity | undefined)?.name;
