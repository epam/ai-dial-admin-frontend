import { getCompareRunsPath } from '@/src/components/Runs/Compare/utils';
import { ApplicationRoute } from '@/src/types/routes';
import { DialActivity } from '@/src/models/activity-audit';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';
import { Publication } from '@/src/models/dial/publications';
import { isPlatformBucketPath, PLATFORM_ROOT_FOLDER } from '@/src/utils/files/root-folder';

export const escapePercentSign = (str: string): string => {
  return str.replace(/%/g, '%25');
};

/**
 * Appends a bare query parameter to a built entity URL with the separator the URL requires — `&`
 * when it already carries a `?`, `?` otherwise. Concatenating a leading-`?` suffix blindly produced
 * a second `?` (encoded by the router as `%3F…`) on query-carrying routes (Issue #4590);
 * `Assets/Resources/utils.ts`'s `setUrl` is the same check for the toolset-auth redirect.
 */
export const appendUrlQuery = (url: string, query: string): string => `${url}${url.includes('?') ? '&' : '?'}${query}`;

export const onOpenInNewTab = (route?: ApplicationRoute, entity?: unknown, urlSuffix?: string) => {
  const urn = getUrnForEntity(route, entity);
  const url = urlSuffix ? appendUrlQuery(urn, urlSuffix) : urn;
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
    case ApplicationRoute.Skills: {
      const path = version
        ? `${(data as DialPrompt).folderId}${(data as DialPrompt).name}__${version}`
        : (data as DialPrompt).path ||
          `${(data as DialPrompt).folderId}${(data as DialPrompt).name}__${(data as DialPrompt).version}`;

      return forRemove
        ? decodeURIComponent(escapePercentSign(path))
        : `${encodeURIComponent((data as DialPrompt).name as string)}?path=${encodeURIComponent(path)}`;
    }

    // Applications and Toolsets are the views whose resources live in both buckets (design.md's
    // `platform-applications`/`platform-toolsets` capabilities). Both share their existing
    // `/assets-applications/[id]`/`/assets-toolsets/[id]` detail route — a platform-bucket row has no
    // version and no folder tree, so it gets the flat `PlatformModels`-style segment below (bare
    // name, no `?path=`); the query param's presence is exactly what the detail page uses to tell the
    // two buckets apart. A row with neither `path` nor `folderId` is in neither bucket — the
    // config-file list's `{name}`-only row (`config-file-entity-views`) — and resolves flat too:
    // every browser row carries a `folderId`, and the fabricated `undefined{name}__undefined` path
    // this shape used to produce 404s the detail page (Issue #4590).
    case ApplicationRoute.AssetsApplications:
    case ApplicationRoute.AssetsToolsets: {
      const entity = data as DialPrompt & { folderId?: string; path?: string };

      if (isPlatformBucketPath(entity.path || entity.folderId)) {
        // `forRemove` must still resolve to the resource's storage path (`platform/{name}`) — Core
        // has no route for a bare name — unlike the URL-segment case just below, where the bucket
        // prefix is deliberately dropped for a readable URL (design.md D5).
        const resolvedPath = entity.path || `${PLATFORM_ROOT_FOLDER}/${entity.name || ''}`;
        return forRemove ? decodeURIComponent(escapePercentSign(resolvedPath)) : encodeURIComponent(entity.name || '');
      }

      if (entity.path == null && entity.folderId == null) {
        return forRemove
          ? decodeURIComponent(escapePercentSign(entity.name || ''))
          : encodeURIComponent(entity.name || '');
      }

      const path = version
        ? `${entity.folderId}${entity.name}__${version}`
        : entity.path || `${entity.folderId}${entity.name}__${entity.version}`;

      return forRemove
        ? decodeURIComponent(escapePercentSign(path))
        : `${encodeURIComponent(entity.name as string)}?path=${encodeURIComponent(path)}`;
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
