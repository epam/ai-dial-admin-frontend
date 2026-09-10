import { describe, expect, test } from 'vitest';

import {
  buildColumnValueClasses,
  buildExecutedMeta,
  classifyResultColumns,
  resolveGroupByColumns,
} from '@/src/components/Analytics/QueryBuilder/utils/executed-meta';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryExprType, QueryMode, StructuredQuery, StructuredQueryResult } from '@/src/models/analytics/query';
import { QueryRequestKind, QueryRunRequest, ResultValueClass } from '@/src/models/analytics/query-builder';

const query = (partial: Partial<StructuredQuery>): StructuredQuery => ({
  entity: 'dial_usage_log',
  mode: QueryMode.Aggregate,
  ...partial,
});

const field = (name: string, as?: string) => ({ expr: { type: QueryExprType.Field as const, name }, as });
const fn = (name: string, as?: string) => ({ expr: { type: QueryExprType.Fn as const, name, args: [] }, as });

describe('QueryBuilder :: executed-meta :: resolveGroupByColumns', () => {
  test('an aliased plain column resolves to the alias the rows are keyed by', () => {
    const translated = query({
      group_by: ['usage_request_summary.model'],
      select: [field('usage_request_summary.model', 'client'), fn('count', 'turns')],
    });

    expect(resolveGroupByColumns(translated, ['client', 'turns'])).toEqual(['client']);
  });

  test('an aliased expression is already named by its alias', () => {
    const translated = query({ group_by: ['d'], select: [fn('date_trunc', 'd'), fn('count', 'turns')] });

    expect(resolveGroupByColumns(translated, ['d', 'turns'])).toEqual(['d']);
  });

  test('an un-aliased plain column passes through', () => {
    const translated = query({ group_by: ['deployment'], select: [field('deployment'), fn('count', 'n')] });

    expect(resolveGroupByColumns(translated, ['deployment', 'n'])).toEqual(['deployment']);
  });

  test('an un-aliased expression keeps the name the service gave it', () => {
    const translated = query({ group_by: ['date_trunc'], select: [fn('date_trunc'), fn('count', 'n')] });

    expect(resolveGroupByColumns(translated, ['date_trunc', 'n'])).toEqual(['date_trunc']);
  });

  test('a positional GROUP BY arrives already resolved to its column', () => {
    const translated = query({ group_by: ['response_status'], select: [field('response_status'), fn('count', 'n')] });

    expect(resolveGroupByColumns(translated, ['response_status', 'n'])).toEqual(['response_status']);
  });

  test('resolves each entry of a multi-column grouping independently', () => {
    const translated = query({
      group_by: ['d', 'usage_request_summary.model'],
      select: [
        fn('date_trunc', 'd'),
        field('usage_request_summary.model', 'client'),
        fn('count', 'turns'),
        fn('sum', 'tokens'),
      ],
    });

    expect(resolveGroupByColumns(translated, ['d', 'client', 'turns', 'tokens'])).toEqual(['d', 'client']);
  });

  // A column the result actually carries wins over an alias of that same column elsewhere in select.
  test('a returned column keeps its own name even when it is also selected under an alias', () => {
    const translated = query({
      group_by: ['deployment'],
      select: [field('deployment'), field('deployment', 'dep'), fn('count', 'n')],
    });

    expect(resolveGroupByColumns(translated, ['deployment', 'dep', 'n'])).toEqual(['deployment']);
  });

  test('an alias on a function expression never re-maps a plain column of the same name', () => {
    const translated = query({ group_by: ['deployment'], select: [fn('deployment', 'renamed')] });

    expect(resolveGroupByColumns(translated, ['deployment'])).toEqual(['deployment']);
  });

  test('an entry matching no returned column is dropped rather than offered as an axis', () => {
    const translated = query({ group_by: ['ghost'], select: [fn('count', 'n')] });

    expect(resolveGroupByColumns(translated, ['n'])).toEqual([]);
  });

  test('a query with no grouping yields no dimensions', () => {
    expect(resolveGroupByColumns(query({ mode: QueryMode.Row }), ['a'])).toEqual([]);
  });
});

describe('QueryBuilder :: executed-meta :: classifyResultColumns', () => {
  test('offers every column as a dimension and only the numeric ones as aggregates', () => {
    const rows = [
      { d: '2026-08-20T00:00:00Z', client: 'web', turns: 12, cost: 1.5 },
      { d: '2026-08-21T00:00:00Z', client: 'api', turns: 7, cost: 0.25 },
    ];

    expect(classifyResultColumns(['d', 'client', 'turns', 'cost'], rows)).toEqual({
      dimensionColumns: ['d', 'client', 'turns', 'cost'],
      aggregateColumns: ['turns', 'cost'],
    });
  });

  test('a date-like column is not offered as a value', () => {
    expect(classifyResultColumns(['d', 'n'], [{ d: '2026-08-20T00:00:00Z', n: 1 }]).aggregateColumns).toEqual(['n']);
  });

  test('a column that is null anywhere is not offered as a value', () => {
    const rows = [
      { client: null, n: 1 },
      { client: 'web', n: 2 },
    ];

    expect(classifyResultColumns(['client', 'n'], rows).aggregateColumns).toEqual(['n']);
  });

  test('boolean and array columns are not offered as values', () => {
    const rows = [
      { success: true, tags: [], n: 1 },
      { success: false, tags: ['a'], n: 2 },
    ];

    expect(classifyResultColumns(['success', 'tags', 'n'], rows).aggregateColumns).toEqual(['n']);
  });

  test('numeric strings still count as values', () => {
    expect(classifyResultColumns(['n'], [{ n: '12' }, { n: '7.5' }]).aggregateColumns).toEqual(['n']);
  });

  test('an empty result yields no aggregate columns', () => {
    expect(classifyResultColumns(['a', 'b'], [])).toEqual({ dimensionColumns: ['a', 'b'], aggregateColumns: [] });
  });
});

describe('QueryBuilder :: executed-meta :: buildColumnValueClasses', () => {
  const FIELDS: AnalyticsEntityField[] = [
    { name: 'count', type: AnalyticsFieldType.Integer, source: 'count' },
    { name: 'total', type: AnalyticsFieldType.Long, source: 'total' },
    { name: 'rate', type: AnalyticsFieldType.Decimal, source: 'rate' },
    { name: 'created_at', type: AnalyticsFieldType.Timestamp, source: 'created_at' },
    { name: 'day', type: AnalyticsFieldType.Date, source: 'day' },
    { name: 'id', type: AnalyticsFieldType.Uuid, source: 'id' },
  ];

  test('a declared Integer, Long, Decimal, Timestamp and Date column each resolve from the schema type', () => {
    const rows = [{ count: 1, total: 2, rate: 1.5, created_at: 123, day: 456, id: 'a' }];
    const columns = ['count', 'total', 'rate', 'created_at', 'day', 'id'];

    expect(buildColumnValueClasses(columns, FIELDS, [], rows)).toEqual({
      count: ResultValueClass.Compact,
      total: ResultValueClass.Compact,
      rate: ResultValueClass.Significant,
      created_at: ResultValueClass.DateTime,
      day: ResultValueClass.DateTime,
    });
  });

  test('a Uuid column gets no entry', () => {
    expect(buildColumnValueClasses(['id'], FIELDS, [], [{ id: 'a' }])).toEqual({});
  });

  test('a measure column with no schema field is compact when every value is whole', () => {
    const rows = [{ total_cost: 3 }, { total_cost: 7 }];

    expect(buildColumnValueClasses(['total_cost'], [], ['total_cost'], rows)).toEqual({
      total_cost: ResultValueClass.Compact,
    });
  });

  test('a measure column with no schema field is significant-digit when one value is fractional', () => {
    const rows = [{ avg_cost: 3 }, { avg_cost: 7.5 }];

    expect(buildColumnValueClasses(['avg_cost'], [], ['avg_cost'], rows)).toEqual({
      avg_cost: ResultValueClass.Significant,
    });
  });

  test('an empty rows array yields no entry for a measure column', () => {
    expect(buildColumnValueClasses(['total'], [], ['total'], [])).toEqual({});
  });

  // The declared type wins even when the column is a measure and its values happen to parse as
  // numbers: a schema field never falls through to value-based classification.
  test('a declared Enum measure column with numeric-looking values gets no entry', () => {
    const enumFields: AnalyticsEntityField[] = [{ name: 'status', type: AnalyticsFieldType.Enum, source: 'status' }];
    const rows = [{ status: '200' }, { status: '429' }];

    expect(buildColumnValueClasses(['status'], enumFields, ['status'], rows)).toEqual({});
  });

  test('a Long field tagged performance resolves Duration where its type alone would resolve Compact', () => {
    const durationFields: AnalyticsEntityField[] = [
      { name: 'duration_ms', type: AnalyticsFieldType.Long, source: 'duration_ms', tag: 'performance' },
    ];

    expect(buildColumnValueClasses(['duration_ms'], durationFields, [], [{ duration_ms: 698700 }])).toEqual({
      duration_ms: ResultValueClass.Duration,
    });
  });

  test('a Decimal field tagged performance resolves Duration where its type alone would resolve Significant', () => {
    const durationFields: AnalyticsEntityField[] = [
      { name: 'avg_duration_ms', type: AnalyticsFieldType.Decimal, source: 'avg_duration_ms', tag: 'performance' },
    ];

    expect(buildColumnValueClasses(['avg_duration_ms'], durationFields, [], [{ avg_duration_ms: 12.5 }])).toEqual({
      avg_duration_ms: ResultValueClass.Duration,
    });
  });

  // A millisecond-named but untagged field falls through to Compact — a decision, not an accident —
  // beside a tagged field in the same result that resolves Duration and, per `result-column-format.ts`
  // (design.md §12), is left unformatted: the untagged column still reads compacted, the tagged one raw.
  test('a millisecond-named but untagged field falls through to Compact beside a tagged field resolving Duration', () => {
    const mixedFields: AnalyticsEntityField[] = [
      { name: 'demo_duration_ms', type: AnalyticsFieldType.Long, source: 'demo_duration_ms' },
      { name: 'duration_ms', type: AnalyticsFieldType.Long, source: 'duration_ms', tag: 'performance' },
    ];
    const rows = [{ demo_duration_ms: 5000, duration_ms: 698700 }];

    expect(buildColumnValueClasses(['demo_duration_ms', 'duration_ms'], mixedFields, [], rows)).toEqual({
      demo_duration_ms: ResultValueClass.Compact,
      duration_ms: ResultValueClass.Duration,
    });
  });

  // The tag only narrows a class the type map already resolved as numeric; a declared String or
  // Timestamp field tagged performance keeps exactly what its type resolves.
  test('a String-typed and a Timestamp-typed field tagged performance keep what their types resolve', () => {
    const taggedNonNumericFields: AnalyticsEntityField[] = [
      { name: 'label', type: AnalyticsFieldType.String, source: 'label', tag: 'performance' },
      { name: 'measured_at', type: AnalyticsFieldType.Timestamp, source: 'measured_at', tag: 'performance' },
    ];
    const rows = [{ label: 'x', measured_at: 123 }];

    expect(buildColumnValueClasses(['label', 'measured_at'], taggedNonNumericFields, [], rows)).toEqual({
      measured_at: ResultValueClass.DateTime,
    });
  });

  test('a bucket-tagged ordinal and an untagged status code still resolve Compact', () => {
    const bucketFields: AnalyticsEntityField[] = [
      { name: 'duration_bucket', type: AnalyticsFieldType.Integer, source: 'duration_bucket', tag: 'bucket' },
      { name: 'response_status', type: AnalyticsFieldType.Integer, source: 'response_status' },
    ];
    const rows = [{ duration_bucket: 3, response_status: 200 }];

    expect(buildColumnValueClasses(['duration_bucket', 'response_status'], bucketFields, [], rows)).toEqual({
      duration_bucket: ResultValueClass.Compact,
      response_status: ResultValueClass.Compact,
    });
  });

  // An output column with no schema field carries no tag to read, so it never becomes a Duration —
  // it keeps the value-shape class §4 step 2 already gives it, and so stays compacted rather than raw.
  test('an aggregate alias over a tagged field resolves Compact/Significant and never Duration', () => {
    const wholeRows = [{ total_duration_ms: 100 }, { total_duration_ms: 200 }];
    expect(buildColumnValueClasses(['total_duration_ms'], [], ['total_duration_ms'], wholeRows)).toEqual({
      total_duration_ms: ResultValueClass.Compact,
    });

    const fractionalRows = [{ avg_duration_ms: 100 }, { avg_duration_ms: 150.5 }];
    expect(buildColumnValueClasses(['avg_duration_ms'], [], ['avg_duration_ms'], fractionalRows)).toEqual({
      avg_duration_ms: ResultValueClass.Significant,
    });
  });
});

describe('QueryBuilder :: executed-meta :: buildExecutedMeta', () => {
  const FIELDS: AnalyticsEntityField[] = [
    {
      name: 'deployment',
      type: AnalyticsFieldType.String,
      source: 'deployment',
      tag: 'lineage',
      display_name: 'Model',
    },
  ];
  const result = (rows: Array<Record<string, unknown>>): StructuredQueryResult => ({ rows });
  const sqlRequest: QueryRunRequest = { kind: QueryRequestKind.Sql, sql: 'SELECT 1' };

  test('a translated SQL run reports the translated mode and grouping', () => {
    const translated = query({ group_by: ['deployment'], select: [field('deployment'), fn('count', 'total')] });

    const meta = buildExecutedMeta(sqlRequest, result([{ deployment: 'gpt-4o', total: 3 }]), [], '', translated);

    expect(meta).toMatchObject({
      kind: QueryRequestKind.Sql,
      mode: QueryMode.Aggregate,
      dimensionColumns: ['deployment'],
      aggregateColumns: ['total'],
    });
  });

  // The run reports what executed; it is not relabelled to slip past a chart-availability check.
  test('an untranslatable SQL run stays row-mode and classifies from the rows', () => {
    const meta = buildExecutedMeta(sqlRequest, result([{ deployment: 'gpt-4o', total: 3 }]), FIELDS, '', null);

    expect(meta.mode).toBe(QueryMode.Row);
    expect(meta.kind).toBe(QueryRequestKind.Sql);
    expect(meta.dimensionColumns).toEqual(['deployment', 'total']);
    expect(meta.aggregateColumns).toEqual(['total']);
    expect(meta.columnLabels).toEqual({});
  });

  // No group-by semantics behind that aggregateColumns list — it is every returned column, so
  // trusting it would compact an id or a raw epoch column.
  test('an untranslated SQL run withholds every value class', () => {
    const meta = buildExecutedMeta(sqlRequest, result([{ deployment: 'gpt-4o', total: 3 }]), FIELDS, '', null);

    expect(meta.columnValueClasses).toEqual({});
  });

  test('a translated SQL run over another entity withholds every value class', () => {
    const translated = query({ entity: 'conversations', group_by: ['deployment'], select: [field('deployment')] });

    const meta = buildExecutedMeta(
      sqlRequest,
      result([{ deployment: 'gpt-4o', total: 3 }]),
      FIELDS,
      'dial_usage_log',
      translated,
    );

    expect(meta.columnValueClasses).toEqual({});
  });

  test('schema display names apply when the translated entity is the selected one', () => {
    const translated = query({ entity: 'dial_usage_log', group_by: ['deployment'], select: [field('deployment')] });

    const meta = buildExecutedMeta(
      sqlRequest,
      result([{ deployment: 'gpt-4o', total: 3 }]),
      FIELDS,
      'dial_usage_log',
      translated,
    );

    expect(meta.columnLabels).toEqual({ deployment: 'Model' });
  });

  test('schema display names are withheld when the SQL ran against another entity', () => {
    const translated = query({ entity: 'conversations', group_by: ['deployment'], select: [field('deployment')] });

    const meta = buildExecutedMeta(
      sqlRequest,
      result([{ deployment: 'gpt-4o', total: 3 }]),
      FIELDS,
      'dial_usage_log',
      translated,
    );

    expect(meta.columnLabels).toEqual({});
  });

  test('a structured aggregate run keeps its group-by as dimensions and labels its columns', () => {
    const request: QueryRunRequest = { kind: QueryRequestKind.Structured, query: query({ group_by: ['deployment'] }) };

    const meta = buildExecutedMeta(request, result([{ deployment: 'gpt-4o', total: 3 }]), FIELDS, 'dial_usage_log');

    expect(meta).toMatchObject({
      kind: QueryRequestKind.Structured,
      mode: QueryMode.Aggregate,
      dimensionColumns: ['deployment'],
      aggregateColumns: ['total'],
      columnLabels: { deployment: 'Model' },
    });
  });

  test('a structured row-mode run has no dimensions, so nothing can be charted', () => {
    const request: QueryRunRequest = { kind: QueryRequestKind.Structured, query: query({ mode: QueryMode.Row }) };

    const meta = buildExecutedMeta(request, result([{ deployment: 'gpt-4o' }]), FIELDS, 'dial_usage_log');

    expect(meta.dimensionColumns).toEqual([]);
    expect(meta.mode).toBe(QueryMode.Row);
  });

  // In row mode `aggregateColumns` degenerates to every returned column, so a scalar-function alias
  // with no schema field must stay unformatted even though its every value is whole.
  test('a row-mode alias with no schema field stays unformatted even though its values are whole', () => {
    const request: QueryRunRequest = { kind: QueryRequestKind.Structured, query: query({ mode: QueryMode.Row }) };

    const meta = buildExecutedMeta(request, result([{ bucket: 1000 }, { bucket: 2000 }]), FIELDS, 'dial_usage_log');

    expect(meta.columnValueClasses).toEqual({});
  });

  test('a structured aggregate run classifies a measure alias with no schema field from its values', () => {
    const request: QueryRunRequest = { kind: QueryRequestKind.Structured, query: query({ group_by: ['deployment'] }) };

    const meta = buildExecutedMeta(request, result([{ deployment: 'gpt-4o', total: 3 }]), FIELDS, 'dial_usage_log');

    expect(meta.columnValueClasses).toEqual({ total: ResultValueClass.Compact });
  });

  // A measure column that names a schema field of a non-numeric type (Enum) must stay unformatted
  // even when its values happen to parse as numbers — the declared type decides, not the values.
  test('a structured aggregate run withholds the class of a declared Enum measure with numeric-looking values', () => {
    const enumFields: AnalyticsEntityField[] = [
      ...FIELDS,
      { name: 'status', type: AnalyticsFieldType.Enum, source: 'status' },
    ];
    const request: QueryRunRequest = { kind: QueryRequestKind.Structured, query: query({ group_by: ['deployment'] }) };

    const meta = buildExecutedMeta(
      request,
      result([
        { deployment: 'gpt-4o', status: '200' },
        { deployment: 'gpt-4o', status: '429' },
      ]),
      enumFields,
      'dial_usage_log',
    );

    expect(meta.columnValueClasses).toEqual({});
  });
});
