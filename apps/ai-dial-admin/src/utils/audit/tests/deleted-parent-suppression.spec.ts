import { describe, expect, test } from 'vitest';

import {
  filterOutDeletedTableChildren,
  getUnresolvedParentIds,
  isChildOfDeletedTable,
  ResolvedActivities,
} from '@/src/utils/audit/deleted-parent-suppression';
import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';

const activity = (overrides: Partial<DialActivity> = {}): DialActivity =>
  ({
    activityId: 'activity-1',
    activityType: ActivityAuditType.Delete,
    resourceType: ActivityAuditResourceType.TABLE_COLUMN,
    resourceId: 'orders:total',
    epochTimestampMs: 1,
    revision: 59,
    ...overrides,
  }) as DialActivity;

const tableDelete = activity({
  activityId: 'parent-delete',
  activityType: ActivityAuditType.Delete,
  resourceType: ActivityAuditResourceType.TABLE,
  resourceId: 'orders',
});

const tableUpdate = activity({
  activityId: 'parent-update',
  activityType: ActivityAuditType.Update,
  resourceType: ActivityAuditResourceType.TABLE,
  resourceId: 'orders',
});

const resolved: ResolvedActivities = {
  [tableDelete.activityId]: tableDelete,
  [tableUpdate.activityId]: tableUpdate,
};

describe('Audit :: getUnresolvedParentIds', () => {
  test('returns the parent identifier a row names when nothing is resolved yet', () => {
    expect(getUnresolvedParentIds([activity({ parentActivityId: 'parent-delete' })], {})).toEqual(['parent-delete']);
  });

  test('returns each parent identifier once however many rows name it', () => {
    const rows = [
      activity({ activityId: 'c1', parentActivityId: 'p1' }),
      activity({ activityId: 'c2', parentActivityId: 'p1' }),
      activity({ activityId: 'c3', parentActivityId: 'p2' }),
    ];

    expect(getUnresolvedParentIds(rows, {})).toEqual(['p1', 'p2']);
  });

  test('skips a parent already resolved so it is never requested twice', () => {
    const rows = [
      activity({ activityId: 'c1', parentActivityId: 'parent-delete' }),
      activity({ activityId: 'c2', parentActivityId: 'p-new' }),
    ];

    expect(getUnresolvedParentIds(rows, resolved)).toEqual(['p-new']);
  });

  test('skips rows that carry no parent identifier', () => {
    const rows = [tableDelete, activity({ activityId: 'c1', parentActivityId: 'p1' })];

    expect(getUnresolvedParentIds(rows, {})).toEqual(['p1']);
  });

  test('returns nothing for a page whose rows all name no parent, so no lookup is needed', () => {
    expect(getUnresolvedParentIds([tableDelete, tableUpdate], {})).toEqual([]);
  });

  test('returns nothing for a page whose parents all arrived in the same page', () => {
    const rows = [tableDelete, activity({ activityId: 'c1', parentActivityId: 'parent-delete' })];

    expect(getUnresolvedParentIds(rows, resolved)).toEqual([]);
  });

  test('returns nothing for an empty page', () => {
    expect(getUnresolvedParentIds([], resolved)).toEqual([]);
  });
});

describe('Audit :: isChildOfDeletedTable', () => {
  test('answers true for a column activity whose resolved parent is a table deletion', () => {
    expect(isChildOfDeletedTable(activity({ parentActivityId: 'parent-delete' }), resolved)).toBe(true);
  });

  test('answers false for a column dropped from a table that still exists', () => {
    expect(isChildOfDeletedTable(activity({ parentActivityId: 'parent-update' }), resolved)).toBe(false);
  });

  test('answers false for an activity that carries no parent identifier', () => {
    expect(isChildOfDeletedTable(tableDelete, resolved)).toBe(false);
  });

  test('answers false when the parent is absent from the resolved activities', () => {
    expect(isChildOfDeletedTable(activity({ parentActivityId: 'never-answered' }), resolved)).toBe(false);
  });

  test('answers false when nothing has been resolved at all', () => {
    expect(isChildOfDeletedTable(activity({ parentActivityId: 'parent-delete' }), {})).toBe(false);
  });

  test('answers false when the parent is a deletion of something other than a table', () => {
    const pipelineDelete = activity({
      activityId: 'parent-pipeline',
      activityType: ActivityAuditType.Delete,
      resourceType: ActivityAuditResourceType.PIPELINE,
    });

    expect(
      isChildOfDeletedTable(activity({ parentActivityId: 'parent-pipeline' }), {
        [pipelineDelete.activityId]: pipelineDelete,
      }),
    ).toBe(false);
  });

  test('answers false when the parent is a table activity of any other type', () => {
    [ActivityAuditType.Create, ActivityAuditType.Update, ActivityAuditType.Rollback].forEach((activityType) => {
      const parent = activity({
        activityId: 'parent-other',
        activityType,
        resourceType: ActivityAuditResourceType.TABLE,
      });

      expect(
        isChildOfDeletedTable(activity({ parentActivityId: 'parent-other' }), { [parent.activityId]: parent }),
      ).toBe(false);
    });
  });

  test('keys on the parent alone, so a parent table deletion suppresses a child of any resource type', () => {
    expect(
      isChildOfDeletedTable(
        activity({ resourceType: ActivityAuditResourceType.TABLE, parentActivityId: 'parent-delete' }),
        resolved,
      ),
    ).toBe(true);
  });
});

describe('Audit :: filterOutDeletedTableChildren', () => {
  test('keeps the table deletion and drops every one of its column children', () => {
    const rows = [
      tableDelete,
      activity({ activityId: 'c1', resourceId: 'orders:total', parentActivityId: 'parent-delete' }),
      activity({ activityId: 'c2', resourceId: 'orders:id', parentActivityId: 'parent-delete' }),
      activity({ activityId: 'c3', resourceId: 'orders:name', parentActivityId: 'parent-delete' }),
    ];

    expect(filterOutDeletedTableChildren(rows, resolved).map((row) => row.activityId)).toEqual(['parent-delete']);
  });

  test('keeps a column dropped from a living table alongside its parent update', () => {
    const rows = [tableUpdate, activity({ activityId: 'c1', parentActivityId: 'parent-update' })];

    expect(filterOutDeletedTableChildren(rows, resolved).map((row) => row.activityId)).toEqual(['parent-update', 'c1']);
  });

  test('keeps a child whose parent could not be resolved', () => {
    const rows = [activity({ activityId: 'c1', parentActivityId: 'never-answered' })];

    expect(filterOutDeletedTableChildren(rows, resolved).map((row) => row.activityId)).toEqual(['c1']);
  });

  test('preserves the order of the rows it keeps', () => {
    const rows = [
      activity({ activityId: 'a' }),
      activity({ activityId: 'b', parentActivityId: 'parent-delete' }),
      activity({ activityId: 'c', parentActivityId: 'parent-update' }),
      activity({ activityId: 'd' }),
    ];

    expect(filterOutDeletedTableChildren(rows, resolved).map((row) => row.activityId)).toEqual(['a', 'c', 'd']);
  });

  test('returns every row when nothing has been resolved', () => {
    const rows = [tableDelete, activity({ activityId: 'c1', parentActivityId: 'parent-delete' })];

    expect(filterOutDeletedTableChildren(rows, {})).toEqual(rows);
  });

  test('returns an empty list for an empty page', () => {
    expect(filterOutDeletedTableChildren([], resolved)).toEqual([]);
  });
});
