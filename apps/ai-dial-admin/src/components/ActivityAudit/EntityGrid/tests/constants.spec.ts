import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { describe, expect, test } from 'vitest';

import { ANALYTICS_ROW_LABEL_KEYS, RESOURCE_DIFF_COLUMNS } from '@/src/components/ActivityAudit/EntityGrid/constants';
import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import {
  ANALYTICS_COLUMN_PARAMETERS,
  getSnapshotLeaves,
} from '@/src/components/ActivityAudit/View/utils/analytics-diffs';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { ActivityAuditEntity, ActivityAuditResourceType } from '@/src/types/activity-audit';

const t = (key: string) => key;

// A table snapshot carrying every field of the persisted table definition, so the
// label map is asserted against the parameters the diff actually emits rather than
// against a list copied by hand.
const TABLE_SNAPSHOT = {
  name: 'orders',
  description: 'Orders',
  type: 'source',
  status: 'active',
  system: false,
  source_table: 'raw_orders',
  column_count: 2,
  grain: { grain_key: 'chat_id', cardinality: 'zero_or_one' },
  ordering_key: ['created_at', 'id'],
  partition_by: { column: 'created_at', granularity: 'day' },
  identity_column: 'id',
  version_column: 'updated_at',
  tag_order: ['a', 'b'],
} as unknown as ActivityAuditEntity;

// The tables feature defines no label for the grain's cardinality — v1 supports a
// single value and no screen surfaces it — so it renders under its own name.
const UNLABELLED_TABLE_PARAMETERS = ['grain.cardinality'];

const getParameterFormatter = (resourceType?: ActivityAuditResourceType) => {
  const [parameterColumn] = RESOURCE_DIFF_COLUMNS(t, EntityParameterKeys.COLUMNS, resourceType) as ColDef[];
  const formatter = parameterColumn.valueFormatter as (params: ValueFormatterParams) => string;
  return (value: string) => formatter({ value } as ValueFormatterParams);
};

describe('ANALYTICS_ROW_LABEL_KEYS', () => {
  test('labels every attribute a column diff emits', () => {
    ANALYTICS_COLUMN_PARAMETERS.forEach((parameter) => {
      expect(ANALYTICS_ROW_LABEL_KEYS[parameter]).toBeTruthy();
    });
  });

  test('labels every table-definition parameter a snapshot produces', () => {
    const parameters = Object.keys(getSnapshotLeaves(TABLE_SNAPSHOT)).filter(
      (parameter) => !UNLABELLED_TABLE_PARAMETERS.includes(parameter),
    );

    expect(parameters.length).toBeGreaterThan(0);
    parameters.forEach((parameter) => {
      expect(ANALYTICS_ROW_LABEL_KEYS[parameter]).toBeTruthy();
    });
  });

  test('labels the nested table parameters by their dotted path', () => {
    expect(ANALYTICS_ROW_LABEL_KEYS['grain.grain_key']).toBe(AnalyticsTablesI18nKey.GrainKey);
    expect(ANALYTICS_ROW_LABEL_KEYS['partition_by.column']).toBe(AnalyticsTablesI18nKey.PartitionColumn);
    expect(ANALYTICS_ROW_LABEL_KEYS['partition_by.granularity']).toBe(AnalyticsTablesI18nKey.Granularity);
  });
});

describe('RESOURCE_DIFF_COLUMNS :: analytics parameter labels', () => {
  test('renders an analytics parameter through its label key', () => {
    const formatParameter = getParameterFormatter(ActivityAuditResourceType.TABLE);

    expect(formatParameter('nullable')).toBe(AnalyticsTablesI18nKey.Nullable);
    expect(formatParameter('enum_values')).toBe(AnalyticsTablesI18nKey.EnumValues);
    expect(formatParameter('ordering_key')).toBe(AnalyticsTablesI18nKey.OrderingKey);
  });

  test('falls back to the raw field name for an analytics parameter with no label', () => {
    const formatParameter = getParameterFormatter(ActivityAuditResourceType.TABLE_COLUMN);

    expect(formatParameter('grain.cardinality')).toBe('grain.cardinality');
    expect(formatParameter('field_added_later')).toBe('field_added_later');
  });

  test('leaves a non-analytics resource type on its existing labels', () => {
    const formatParameter = getParameterFormatter(ActivityAuditResourceType.MODEL);

    expect(formatParameter('nullable')).toBe('nullable');
    expect(formatParameter('name')).not.toBe(AnalyticsTablesI18nKey.Name);
  });
});
