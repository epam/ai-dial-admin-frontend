import { UsageScope } from '@/src/components/Analytics/Usage/models';
import { TOOLSET_DEPLOYMENT_PREFIX } from '@/src/constants/telemetry';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { QueryExpr, QueryExprType, QueryFilterNode, QueryOperator, QueryValueType } from '@/src/models/analytics/query';
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

const text = (value: string): QueryExpr => ({ type: QueryExprType.Value, value_type: QueryValueType.String, value });
const field = (name: string): QueryExpr => ({ type: QueryExprType.Field, name });

const columnIs = (column: string, name: string): QueryFilterNode => ({
  op: QueryOperator.Eq,
  args: [field(column), text(name)],
});

const columnIsNot = (column: string, name: string): QueryFilterNode => ({
  op: QueryOperator.Ne,
  args: [field(column), text(name)],
});

/** A boolean call is a filter predicate only as a comparison with `true`, as the service renders one. */
const isTrue = (call: QueryExpr): QueryFilterNode => ({
  op: QueryOperator.Eq,
  args: [call, { type: QueryExprType.Value, value_type: QueryValueType.Boolean, value: 'true' }],
});

/**
 * Every row the application set off, at any depth: `execution_path` is the chain of deployments a
 * request passed through, so a model called by an application the application called still names it.
 */
const inCallTree = (name: string): QueryFilterNode =>
  isTrue({ type: QueryExprType.Fn, name: 'array_has', args: [field('execution_path'), text(name)] });

/** A row with a price of its own: a model call, the only kind that is priced. */
const isPriced = (): QueryFilterNode =>
  isTrue({
    type: QueryExprType.Fn,
    name: 'not_empty',
    args: [{ type: QueryExprType.Fn, name: 'to_string', args: [field('deployment_price')] }],
  });

/**
 * The rows an entity's dashboard reads (`UsageScope` says what each set holds); only an application
 * has a call tree.
 *
 * An entity with no name to match reads nothing rather than everything: an empty scope would show
 * the whole log under one entity's heading.
 */
export const buildEntityScope = (route: ApplicationRoute, name: string | null): UsageScope | null => {
  if (!name) {
    return null;
  }

  return APPLICATION_ROUTES.includes(route)
    ? {
        own: [columnIs('deployment', name)],
        made: [inCallTree(name), isPriced()],
        tools: [inCallTree(name), columnIsNot('deployment', name)],
      }
    : { own: [columnIs('deployment', name)] };
};
