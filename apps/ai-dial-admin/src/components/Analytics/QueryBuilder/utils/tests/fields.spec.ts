import { describe, expect, test } from 'vitest';

import {
  bucketFieldOptions,
  defaultValueType,
  distinctTags,
  family,
  fieldsToOptions,
  filterFieldsByTags,
  groupFieldOptions,
  havingFieldOptions,
  sortByName,
  sortFieldOptions,
} from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { createAggregate, createBucket, createInitialState } from '@/src/components/Analytics/QueryBuilder/utils/state';
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

describe('sortByName', () => {
  test('orders alphabetically, case-insensitively', () => {
    const items = [{ name: 'banana' }, { name: 'Apple' }, { name: 'cherry' }];
    expect(sortByName(items).map((i) => i.name)).toEqual(['Apple', 'banana', 'cherry']);
  });

  test('does not mutate the input array', () => {
    const items = [{ name: 'b' }, { name: 'a' }];
    sortByName(items);
    expect(items.map((i) => i.name)).toEqual(['b', 'a']);
  });

  test('empty array returns empty', () => {
    expect(sortByName([])).toEqual([]);
  });
});

describe('bucketFieldOptions', () => {
  test('prefers temporal fields, sorted by name', () => {
    expect(bucketFieldOptions(FIELDS).map((f) => f.name)).toEqual(['_ingested_at', 'request_time']);
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
    expect(havingFieldOptions(s).map((o) => o.name)).toEqual(['bucket', 'cnt', 'project_id']);
  });

  test('sortFieldOptions uses schema fields in row mode, aggregate outputs in aggregate mode', () => {
    const s = createInitialState();
    s.fields = FIELDS;
    s.groupBy = ['project_id'];
    expect(sortFieldOptions(s).map((o) => o.name)).toEqual([
      '_ingested_at',
      'event_id',
      'orphan',
      'project_id',
      'request_time',
    ]);
    s.mode = QueryMode.Aggregate;
    expect(sortFieldOptions(s).map((o) => o.name)).toEqual(['project_id']);
  });

  test('sortFieldOptions keeps tags in row mode so the dropdown can group by category', () => {
    const s = createInitialState();
    s.fields = FIELDS;
    const eventId = sortFieldOptions(s).find((o) => o.name === 'event_id');
    expect(eventId?.tag).toBe('identity');
  });
});

describe('groupFieldOptions', () => {
  const options = fieldsToOptions(FIELDS);

  test('groups by tag preserving first-seen tag order, options sorted by name', () => {
    const groups = groupFieldOptions(options);
    expect(groups.map((g) => g.tag)).toEqual(['identity', 'system', 'lineage', 'untagged']);
    expect(groups[0].options.map((o) => o.name)).toEqual(['event_id', 'request_time']);
  });

  test('search filters by name across groups', () => {
    const groups = groupFieldOptions(options, 'time');
    expect(groups.map((g) => g.tag)).toEqual(['identity']);
    expect(groups[0].options.map((o) => o.name)).toEqual(['request_time']);
  });

  test('search matches tags too', () => {
    const groups = groupFieldOptions(options, 'lineage');
    expect(groups.map((g) => g.tag)).toEqual(['lineage']);
  });

  test('no match returns empty list; empty input returns empty list', () => {
    expect(groupFieldOptions(options, 'zzz')).toEqual([]);
    expect(groupFieldOptions([], '')).toEqual([]);
  });

  test('untagged options land under the untagged key', () => {
    const groups = groupFieldOptions([{ name: 'alias_a' }, { name: 'alias_b' }]);
    expect(groups).toHaveLength(1);
    expect(groups[0].tag).toBe('untagged');
    expect(groups[0].options.map((o) => o.name)).toEqual(['alias_a', 'alias_b']);
  });
});
