import { DlqStage } from '@/src/models/analytics/pipeline-dlq';

/**
 * One page of the failures grid, and what a scroll to the bottom — or the control beside it — asks
 * for again.
 *
 * Small on purpose: the grid is a bounded box inside a card, so a page larger than it can show is work
 * nobody asked for. The service clamps the parameter to 1..1000 and defaults it to 100.
 */
export const DLQ_PAGE_SIZE = 20;

/**
 * What the card's summary asks for. The counts come from the service and describe the whole filter, not
 * the page, so the smallest legal page is enough — one row rather than none, because the parameter is
 * clamped to a minimum of one.
 */
export const DLQ_SUMMARY_LIMIT = 1;

/**
 * One background token per stage, for the dot beside the stage name in the grid.
 *
 * Tokens rather than hexes so a theme re-colours them with everything else — the two group stages take
 * the orange and yellow of the Monaco palette, which the query builder already uses for the same reason.
 * The dot is `aria-hidden`: the stage's own name sits next to it.
 */
export const DLQ_STAGE_COLOR: Record<DlqStage, string> = {
  [DlqStage.InputMap]: 'bg-accent-secondary',
  [DlqStage.DialCall]: 'bg-accent-primary',
  [DlqStage.Validate]: 'bg-yellow-400',
  [DlqStage.OutputMap]: 'bg-accent-tertiary',
  [DlqStage.Upsert]: 'bg-red-400',
  [DlqStage.GroupFetch]: 'bg-orange-400',
  [DlqStage.GroupMap]: 'bg-secondary',
};

/** The tallest the failures grid grows before it scrolls itself: enough rows to scan, still a card. */
export const DLQ_GRID_MAX_HEIGHT_PX = 600;
