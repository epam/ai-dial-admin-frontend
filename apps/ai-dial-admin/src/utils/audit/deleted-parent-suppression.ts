import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';

/**
 * Activities already resolved during one list pass, keyed by their own `activityId`.
 * Both a row that arrived in a page and a row fetched by the parent lookup go in here.
 */
export type ResolvedActivities = Record<string, DialActivity>;

/**
 * The parent identifiers of `rows` that no resolved activity answers for yet — distinct,
 * in first-seen order, skipping rows that carry no parent.
 *
 * Callers use this to decide whether a parent lookup is needed at all: an empty result
 * means the page can be filtered without a request.
 *
 * @param {DialActivity[]} rows - the page's activities
 * @param {ResolvedActivities} resolved - activities resolved so far in this list pass
 * @returns {string[]} distinct parent identifiers still to resolve
 */
export const getUnresolvedParentIds = (rows: DialActivity[], resolved: ResolvedActivities): string[] => {
  const ids: string[] = [];

  rows.forEach(({ parentActivityId }) => {
    if (!parentActivityId || resolved[parentActivityId] || ids.includes(parentActivityId)) {
      return;
    }
    ids.push(parentActivityId);
  });

  return ids;
};

/**
 * Whether an activity is one of the per-column children a table `Delete` records.
 *
 * Nothing on the child distinguishes it from a column dropped out of a table that still
 * exists — both are a `TableColumn` `Delete` naming a parent — so the answer comes entirely
 * from the resolved parent: a `Table` activity whose own type is `Delete`. A column dropped
 * from a living table has a `Table` `Update` parent and is therefore kept.
 *
 * Deliberately false when the parent is not resolved: a row is hidden only on positive
 * evidence about its parent, never on the absence of it.
 *
 * @param {DialActivity} activity - the activity being considered for the list
 * @param {ResolvedActivities} resolved - activities resolved so far in this list pass
 * @returns {boolean} true only when the resolved parent is a table deletion
 */
export const isChildOfDeletedTable = (activity: DialActivity, resolved: ResolvedActivities): boolean => {
  const parentActivityId = activity.parentActivityId;
  if (!parentActivityId) {
    return false;
  }

  const parent = resolved[parentActivityId];
  if (!parent) {
    return false;
  }

  return parent.resourceType === ActivityAuditResourceType.TABLE && parent.activityType === ActivityAuditType.Delete;
};

/**
 * The rows of a page that the list should show: every row except the per-column children
 * of a deleted table.
 *
 * @param {DialActivity[]} rows - the page's activities
 * @param {ResolvedActivities} resolved - activities resolved so far in this list pass
 * @returns {DialActivity[]} the rows to buffer, in their original order
 */
export const filterOutDeletedTableChildren = (rows: DialActivity[], resolved: ResolvedActivities): DialActivity[] =>
  rows.filter((activity) => !isChildOfDeletedTable(activity, resolved));
