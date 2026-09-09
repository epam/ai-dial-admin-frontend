import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { CompareI18nKey } from '@/src/constants/i18n';
import { ActivityAuditDiff, ActivityAuditSection } from '@/src/models/activity-audit';
import { ActivityAuditEntity, DiffStatus } from '@/src/types/activity-audit';
import { describe, expect, test, vi } from 'vitest';
import {
  ANALYTICS_COLUMN_PARAMETERS,
  buildAnalyticsDiff,
  columnRows,
  getAnalyticsColumnHeading,
  getColumnBucketKey,
  getColumnGroupStatus,
  getColumnNameFromBucketKey,
  hasAnalyticsColumnBuckets,
  isColumnBucketKey,
  omitAnalyticsColumnBuckets,
  setAnalyticsColumnDiffs,
  snapshotRows,
} from '../analytics-diffs';

const parametersOf = (rows?: { parameter: string }[]): string[] => (rows || []).map((row) => row.parameter);

const rowFor = (rows: ActivityAuditDiff[] | undefined, parameter: string): ActivityAuditDiff | undefined =>
  rows?.find((row) => row.parameter === parameter);

const olderTable: ActivityAuditEntity = {
  name: 'orders',
  description: 'Order facts',
  type: 'FACT',
  source_table: 'raw.orders',
  status: 'ACTIVE',
  system: false,
  ordering_key: ['created_at', 'id'],
  partition_by: { granularity: 'DAY', column: 'created_at' },
  grain: { grain_key: 'order_id' },
  identity_column: 'id',
  version_column: 'updated_at',
  tag_order: ['pii', 'internal'],
  columns: [
    { name: 'amount', type: 'DECIMAL', nullable: false, sensitive: false },
    { name: 'legacy_id', type: 'STRING' },
  ],
};

// Newer revision: adds `total`, drops `legacy_id`, marks `amount` sensitive.
const newerTable: ActivityAuditEntity = {
  ...olderTable,
  columns: [
    { name: 'total', type: 'DECIMAL' },
    { name: 'amount', type: 'DECIMAL', nullable: false, sensitive: true },
  ],
};

// AuditView convention: BEFORE pass renders the older revision, AFTER pass the newer one.
const beforePass = (newer: ActivityAuditEntity | null, older: ActivityAuditEntity | null) =>
  buildAnalyticsDiff(newer, older, true);
const afterPass = (older: ActivityAuditEntity | null, newer: ActivityAuditEntity | null) =>
  buildAnalyticsDiff(older, newer, false);

describe('Activity audit :: snapshotRows', () => {
  test('emits one row per scalar field with the snapshot value', () => {
    const rows = snapshotRows({ name: 'orders', status: 'ACTIVE', system: false });

    expect(rows).toEqual([
      { parameter: 'name', value: 'orders' },
      { parameter: 'status', value: 'ACTIVE' },
      { parameter: 'system', value: 'false' },
    ]);
  });

  test('flattens a nested object into one row per leaf with a dotted parameter', () => {
    const rows = snapshotRows({ grain: { grain_key: 'order_id' }, partition_by: { granularity: 'DAY' } });

    expect(rows).toEqual([
      { parameter: 'grain.grain_key', value: 'order_id' },
      { parameter: 'partition_by.granularity', value: 'DAY' },
    ]);
  });

  test('joins a scalar array in the order the snapshot lists it and does not sort it', () => {
    const rows = snapshotRows({ ordering_key: ['created_at', 'id'], tag_order: ['pii', 'internal'] });

    expect(rowFor(rows as ActivityAuditDiff[], 'ordering_key')?.value).toBe('created_at, id');
    expect(rowFor(rows as ActivityAuditDiff[], 'tag_order')?.value).toBe('pii, internal');
  });

  test('never emits the columns field, which is grouped separately', () => {
    const rows = snapshotRows({ name: 'orders', columns: [{ name: 'amount' }] });

    expect(parametersOf(rows)).toEqual(['name']);
  });

  test('projects against a supplied parameter list so both sides of a comparison align', () => {
    const rows = snapshotRows({ name: 'orders' }, ['name', 'description']);

    expect(rows).toEqual([
      { parameter: 'name', value: 'orders' },
      { parameter: 'description', value: undefined },
    ]);
  });

  test('returns no rows for an absent snapshot', () => {
    expect(snapshotRows(null)).toEqual([]);
    expect(snapshotRows(undefined)).toEqual([]);
  });
});

describe('Activity audit :: columnRows', () => {
  test('emits every known column attribute in declared order', () => {
    expect(parametersOf(columnRows({ name: 'amount' }))).toEqual(ANALYTICS_COLUMN_PARAMETERS);
  });

  test('renders false and zero rather than dropping them', () => {
    const rows = columnRows({ name: 'amount', nullable: false, sensitive: false });

    expect(rowFor(rows as ActivityAuditDiff[], 'nullable')?.value).toBe('false');
    expect(rowFor(rows as ActivityAuditDiff[], 'sensitive')?.value).toBe('false');
  });

  test('joins enum values in the order the column lists them', () => {
    const rows = columnRows({ name: 'state', enum_values: ['new', 'done'] });

    expect(rowFor(rows as ActivityAuditDiff[], 'enum_values')?.value).toBe('new, done');
  });

  test('appends extra parameters so an attribute this repo does not model is still shown', () => {
    const rows = columnRows({ name: 'amount', precision: 12 }, ['precision']);

    expect(parametersOf(rows)).toEqual([...ANALYTICS_COLUMN_PARAMETERS, 'precision']);
    expect(rowFor(rows as ActivityAuditDiff[], 'precision')?.value).toBe('12');
  });

  test('emits undefined values for an absent column, keeping both sides aligned', () => {
    const rows = columnRows(undefined);

    expect(parametersOf(rows)).toEqual(ANALYTICS_COLUMN_PARAMETERS);
    expect(rows.every((row) => row.value === undefined)).toBe(true);
  });
});

describe('Activity audit :: buildAnalyticsDiff', () => {
  test('emits a properties row for every field of a table snapshot', () => {
    const result = afterPass(olderTable, newerTable);

    expect(parametersOf(result.properties)).toEqual([
      'name',
      'description',
      'grain.grain_key',
      'identity_column',
      'ordering_key',
      'partition_by.column',
      'partition_by.granularity',
      'source_table',
      'status',
      'system',
      'tag_order',
      'type',
      'version_column',
    ]);
  });

  test('keeps an ordered list field in the order the snapshot lists it', () => {
    const result = afterPass(olderTable, newerTable);

    expect(rowFor(result.properties, 'ordering_key')?.value).toBe('created_at, id');
    expect(rowFor(result.properties, 'tag_order')?.value).toBe('pii, internal');
  });

  test('creates one bucket per column present in either revision, ordered by name', () => {
    const result = afterPass(olderTable, newerTable);

    expect(Object.keys(result).filter(isColumnBucketKey)).toEqual([
      getColumnBucketKey('amount'),
      getColumnBucketKey('legacy_id'),
      getColumnBucketKey('total'),
    ]);
  });

  test('marks a column added in the newer revision as added on the side that carries it', () => {
    const result = afterPass(olderTable, newerTable);
    const bucket = result[getColumnBucketKey('total')];

    expect(rowFor(bucket, 'name')).toEqual({ parameter: 'name', value: 'total', diffStatus: DiffStatus.ADDED });
    expect(rowFor(bucket, 'type')?.diffStatus).toBe(DiffStatus.ADDED);
    expect(getColumnGroupStatus(bucket)).toBe(DiffStatus.ADDED);
  });

  test('keeps an added column visible as placeholder rows on the older side', () => {
    const result = beforePass(newerTable, olderTable);
    const bucket = result[getColumnBucketKey('total')];

    expect(bucket).toBeTruthy();
    expect(bucket.every((row) => row.diffStatus === DiffStatus.MIRROR)).toBe(true);
  });

  test('marks a column dropped in the newer revision as removed', () => {
    const result = afterPass(olderTable, newerTable);
    const bucket = result[getColumnBucketKey('legacy_id')];

    expect(rowFor(bucket, 'name')?.diffStatus).toBe(DiffStatus.REMOVED);
    expect(getColumnGroupStatus(bucket)).toBe(DiffStatus.REMOVED);
  });

  test('keeps a dropped column visible on the older side too', () => {
    const result = beforePass(newerTable, olderTable);
    const bucket = result[getColumnBucketKey('legacy_id')];

    expect(rowFor(bucket, 'name')?.value).toBe('legacy_id');
  });

  test('marks a changed attribute as changed and still emits the unchanged rows', () => {
    const result = afterPass(olderTable, newerTable);
    const bucket = result[getColumnBucketKey('amount')];

    expect(rowFor(bucket, 'sensitive')).toEqual({
      parameter: 'sensitive',
      value: 'true',
      pairedValue: 'false',
      diffStatus: DiffStatus.CHANGED,
    });
    expect(rowFor(bucket, 'name')).toEqual({ parameter: 'name', value: 'amount' });
    expect(rowFor(bucket, 'nullable')).toEqual({ parameter: 'nullable', value: 'false' });
    expect(getColumnGroupStatus(bucket)).toBe(DiffStatus.CHANGED);
  });

  test('renders a pipeline snapshot field by field with no column bucket', () => {
    const older: ActivityAuditEntity = { name: 'daily_rollup', schedule: '0 2 * * *', enabled: true };
    const newer: ActivityAuditEntity = { name: 'daily_rollup', schedule: '0 3 * * *', enabled: true };

    const result = afterPass(older, newer);

    expect(Object.keys(result)).toEqual([EntityParameterKeys.PROPERTIES]);
    expect(rowFor(result.properties, 'schedule')?.diffStatus).toBe(DiffStatus.CHANGED);
    expect(rowFor(result.properties, 'enabled')?.value).toBe('true');
  });

  test('returns only an empty properties bucket when the rendered side is absent', () => {
    expect(beforePass(newerTable, null)).toEqual({ [EntityParameterKeys.PROPERTIES]: [] });
    expect(buildAnalyticsDiff(null, null, false)).toEqual({ [EntityParameterKeys.PROPERTIES]: [] });
  });

  test('fills and stamps every row when the opposite side is absent', () => {
    const result = afterPass(null, newerTable);

    expect(result.properties.every((row) => row.diffStatus === DiffStatus.ADDED)).toBe(true);
    expect(result[getColumnBucketKey('total')].every((row) => row.diffStatus === DiffStatus.ADDED)).toBe(true);
  });

  test('stamps a filled older side as removed', () => {
    const result = beforePass(null, olderTable);

    expect(rowFor(result[getColumnBucketKey('legacy_id')], 'name')?.diffStatus).toBe(DiffStatus.REMOVED);
  });

  test('groups a nameless column entry by its index rather than dropping it', () => {
    const snapshot: ActivityAuditEntity = { name: 'orders', columns: [{ type: 'STRING' }] };

    const result = afterPass(snapshot, snapshot);

    expect(Object.keys(result).filter(isColumnBucketKey)).toEqual([getColumnBucketKey('#0')]);
  });
});

describe('Activity audit :: getColumnGroupStatus', () => {
  test('answers undefined for an unchanged column and for no rows', () => {
    expect(getColumnGroupStatus([{ parameter: 'name', value: 'amount' }])).toBeUndefined();
    expect(getColumnGroupStatus([])).toBeUndefined();
    expect(getColumnGroupStatus(undefined)).toBeUndefined();
  });

  test('answers changed when an attribute changed but the column itself did not', () => {
    const rows: ActivityAuditDiff[] = [
      { parameter: 'name', value: 'amount' },
      { parameter: 'description', value: '', diffStatus: DiffStatus.REMOVED },
    ];

    expect(getColumnGroupStatus(rows)).toBe(DiffStatus.CHANGED);
  });

  test('ignores placeholder rows', () => {
    const rows: ActivityAuditDiff[] = [
      { parameter: 'name', value: 'amount', diffStatus: DiffStatus.MIRROR },
      { parameter: 'type', value: 'DECIMAL', diffStatus: DiffStatus.MIRROR },
    ];

    expect(getColumnGroupStatus(rows)).toBeUndefined();
  });
});

describe('Activity audit :: column bucket keys', () => {
  test('builds, recognizes and parses a column bucket key', () => {
    const key = getColumnBucketKey('amount');

    expect(key).toBe('columns:amount');
    expect(isColumnBucketKey(key)).toBe(true);
    expect(isColumnBucketKey(EntityParameterKeys.PROPERTIES)).toBe(false);
    expect(getColumnNameFromBucketKey(key)).toBe('amount');
  });

  test('reports and omits column buckets, leaving other buckets untouched', () => {
    const diffMap: Record<string, ActivityAuditDiff[]> = {
      properties: [{ parameter: 'name', value: 'orders' }],
      [getColumnBucketKey('metadata')]: [{ parameter: 'name', value: 'metadata' }],
    };

    expect(hasAnalyticsColumnBuckets(diffMap)).toBe(true);
    expect(hasAnalyticsColumnBuckets({ properties: [] })).toBe(false);
    expect(omitAnalyticsColumnBuckets(diffMap)).toEqual({ properties: diffMap.properties });
  });
});

describe('Activity audit :: setAnalyticsColumnDiffs', () => {
  test('collects one entry per column name in name order, labelled by column name', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      [getColumnBucketKey('total')]: [{ parameter: 'name', value: 'total' }],
      [getColumnBucketKey('amount')]: [{ parameter: 'name', value: 'amount' }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      [getColumnBucketKey('total')]: [{ parameter: 'name', value: 'total' }],
      [getColumnBucketKey('amount')]: [{ parameter: 'name', value: 'amount' }],
    };
    const sections: ActivityAuditSection = {};

    setAnalyticsColumnDiffs(sections, current, compare);

    expect(sections[EntityParameterKeys.COLUMNS]).toEqual([
      {
        current: current[getColumnBucketKey('amount')],
        compare: compare[getColumnBucketKey('amount')],
        label: 'amount',
        diffStatus: undefined,
      },
      {
        current: current[getColumnBucketKey('total')],
        compare: compare[getColumnBucketKey('total')],
        label: 'total',
        diffStatus: undefined,
      },
    ]);
  });

  test('carries the group status of an added and of a removed column', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      [getColumnBucketKey('legacy_id')]: [{ parameter: 'name', value: 'legacy_id', diffStatus: DiffStatus.MIRROR }],
      [getColumnBucketKey('total')]: [{ parameter: 'name', value: '', diffStatus: DiffStatus.MIRROR }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      [getColumnBucketKey('legacy_id')]: [{ parameter: 'name', value: '', diffStatus: DiffStatus.REMOVED }],
      [getColumnBucketKey('total')]: [{ parameter: 'name', value: 'total', diffStatus: DiffStatus.ADDED }],
    };
    const sections: ActivityAuditSection = {};

    setAnalyticsColumnDiffs(sections, current, compare);

    expect(sections[EntityParameterKeys.COLUMNS].map((section) => section.label)).toEqual(['legacy_id', 'total']);
    expect(sections[EntityParameterKeys.COLUMNS].map((section) => section.diffStatus)).toEqual([
      DiffStatus.REMOVED,
      DiffStatus.ADDED,
    ]);
  });

  test('falls back to the older side when the newer side has no rows at all', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      [getColumnBucketKey('legacy_id')]: [{ parameter: 'name', value: 'legacy_id', diffStatus: DiffStatus.REMOVED }],
    };
    const sections: ActivityAuditSection = {};

    setAnalyticsColumnDiffs(sections, current, {});

    expect(sections[EntityParameterKeys.COLUMNS]).toEqual([
      {
        current: current[getColumnBucketKey('legacy_id')],
        compare: undefined,
        label: 'legacy_id',
        diffStatus: DiffStatus.REMOVED,
      },
    ]);
  });

  test('adds no section when there are no column buckets', () => {
    const sections: ActivityAuditSection = {};

    setAnalyticsColumnDiffs(sections, { properties: [] }, { properties: [] });

    expect(sections[EntityParameterKeys.COLUMNS]).toBeUndefined();
  });
});

describe('Activity audit :: getAnalyticsColumnHeading', () => {
  test('interpolates the column name into the group heading key', () => {
    const t = vi.fn(() => 'Column total');

    expect(getAnalyticsColumnHeading(t, 'total')).toBe('Column total');
    expect(t).toHaveBeenCalledWith(CompareI18nKey.ColumnGroup, { name: 'total' });
  });

  test('answers undefined without a label, so an unlabelled section keeps its own title', () => {
    expect(getAnalyticsColumnHeading(vi.fn(), undefined)).toBeUndefined();
  });
});
