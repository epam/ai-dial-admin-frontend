import { ENTITY_BLOCKS, VIEW_BREAKDOWN_TABS } from '@/src/components/Analytics/Usage/constants';
import { BlockReads, BreakdownTab, EntityBlock, RowScope, UsageScope } from '@/src/components/Analytics/Usage/models';
import { ApplicationRoute } from '@/src/types/routes';

/** Whether an entity declares routes: a list on an admin application, a map on an asset one. */
export const hasDeclaredRoutes = (entity?: { routes?: unknown }): boolean => {
  const routes = entity?.routes;

  if (Array.isArray(routes)) {
    return routes.length > 0;
  }

  return routes != null && typeof routes === 'object' && Object.keys(routes).length > 0;
};

/** The blocks an entity's dashboard renders; none for a route the usage dashboard does not serve. */
export const getEntityBlocks = (route: ApplicationRoute, isDeclaringRoutes = false): EntityBlock[] =>
  (ENTITY_BLOCKS[route] ?? []).filter((block) => !block.isRoutesOnly || isDeclaringRoutes);

/** Whether the usage dashboard serves this route's Audit tab at all. */
export const hasEntityDashboard = (route: ApplicationRoute): boolean => (ENTITY_BLOCKS[route] ?? []).length > 0;

/** A block's tabs, in its view's order, less the one it hides. */
export const getBlockTabs = (block: EntityBlock): BreakdownTab[] =>
  VIEW_BREAKDOWN_TABS[block.view].filter((tab) => tab !== block.hiddenTab);

export interface BlockRows {
  /** The rows the block's own figures read: KPI row, plots, heatmap and every tab not read from `made`. */
  rows: RowScope;
  /** The calls the entity made, where the block reads any figure from them; null where it reads none. */
  madeRows: RowScope | null;
}

/** Resolves a scope into the rows each of a block's requests carries. */
export const resolveBlockRows = (scope: UsageScope, reads: BlockReads = {}): BlockRows => {
  if (reads.isToolsOnly && scope.tools) {
    return { rows: { entityClauses: scope.tools }, madeRows: null };
  }

  const isMadeRead = Boolean(reads.madeTabs?.length || reads.isMoneyFromMade);

  return {
    rows: { entityClauses: scope.own },
    madeRows: isMadeRead && scope.made ? { entityClauses: scope.made } : null,
  };
};
