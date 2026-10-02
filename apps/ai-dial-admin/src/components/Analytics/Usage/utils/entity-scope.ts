import { UsageScope } from '@/src/components/Analytics/Usage/models';
import { TOOLSET_DEPLOYMENT_PREFIX } from '@/src/constants/telemetry';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { QueryExprType, QueryFilterNode, QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { encodeCorePath } from '@/src/server/publications/path';
import { ApplicationRoute } from '@/src/types/routes';

/**
 * What an asset is called in the usage log: its kind, then its bucket path with each segment
 * URI-encoded — `toolsets/<bucket>/QA%20editor__0.0.1`, the form Core addresses it by.
 */
const ASSET_DEPLOYMENT_PREFIX: Partial<Record<ApplicationRoute, string>> = {
  [ApplicationRoute.AssetsToolsets]: TOOLSET_DEPLOYMENT_PREFIX,
  [ApplicationRoute.AssetsApplications]: 'applications/',
};

const APPLICATION_ROUTES: ApplicationRoute[] = [ApplicationRoute.Applications, ApplicationRoute.AssetsApplications];

/** The name the usage log records an entity's calls under, or null where it has none to match. */
export const getEntityDeploymentName = (route: ApplicationRoute, entity?: BaseEntity): string | null => {
  const prefix = ASSET_DEPLOYMENT_PREFIX[route];

  if (prefix) {
    const path = (entity as { path?: string } | undefined)?.path;
    return path ? `${prefix}${encodeCorePath(path)}` : null;
  }

  return entity?.name || null;
};

const columnIs = (column: string, name: string): QueryFilterNode => ({
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field, name: column },
    { type: QueryExprType.Value, value_type: QueryValueType.String, value: name },
  ],
});

/**
 * The rows an entity's dashboard reads. Every entity's own rows are the calls made to it; an
 * application also made calls of its own — to models, to tools — which its `made` clause reads.
 *
 * An entity with no name to match reads nothing rather than everything: an empty scope would show
 * the whole log under one entity's heading.
 */
export const buildEntityScope = (route: ApplicationRoute, name: string | null): UsageScope | null => {
  if (!name) {
    return null;
  }

  return APPLICATION_ROUTES.includes(route)
    ? { own: [columnIs('deployment', name)], made: [columnIs('parent_deployment', name)] }
    : { own: [columnIs('deployment', name)] };
};
