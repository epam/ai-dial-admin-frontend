import {
  DialActivity,
  DialActivityGroupRow,
  ImportActivities,
  ImportGroupingResult,
} from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';

// Namespaced so the client-built row can never collide with a real (UUID) activity id.
const IMPORT_GROUP_ID_PREFIX = 'import:';

export const getImportGroupRowId = (importId: string): string => `${IMPORT_GROUP_ID_PREFIX}${importId}`;

/**
 * The import identifiers on `rows` that have not been grouped yet in this list pass — distinct, in first-seen
 * order. An empty result means the page needs no group request.
 */
export const getUngroupedImportIds = (rows: DialActivity[], emitted: ReadonlySet<string>): string[] => {
  const ids: string[] = [];
  rows.forEach(({ importId }) => {
    if (importId && !emitted.has(importId) && !ids.includes(importId)) {
      ids.push(importId);
    }
  });
  return ids;
};

/**
 * One import as a parent row with its activities beneath it, in the shape the admin Import row has. A child is
 * attached to the group only when it has no parent of its own, so a column keeps pointing at its table.
 */
export const buildImportGroupRow = (importId: string, activities: DialActivity[]): DialActivityGroupRow => {
  const id = getImportGroupRowId(importId);
  const latest = activities.reduce<DialActivity | undefined>(
    (current, activity) => (!current || activity.epochTimestampMs > current.epochTimestampMs ? activity : current),
    void 0,
  );

  return {
    activityId: id,
    activityType: ActivityAuditType.Import,
    // The admin parent names `Config`, which means nothing in the Analytics feed; the group has no resource.
    resourceType: '' as ActivityAuditResourceType,
    resourceId: '',
    epochTimestampMs: latest?.epochTimestampMs ?? 0,
    revision: latest?.revision ?? 0,
    initiatedAuthor: latest?.initiatedAuthor ?? '',
    initiatedEmail: latest?.initiatedEmail ?? '',
    importId,
    children: activities.map((activity) =>
      activity.parentActivityId ? activity : { ...activity, parentActivityId: id },
    ),
    expanded: true,
    canToggleExpand: false,
  };
};

/**
 * The page's rows with each import collapsed into one group of every activity fetched for it, placed where the pass
 * first meets the import. A row of an import already emitted in this pass is dropped, so an import spanning pages
 * is listed once; the caller adds the returned `emittedImportIds` to `emitted`. An import with no fetched
 * activities — its request failed — is listed flat, as without grouping, so a failure never hides a row.
 */
export const groupImportActivities = (
  rows: DialActivity[],
  importActivities: ImportActivities,
  emitted: ReadonlySet<string>,
): ImportGroupingResult => {
  const listed: DialActivity[] = [];
  const emittedImportIds: string[] = [];

  rows.forEach((row) => {
    const activities = row.importId ? importActivities[row.importId] : void 0;
    if (!row.importId || !activities) {
      listed.push(row);
      return;
    }
    if (emitted.has(row.importId) || emittedImportIds.includes(row.importId)) {
      return;
    }
    emittedImportIds.push(row.importId);
    const group = buildImportGroupRow(row.importId, activities);
    listed.push(group, ...group.children);
  });

  return { rows: listed, emittedImportIds };
};
