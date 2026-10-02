import { ENTITY_BLOCKS, VIEW_BREAKDOWN_TABS } from '@/src/components/Analytics/Usage/constants';
import { BreakdownTab, EntityBlock } from '@/src/components/Analytics/Usage/models';
import { ApplicationRoute } from '@/src/types/routes';

/** The blocks an entity's dashboard renders; none for a route the usage dashboard does not serve. */
export const getEntityBlocks = (route: ApplicationRoute): EntityBlock[] => ENTITY_BLOCKS[route] ?? [];

/** Whether the usage dashboard serves this route's Audit tab at all. */
export const hasEntityDashboard = (route: ApplicationRoute): boolean => getEntityBlocks(route).length > 0;

/** A block's tabs, in its view's order, less the one it hides. */
export const getBlockTabs = (block: EntityBlock): BreakdownTab[] =>
  VIEW_BREAKDOWN_TABS[block.view].filter((tab) => tab !== block.hiddenTab);
