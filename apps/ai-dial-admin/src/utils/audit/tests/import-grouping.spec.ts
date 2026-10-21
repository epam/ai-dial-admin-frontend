import { describe, expect, test } from 'vitest';

import { DialActivity, DialActivityGroupRow } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';
import {
  buildImportGroupRow,
  getImportGroupRowId,
  getUngroupedImportIds,
  groupImportActivities,
} from '@/src/utils/audit/import-grouping';

const activity = (overrides: Partial<DialActivity>): DialActivity => ({
  activityId: 'a',
  activityType: ActivityAuditType.Create,
  resourceType: ActivityAuditResourceType.TABLE,
  resourceId: 'usage_sentiment',
  epochTimestampMs: 1,
  initiatedAuthor: 'Ann',
  initiatedEmail: 'ann@example.com',
  revision: 1,
  ...overrides,
});

describe('getUngroupedImportIds', () => {
  test('returns distinct import ids in first-seen order, skipping emitted ones and rows without an import', () => {
    const rows = [
      activity({ activityId: '1', importId: 'i-2' }),
      activity({ activityId: '2' }),
      activity({ activityId: '3', importId: 'i-1' }),
      activity({ activityId: '4', importId: 'i-2' }),
      activity({ activityId: '5', importId: 'i-3' }),
    ];

    expect(getUngroupedImportIds(rows, new Set(['i-3']))).toEqual(['i-2', 'i-1']);
  });
});

describe('buildImportGroupRow', () => {
  test("builds an expanded, non-collapsible Import row timed by the import's latest activity", () => {
    const group = buildImportGroupRow('i-1', [
      activity({ activityId: '1', epochTimestampMs: 5, revision: 3 }),
      activity({ activityId: '2', epochTimestampMs: 9, revision: 4, initiatedAuthor: 'Bob' }),
    ]);

    expect(group).toEqual(
      expect.objectContaining({
        activityId: getImportGroupRowId('i-1'),
        activityType: ActivityAuditType.Import,
        resourceId: '',
        epochTimestampMs: 9,
        revision: 4,
        initiatedAuthor: 'Bob',
        importId: 'i-1',
        expanded: true,
        canToggleExpand: false,
      }),
    );
  });

  test('attaches a child to the group only when it has no parent of its own', () => {
    const group = buildImportGroupRow('i-1', [
      activity({ activityId: 'table' }),
      activity({ activityId: 'column', parentActivityId: 'table' }),
    ]);

    expect(group.children.map((c) => c.parentActivityId)).toEqual([getImportGroupRowId('i-1'), 'table']);
  });
});

describe('groupImportActivities', () => {
  test('replaces the first row of an import with its whole group and keeps other rows in place', () => {
    const rows = [
      activity({ activityId: 'plain-1' }),
      activity({ activityId: 'p1', importId: 'i-1' }),
      activity({ activityId: 'plain-2' }),
      activity({ activityId: 'p2', importId: 'i-1' }),
    ];
    const fetched = [
      activity({ activityId: 'p1', importId: 'i-1' }),
      activity({ activityId: 'p2', importId: 'i-1' }),
      activity({ activityId: 'p3', importId: 'i-1' }),
    ];

    const result = groupImportActivities(rows, { 'i-1': fetched }, new Set());

    expect(result.rows.map((r) => r.activityId)).toEqual([
      'plain-1',
      getImportGroupRowId('i-1'),
      'p1',
      'p2',
      'p3',
      'plain-2',
    ]);
    expect(result.emittedImportIds).toEqual(['i-1']);
    expect((result.rows[1] as DialActivityGroupRow).children).toHaveLength(3);
  });

  test('drops the rows of an import already emitted on an earlier page', () => {
    const rows = [activity({ activityId: 'p4', importId: 'i-1' }), activity({ activityId: 'plain' })];

    const result = groupImportActivities(rows, { 'i-1': [rows[0]] }, new Set(['i-1']));

    expect(result.rows.map((r) => r.activityId)).toEqual(['plain']);
    expect(result.emittedImportIds).toEqual([]);
  });

  test('lists an import flat, emitting no group, when its activities were not fetched', () => {
    const rows = [activity({ activityId: 'p1', importId: 'i-1' }), activity({ activityId: 'p2', importId: 'i-1' })];

    const result = groupImportActivities(rows, {}, new Set());

    expect(result.rows).toEqual(rows);
    expect(result.emittedImportIds).toEqual([]);
  });

  test('leaves a page with no import untouched', () => {
    const rows = [activity({ activityId: '1' }), activity({ activityId: '2' })];

    expect(groupImportActivities(rows, {}, new Set()).rows).toEqual(rows);
  });
});
