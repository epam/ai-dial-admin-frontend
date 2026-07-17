import { describe, expect, test } from 'vitest';

import {
  defaultValueType,
  distinctTags,
  family,
  fieldDisplayName,
  fieldsToOptions,
  filterFieldsByTags,
  groupFieldOptions,
  havingFieldOptions,
  sortByName,
  sortFieldOptions,
} from '@/src/components/Analytics/QueryBuilder/utils/fields';
import {
  createAggregate,
  createGroupByColumn,
  createGroupByFn,
  createInitialState,
} from '@/src/components/Analytics/QueryBuilder/utils/state';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode, QueryValueType } from '@/src/models/analytics/query';
import { fnFixture, TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';

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

describe('fieldsToOptions', () => {
  test('carries the sensitive flag through to the option', () => {
    const fields: AnalyticsEntityField[] = [
      { name: 'email', type: AnalyticsFieldType.String, source: 'email', sensitive: true },
      { name: 'total', type: AnalyticsFieldType.Decimal, source: 'total' },
    ];
    const options = fieldsToOptions(fields);
    expect(options[0]).toMatchObject({ name: 'email', sensitive: true });
    expect(options[1].sensitive).toBeUndefined();
  });
});

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

describe('functionResultType (via havingFieldOptions)', () => {
  test('same_as_argument resolves to the operand field type; fixed returns map directly', () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.fields = [field('latency', AnalyticsFieldType.Long), field('deployment', AnalyticsFieldType.String)];
    // max → same_as_argument (Long from latency); date_bin → timestamp; length → integer
    const maxRow = { ...createGroupByFn(fnFixture('length'), [{ field: 'deployment' }]), alias: 'len' };
    s.groupBy = [maxRow];
    const lenOption = havingFieldOptions(s).find((o) => o.name === 'len');
    expect(lenOption?.type).toBe(AnalyticsFieldType.Integer);
  });
});

describe('having/sort field options', () => {
  test('havingFieldOptions combines group-by columns, function aliases and aggregate aliases', () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.fields = FIELDS;
    const bucket = createGroupByFn(fnFixture('date_bin'), [
      { literal: '5' },
      { literal: 'hour' },
      { field: 'request_time' },
    ]);
    bucket.alias = 'bucket';
    s.groupBy = [createGroupByColumn('project_id'), bucket];
    const agg = createAggregate(fnFixture('count'));
    agg.alias = 'cnt';
    s.aggregates = [agg];
    expect(havingFieldOptions(s).map((o) => o.name)).toEqual(['bucket', 'cnt', 'project_id']);
  });

  test('havingFieldOptions skips aliasless function entries', () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.fields = FIELDS;
    const fnRow = createGroupByFn(fnFixture('lower'), [{ field: 'project_id' }]);
    fnRow.alias = '';
    s.groupBy = [fnRow];
    expect(havingFieldOptions(s)).toEqual([]);
  });

  test('sortFieldOptions uses schema fields in row mode, aggregate outputs in aggregate mode', () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.fields = FIELDS;
    s.groupBy = [createGroupByColumn('project_id')];
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

  test('search matches labels too', () => {
    const labeled = [
      { name: 'total_money', display_name: 'Total money spend', tag: 'metric' },
      { name: 'event_id', tag: 'identity' },
    ];
    const groups = groupFieldOptions(labeled, 'spend');
    expect(groups.map((g) => g.tag)).toEqual(['metric']);
    expect(groups[0].options.map((o) => o.name)).toEqual(['total_money']);
  });
});

describe('fieldsToOptions', () => {
  test('projects label and description onto options', () => {
    const withMeta: AnalyticsEntityField = {
      ...field('total_money', AnalyticsFieldType.Decimal, 'metric'),
      display_name: 'Total money spend',
      description: 'Money spent on the request',
    };
    expect(fieldsToOptions([withMeta])).toEqual([
      {
        name: 'total_money',
        type: AnalyticsFieldType.Decimal,
        tag: 'metric',
        display_name: 'Total money spend',
        description: 'Money spent on the request',
      },
    ]);
  });

  test('fields without metadata keep undefined label/description', () => {
    const [option] = fieldsToOptions([field('event_id', AnalyticsFieldType.Uuid, 'identity')]);
    expect(option.display_name).toBeUndefined();
    expect(option.description).toBeUndefined();
  });
});

describe('fieldDisplayName', () => {
  const fields = [
    { ...field('total_money', AnalyticsFieldType.Decimal, 'metric'), display_name: 'Total money spend' },
    field('event_id', AnalyticsFieldType.Uuid, 'identity'),
  ];

  test('returns the label when set', () => {
    expect(fieldDisplayName(fields, 'total_money')).toBe('Total money spend');
  });

  test('falls back to the name when no label', () => {
    expect(fieldDisplayName(fields, 'event_id')).toBe('event_id');
  });

  test('unknown names (aliases, stale refs) pass through unchanged', () => {
    expect(fieldDisplayName(fields, 'sum_tokens')).toBe('sum_tokens');
    expect(fieldDisplayName([], 'anything')).toBe('anything');
  });

  test('blank label falls back to the name', () => {
    expect(fieldDisplayName([{ name: 'x', display_name: '' }], 'x')).toBe('x');
  });
});

describe('havingFieldOptions label projection', () => {
  test('plain group-by columns keep their schema label and description; aliases carry neither', () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.fields = [
      {
        ...field('project_id', AnalyticsFieldType.String, 'lineage'),
        display_name: 'Project',
        description: 'Owning project',
      },
    ];
    s.groupBy = [
      createGroupByColumn('project_id'),
      { ...createGroupByFn(fnFixture('lower'), [{ field: 'project_id' }]), alias: 'p' },
    ];
    const options = havingFieldOptions(s);
    expect(options.find((o) => o.name === 'project_id')).toMatchObject({
      display_name: 'Project',
      description: 'Owning project',
    });
    expect(options.find((o) => o.name === 'p')?.display_name).toBeUndefined();
  });
});
