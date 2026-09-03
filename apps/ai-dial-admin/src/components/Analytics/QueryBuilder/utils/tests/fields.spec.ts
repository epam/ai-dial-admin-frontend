import { describe, expect, test } from 'vitest';

import {
  computedColumnNames,
  defaultValueType,
  deriveAlias,
  distinctTags,
  family,
  fieldDisplayName,
  fieldsToOptions,
  filterFieldsByTags,
  groupFieldOptions,
  havingFieldOptions,
  prefilledAlias,
  sortByName,
  sortFieldOptions,
  uniqueAlias,
  takenColumnNames,
} from '@/src/components/Analytics/QueryBuilder/utils/fields';
import {
  createAggregate,
  createColumnRow,
  createFnRow,
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
    s.mode = QueryMode.Aggregate;
    s.fields = [field('latency', AnalyticsFieldType.Long), field('deployment', AnalyticsFieldType.String)];
    // max → same_as_argument (Long from latency); date_bin → timestamp; length → integer
    const maxRow = { ...createFnRow(fnFixture('length'), [{ field: 'deployment' }]), alias: 'len' };
    s.groupBy = [maxRow];
    const lenOption = havingFieldOptions(s).find((o) => o.name === 'len');
    expect(lenOption?.type).toBe(AnalyticsFieldType.Integer);
  });
});

describe('having/sort field options', () => {
  test('havingFieldOptions combines group-by columns, function aliases and aggregate aliases', () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.mode = QueryMode.Aggregate;
    s.fields = FIELDS;
    const bucket = createFnRow(fnFixture('date_bin'), [
      { literal: '5' },
      { literal: 'hour' },
      { field: 'request_time' },
    ]);
    bucket.alias = 'bucket';
    s.groupBy = [createColumnRow('project_id'), bucket];
    const agg = createAggregate(fnFixture('count'));
    agg.alias = 'cnt';
    s.aggregates = [agg];
    expect(havingFieldOptions(s).map((o) => o.name)).toEqual(['bucket', 'cnt', 'project_id']);
  });

  // A computed column with a blank alias is still an output column — the serializer names it by the
  // derived alias, so Having and Sort must offer that same name or it stays unaddressable.
  test('havingFieldOptions offers an aliasless function entry by its derived name', () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.mode = QueryMode.Aggregate;
    s.fields = FIELDS;
    const fnRow = createFnRow(fnFixture('lower'), [{ field: 'project_id' }]);
    fnRow.alias = '';
    s.groupBy = [fnRow];
    expect(havingFieldOptions(s).map((o) => o.name)).toContain('project_id (Lowercase)');
  });

  test('havingFieldOptions offers an aliasless aggregate by its derived name', () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.mode = QueryMode.Aggregate;
    s.fields = [{ ...field('total_tokens', AnalyticsFieldType.Long), display_name: 'Total tokens' }];
    const agg = createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }]);
    agg.alias = '';
    s.aggregates = [agg];
    expect(havingFieldOptions(s).map((o) => o.name)).toEqual(['Total tokens (Sum)']);
  });

  // Aggregate mode with no aggregates still returns the implicit count column.
  test('havingFieldOptions offers the implicit count column when there are no aggregates', () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.fields = FIELDS;
    s.groupBy = [createColumnRow('project_id')];
    expect(havingFieldOptions(s).map((o) => o.name)).toEqual(['Count', 'project_id']);
  });

  test('sortFieldOptions uses schema fields in row mode, aggregate outputs in aggregate mode', () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.fields = FIELDS;
    s.groupBy = [createColumnRow('project_id')];
    expect(sortFieldOptions(s).map((o) => o.name)).toEqual([
      '_ingested_at',
      'event_id',
      'orphan',
      'project_id',
      'request_time',
    ]);
    s.mode = QueryMode.Aggregate;
    expect(sortFieldOptions(s).map((o) => o.name)).toEqual(['Count', 'project_id']);
  });

  // Computed rows arrive with a prefilled alias, so an aggregate is sortable the moment it is added.
  test('sortFieldOptions offers a freshly added aggregate by its prefilled alias', () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.fields = FIELDS;
    s.mode = QueryMode.Aggregate;
    s.groupBy = [createColumnRow('project_id')];
    const agg = createAggregate(
      fnFixture('sum'),
      [{ field: 'project_id' }],
      prefilledAlias(s, fnFixture('sum'), [{ field: 'project_id' }], false),
    );
    s.aggregates = [agg];
    expect(sortFieldOptions(s).map((o) => o.name)).toContain('project_id (Sum)');
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
    s.mode = QueryMode.Aggregate;
    s.fields = [
      {
        ...field('project_id', AnalyticsFieldType.String, 'lineage'),
        display_name: 'Project',
        description: 'Owning project',
      },
    ];
    s.groupBy = [
      createColumnRow('project_id'),
      { ...createFnRow(fnFixture('lower'), [{ field: 'project_id' }]), alias: 'p' },
    ];
    const options = havingFieldOptions(s);
    expect(options.find((o) => o.name === 'project_id')).toMatchObject({
      display_name: 'Project',
      description: 'Owning project',
    });
    expect(options.find((o) => o.name === 'p')?.display_name).toBeUndefined();
  });
});

describe('deriveAlias', () => {
  const ALIAS_FIELDS: AnalyticsEntityField[] = [
    { ...field('total_tokens', AnalyticsFieldType.Long), display_name: 'Total tokens' },
    { ...field('project_id', AnalyticsFieldType.String), display_name: 'Project ID' },
    field('latency', AnalyticsFieldType.Decimal),
  ];

  test('names an aggregate by its argument display name and function', () => {
    expect(deriveAlias(fnFixture('sum'), [{ field: 'total_tokens' }], false, ALIAS_FIELDS)).toBe('Total tokens (Sum)');
  });

  test('folds distinct into the function part', () => {
    expect(deriveAlias(fnFixture('count'), [{ field: 'project_id' }], true, ALIAS_FIELDS)).toBe(
      'Project ID (Row count distinct)',
    );
  });

  test('an argument-less aggregate is named by its function label alone', () => {
    expect(deriveAlias(fnFixture('count'), [{}], false, ALIAS_FIELDS)).toBe('Row count');
  });

  test('an unfilled expression argument falls back to the function label, keeping the row addressable', () => {
    expect(deriveAlias(fnFixture('sum'), [{}], false, ALIAS_FIELDS)).toBe('Sum');
    expect(deriveAlias(fnFixture('date_bin'), [{ literal: '5' }, { literal: 'minute' }, {}], false, ALIAS_FIELDS)).toBe(
      'Time bucket',
    );
  });

  test('a field without a display name contributes its raw name', () => {
    expect(deriveAlias(fnFixture('avg'), [{ field: 'latency' }], false, ALIAS_FIELDS)).toBe('latency (Average)');
    expect(deriveAlias(fnFixture('avg'), [{ field: 'unknown_field' }], false, ALIAS_FIELDS)).toBe(
      'unknown_field (Average)',
    );
  });

  test('reads the first expression argument, whatever its position', () => {
    expect(
      deriveAlias(fnFixture('percentile_cont'), [{ literal: '0.95' }, { field: 'latency' }], false, ALIAS_FIELDS),
    ).toBe('latency (Continuous percentile)');
  });
});

describe('uniqueAlias', () => {
  test('an unused candidate is returned unchanged', () => {
    expect(uniqueAlias('Total tokens (Sum)', ['Count'])).toBe('Total tokens (Sum)');
  });

  test('a taken candidate gains a counter', () => {
    expect(uniqueAlias('Total tokens (Sum)', ['Total tokens (Sum)'])).toBe('Total tokens (Sum) 2');
  });

  test('the counter skips names already taken', () => {
    expect(uniqueAlias('Count', ['Count', 'Count 2', 'Count 3'])).toBe('Count 4');
  });
});

describe('takenColumnNames / prefilledAlias', () => {
  const state = () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.mode = QueryMode.Aggregate;
    s.fields = [{ ...field('total_tokens', AnalyticsFieldType.Long), display_name: 'Total tokens' }];
    return s;
  };

  // Every name the query will emit, in serialization order: plain group-by columns, then computed
  // rows — a blank alias counted by the name it will fall back to, so nothing collides with it.
  test('collects every output column name, blank aliases included', () => {
    const s = state();
    s.aggregates = [{ ...createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }], 'a'), aliasEdited: true }];
    s.groupBy = [
      { ...createFnRow(fnFixture('lower'), [{ field: 'total_tokens' }], 'b'), aliasEdited: true },
      createColumnRow('total_tokens'),
      createFnRow(fnFixture('upper'), [{ field: 'total_tokens' }]),
    ];
    expect(takenColumnNames(s)).toEqual(['total_tokens', 'b', 'Total tokens (Uppercase)', 'a']);
  });

  test('prefills a unique alias for a second row over the same field', () => {
    const s = state();
    const first = createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }], 'Total tokens (Sum)');
    s.aggregates = [first];
    expect(prefilledAlias(s, fnFixture('sum'), [{ field: 'total_tokens' }], false)).toBe('Total tokens (Sum) 2');
  });

  test('rederiving a row does not collide with its own current alias', () => {
    const s = state();
    const row = createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }], 'Total tokens (Sum)');
    s.aggregates = [row];
    expect(prefilledAlias(s, fnFixture('sum'), [{ field: 'total_tokens' }], false, row.id)).toBe('Total tokens (Sum)');
  });
});

// Defects found in review: the three paths that name a computed column — the prefill, the
// Having/Sort options and serialization — must agree, or a column is offered under a name the query
// does not carry (backend 400) or two columns share one name (the grid collapses one).
describe('computed column names agree across paths', () => {
  const labeled = () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.mode = QueryMode.Aggregate;
    s.fields = [
      { ...field('total_tokens', AnalyticsFieldType.Long), display_name: 'Total tokens' },
      { ...field('latency', AnalyticsFieldType.Long), display_name: 'Latency' },
    ];
    return s;
  };

  test('a blank alias is counted when prefilling the next row, so the two never collide', () => {
    const s = labeled();
    const cleared = createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }], 'Total tokens (Sum)');
    cleared.alias = '';
    s.aggregates = [cleared];

    const next = prefilledAlias(s, fnFixture('sum'), [{ field: 'total_tokens' }], false);
    expect(next).toBe('Total tokens (Sum) 2');
  });

  test('two rows with blank aliases resolve to distinct names, and the options match them', () => {
    const s = labeled();
    s.aggregates = [
      createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }]),
      createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }]),
    ];
    const resolved = [...computedColumnNames(s).values()];
    expect(resolved).toEqual(['Total tokens (Sum)', 'Total tokens (Sum) 2']);
    expect(sortFieldOptions(s).map((o) => o.name)).toEqual(resolved);
  });

  test('a derived name never collides with a plain group-by column of the same name', () => {
    const s = labeled();
    s.groupBy = [createColumnRow('Total tokens (Sum)')];
    s.aggregates = [createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }])];
    expect([...computedColumnNames(s).values()]).toEqual(['Total tokens (Sum) 2']);
  });

  test('a row whose required argument is unfilled is neither named nor offered', () => {
    const s = labeled();
    s.groupBy = [createFnRow(fnFixture('lower'))];
    expect(computedColumnNames(s).size).toBe(0);
    expect(sortFieldOptions(s).map((o) => o.name)).not.toContain('Lowercase');
  });

  test('an alias the user typed is the name, duplicates included', () => {
    const s = labeled();
    s.aggregates = [
      { ...createAggregate(fnFixture('sum'), [{ field: 'total_tokens' }], 'mine'), aliasEdited: true },
      { ...createAggregate(fnFixture('avg'), [{ field: 'latency' }], 'mine'), aliasEdited: true },
    ];
    expect([...computedColumnNames(s).values()]).toEqual(['mine', 'mine']);
  });
});

describe('sortFieldOptions — row mode', () => {
  const rowState = () => {
    const s = createInitialState(TEST_FUNCTIONS);
    s.fields = [field('project_id', AnalyticsFieldType.String)];
    return s;
  };

  test('offers the schema fields plus every function column alias', () => {
    const s = rowState();
    s.select = [
      createColumnRow('project_id'),
      { ...createFnRow(fnFixture('length'), [{ field: 'project_id' }]), alias: 'len' },
    ];

    expect(sortFieldOptions(s).map((o) => o.name)).toEqual(['len', 'project_id']);
  });

  test('an incomplete function column is not offered', () => {
    const s = rowState();
    s.select = [createFnRow(fnFixture('length'))];

    expect(sortFieldOptions(s).map((o) => o.name)).toEqual(['project_id']);
  });

  test('group-by rows do not leak into row-mode options', () => {
    const s = rowState();
    s.groupBy = [{ ...createFnRow(fnFixture('lower'), [{ field: 'project_id' }]), alias: 'lowered' }];

    expect(sortFieldOptions(s).map((o) => o.name)).toEqual(['project_id']);
  });
});
