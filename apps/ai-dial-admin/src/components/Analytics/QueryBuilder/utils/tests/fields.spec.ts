import { describe, expect, test } from 'vitest';

import {
  bucketFieldOptions,
  defaultValueType,
  distinctTags,
  family,
  filterFieldsByTags,
  havingFieldOptions,
  sortFieldOptions,
} from '@/src/components/Analytics/QueryBuilder/utils/fields';
import {
  createAggregate,
  createBucket,
  createInitialState,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode, QueryValueType } from '@/src/models/analytics/query';

const field = (name: string, type: AnalyticsFieldType, tag?: string): AnalyticsEntityField => ({
  name,
  type,
  source: name,
  tag,
});

const FIELDS: AnalyticsEntityField[] = [
  field('event_id', AnalyticsFieldType.Uuid, 'identity'),
  field('request_time', AnalyticsFieldType.Timestamp, 'identity'),
  field('_ingested_at', AnalyticsFieldType.Timestamp, 'system'),
  field('project_id', AnalyticsFieldType.String, 'lineage'),
  field('orphan', AnalyticsFieldType.String),
];

describe('family', () => {
  test('returns "column" when no family prefix', () => {
    expect(family('event_id')).toBe('column');
  });

  test('returns the prefix before the first colon', () => {
    expect(family('metric:tokens:total')).toBe('metric');
  });
});

describe('defaultValueType', () => {
  test('maps known field types', () => {
    expect(defaultValueType(AnalyticsFieldType.Uuid)).toBe(QueryValueType.Uuid);
    expect(defaultValueType(AnalyticsFieldType.Long)).toBe(QueryValueType.Long);
    expect(defaultValueType(AnalyticsFieldType.Timestamp)).toBe(QueryValueType.Timestamp);
  });

  test('falls back to string for unknown/undefined', () => {
    expect(defaultValueType(undefined)).toBe(QueryValueType.String);
    expect(defaultValueType(AnalyticsFieldType.Object)).toBe(QueryValueType.String);
  });
});

describe('distinctTags', () => {
  test('deduped in first-seen order with untagged bucket', () => {
    expect(distinctTags(FIELDS)).toEqual(['identity', 'system', 'lineage', 'untagged']);
  });

  test('empty schema → no tags', () => {
    expect(distinctTags([])).toEqual([]);
  });
});

describe('filterFieldsByTags', () => {
  test('empty selection returns all fields', () => {
    expect(filterFieldsByTags(FIELDS, [])).toHaveLength(FIELDS.length);
  });

  test('narrows to fields whose tag is selected (OR across tags)', () => {
    expect(filterFieldsByTags(FIELDS, ['lineage']).map((f) => f.name)).toEqual(['project_id']);
    expect(filterFieldsByTags(FIELDS, ['identity', 'system']).map((f) => f.name)).toEqual([
      'event_id',
      'request_time',
      '_ingested_at',
    ]);
  });

  test('untagged selection matches fields without a tag', () => {
    expect(filterFieldsByTags(FIELDS, ['untagged']).map((f) => f.name)).toEqual(['orphan']);
  });
});

describe('bucketFieldOptions', () => {
  test('prefers temporal fields', () => {
    expect(bucketFieldOptions(FIELDS).map((f) => f.name)).toEqual(['request_time', '_ingested_at']);
  });

  test('falls back to all fields when none are temporal', () => {
    const nonTemporal = [field('a', AnalyticsFieldType.String), field('b', AnalyticsFieldType.Long)];
    expect(bucketFieldOptions(nonTemporal)).toHaveLength(2);
  });
});

describe('having/sort field options', () => {
  test('havingFieldOptions combines group-by, bucket aliases and aggregate aliases', () => {
    const s = createInitialState();
    s.fields = FIELDS;
    s.groupBy = ['project_id'];
    const bucket = createBucket('request_time');
    bucket.alias = 'bucket';
    s.buckets = [bucket];
    const agg = createAggregate();
    agg.alias = 'cnt';
    s.aggregates = [agg];
    expect(havingFieldOptions(s).map((o) => o.name)).toEqual(['project_id', 'bucket', 'cnt']);
  });

  test('sortFieldOptions uses schema fields in row mode, aggregate outputs in aggregate mode', () => {
    const s = createInitialState();
    s.fields = FIELDS;
    s.groupBy = ['project_id'];
    expect(sortFieldOptions(s).map((o) => o.name)).toEqual(FIELDS.map((f) => f.name));
    s.mode = QueryMode.Aggregate;
    expect(sortFieldOptions(s).map((o) => o.name)).toEqual(['project_id']);
  });
});
