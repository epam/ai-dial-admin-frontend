import { describe, expect, test } from 'vitest';

import {
  ANALYTICS_BASE_URL_PLACEHOLDER,
  ANALYTICS_FLIGHT_SQL_URL_PLACEHOLDER,
} from '@/src/components/Analytics/Tables/ConnectPanel/constants';
import {
  buildConnectSnippets,
  buildFormatNotes,
  buildSampleRow,
  toJsonLiteral,
  toPythonLiteral,
} from '@/src/components/Analytics/Tables/ConnectPanel/connect-snippets';
import { ConnectFormatRule } from '@/src/components/Analytics/Tables/ConnectPanel/models';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableColumn, AnalyticsTableType } from '@/src/models/analytics/table';

const column = (overrides: Partial<AnalyticsTableColumn> & Pick<AnalyticsTableColumn, 'name'>): AnalyticsTableColumn =>
  ({
    source_name: overrides.name,
    type: AnalyticsFieldType.String,
    ...overrides,
  }) as AnalyticsTableColumn;

const table = (columns: AnalyticsTableColumn[], overrides: Partial<AnalyticsTable> = {}): AnalyticsTable => ({
  name: 'widget_metrics',
  type: AnalyticsTableType.Source,
  columns,
  ...overrides,
});

describe('buildSampleRow', () => {
  // The domain is closed and the server refuses a value outside it, so the generic sample literal would be
  // a row the reader cannot insert.
  test('gives an enum column one of its own declared values, not a placeholder', () => {
    const row = buildSampleRow(
      table([
        column({
          name: 'status',
          type: AnalyticsFieldType.Enum,
          enum_values: ['pending', 'running', 'failed'],
        }),
      ]),
    );
    expect(row).toEqual({ status: 'pending' });
  });

  test('falls back to the type sample for an enum column declaring no values', () => {
    const row = buildSampleRow(table([column({ name: 'status', type: AnalyticsFieldType.Enum })]));
    expect(row.status).toBe('example');
  });

  test('gives every column type a literal that is valid input for that type', () => {
    const row = buildSampleRow(
      table([
        column({ name: 'a', type: AnalyticsFieldType.Uuid }),
        column({ name: 'b', type: AnalyticsFieldType.String }),
        column({ name: 'c', type: AnalyticsFieldType.Integer }),
        column({ name: 'd', type: AnalyticsFieldType.Long }),
        column({ name: 'e', type: AnalyticsFieldType.Decimal }),
        column({ name: 'f', type: AnalyticsFieldType.Boolean }),
        column({ name: 'g', type: AnalyticsFieldType.Date }),
        column({ name: 'h', type: AnalyticsFieldType.Timestamp }),
        column({ name: 'i', type: AnalyticsFieldType.Object }),
      ]),
    );

    expect(row.a).toBe('8f14e45f-ceea-4d1b-a1c0-9c1e6d3b7a52');
    expect(row.b).toBe('example');
    expect(row.c).toBe(42);
    expect(row.d).toBe(42);
    expect(row.f).toBe(true);
    expect(row.g).toBe('2026-01-15');
    expect(row.i).toEqual({});
  });

  test('quotes a decimal so its digits survive rather than passing through a float', () => {
    const row = buildSampleRow(table([column({ name: 'score', type: AnalyticsFieldType.Decimal })]));

    expect(row.score).toBe('94.25');
    expect(typeof row.score).toBe('string');
  });

  test('writes a timestamp in the space-separated form the insert path accepts', () => {
    const row = buildSampleRow(table([column({ name: 'recorded_at', type: AnalyticsFieldType.Timestamp })]));

    expect(row.recorded_at).toBe('2026-01-15 10:00:00.000');
    expect(row.recorded_at).not.toContain('T');
    expect(row.recorded_at).not.toContain('Z');
  });

  test('shapes an array by its element type', () => {
    const strings = buildSampleRow(
      table([column({ name: 'tags', type: AnalyticsFieldType.Array, element_type: AnalyticsFieldType.String })]),
    );
    const numbers = buildSampleRow(
      table([column({ name: 'sizes', type: AnalyticsFieldType.Array, element_type: AnalyticsFieldType.Long })]),
    );

    expect(strings.tags).toEqual(['example', 'example']);
    expect(numbers.sizes).toEqual([42, 42]);
  });

  test('keys by the physical source name when it differs from the exposed name', () => {
    const row = buildSampleRow(table([column({ name: 'total_cost', source_name: 'total_money' })]));

    expect(Object.keys(row)).toEqual(['total_money']);
  });

  test('omits platform-owned columns', () => {
    const row = buildSampleRow(table([column({ name: 'kept' }), column({ name: '_updated_at' })]));

    expect(Object.keys(row)).toEqual(['kept']);
  });

  test('carries no grain key — the panel is never offered for an enrichment table', () => {
    const row = buildSampleRow(
      table([column({ name: 'score', type: AnalyticsFieldType.Decimal })], {
        type: AnalyticsTableType.Enrichment,
        grain: { grain_key: 'event_id' },
      }),
    );

    expect(Object.keys(row)).toEqual(['score']);
  });

  test('yields an empty row for a table with no declared columns', () => {
    expect(buildSampleRow(table([]))).toEqual({});
  });
});

describe('literal serializers', () => {
  test('python spells booleans its own way and quotes decimals', () => {
    const literal = toPythonLiteral({ healthy: true, score: '94.25', views: 42, tags: ['a'] });

    expect(literal).toContain('"healthy": True');
    expect(literal).toContain('"score": "94.25"');
    expect(literal).toContain('"views": 42');
    expect(literal).toContain('"tags": ["a"]');
  });

  test('json spells booleans its own way', () => {
    const literal = toJsonLiteral({ healthy: true, score: '94.25' }, '');

    expect(literal).toContain('"healthy": true');
    expect(literal).toContain('"score": "94.25"');
  });

  test('renders an empty row without a dangling body', () => {
    expect(toPythonLiteral({})).toBe('{}');
    expect(toJsonLiteral({}, '')).toBe('{}');
  });
});

describe('buildFormatNotes', () => {
  test('names the columns a rule applies to, never the type', () => {
    const notes = buildFormatNotes(
      table([
        column({ name: 'score', type: AnalyticsFieldType.Decimal }),
        column({ name: 'recorded_at', type: AnalyticsFieldType.Timestamp }),
      ]),
    );

    expect(notes).toEqual([
      { rule: ConnectFormatRule.Timestamp, columns: ['recorded_at'] },
      { rule: ConnectFormatRule.Decimal, columns: ['score'] },
    ]);
  });

  test('collapses several columns of one type into a single note', () => {
    const notes = buildFormatNotes(
      table([
        column({ name: 'created_at', type: AnalyticsFieldType.Timestamp }),
        column({ name: 'updated_at', type: AnalyticsFieldType.Timestamp }),
      ]),
    );

    expect(notes).toEqual([{ rule: ConnectFormatRule.Timestamp, columns: ['created_at', 'updated_at'] }]);
  });

  test('returns nothing when no column carries a rule', () => {
    const notes = buildFormatNotes(
      table([column({ name: 'region' }), column({ name: 'views', type: AnalyticsFieldType.Integer })]),
    );

    expect(notes).toEqual([]);
  });

  test('names a column by its exposed name, which is what the grid shows', () => {
    const notes = buildFormatNotes(
      table([column({ name: 'total_cost', source_name: 'total_money', type: AnalyticsFieldType.Decimal })]),
    );

    expect(notes).toEqual([{ rule: ConnectFormatRule.Decimal, columns: ['total_cost'] }]);
  });
});

describe('buildConnectSnippets', () => {
  const widgets = table(
    [
      column({ name: 'event_id', type: AnalyticsFieldType.Uuid }),
      column({ name: 'score', type: AnalyticsFieldType.Decimal }),
      column({ name: '_ingested_at', type: AnalyticsFieldType.Timestamp }),
    ],
    { ordering_key: ['event_id'] },
  );

  const noEndpoints = { baseUrl: '', flightUri: '' };

  test('defaults the endpoint to the configured public URL', () => {
    const snippets = buildConnectSnippets(widgets, { baseUrl: 'https://analytics.example.com', flightUri: '' });

    expect(snippets.pythonWrite).toContain('https://analytics.example.com');
    expect(snippets.restEndpoint).toContain('https://analytics.example.com');
  });

  test('keeps the shared block to the key alone, so an example needing no REST endpoint sets none', () => {
    const snippets = buildConnectSnippets(widgets, { baseUrl: 'https://analytics.example.com', flightUri: '' });

    expect(snippets.auth).toContain('DIAL_API_KEY');
    expect(snippets.auth).not.toContain('DIAL_ANALYTICS_BASE_URL');
    expect(snippets.flightInstall).not.toContain('DIAL_ANALYTICS_BASE_URL');
    // It travels as its own block, shown with the REST examples that read it.
    expect(snippets.restEndpoint).toBe('export DIAL_ANALYTICS_BASE_URL=https://analytics.example.com');
  });

  test('falls back to the placeholder when no endpoint is configured', () => {
    const snippets = buildConnectSnippets(widgets, { baseUrl: '', flightUri: '' });

    expect(snippets.restEndpoint).toContain(ANALYTICS_BASE_URL_PLACEHOLDER);
    expect(snippets.pythonWrite).toContain(ANALYTICS_BASE_URL_PLACEHOLDER);
  });

  test('posts rows to this table and projects its ordering key on read', () => {
    const snippets = buildConnectSnippets(widgets, noEndpoints);

    expect(snippets.pythonWrite).toContain('/v1/tables/{TABLE}/rows');
    expect(snippets.curlWrite).toContain('/v1/tables/widget_metrics/rows');
    expect(snippets.pythonRead).toContain('SELECT "event_id" FROM widget_metrics LIMIT 100');
    expect(snippets.curlRead).toContain('/v1/queries/execute-sql');
  });

  test('projects the ordering key rather than every column, in all three read snippets', () => {
    const snippets = buildConnectSnippets(
      table(
        [
          column({ name: 'tenant_id' }),
          column({ name: 'event_time', type: AnalyticsFieldType.Timestamp }),
          column({ name: 'total', type: AnalyticsFieldType.Decimal }),
        ],
        { ordering_key: ['tenant_id', 'event_time'] },
      ),
      noEndpoints,
    );
    const statement = 'SELECT "tenant_id", "event_time" FROM widget_metrics LIMIT 100';

    expect(snippets.pythonRead).toContain(statement);
    expect(snippets.flightRead).toContain(statement);
    // The curl body carries the same statement, JSON-encoded.
    expect(snippets.curlRead).toContain(`"sql":${JSON.stringify(statement)}`);
    expect(snippets.pythonRead).not.toContain('total');
  });

  test('encodes the curl body so a name carrying a quote or backslash cannot break it', () => {
    // A system table's column names are not validated by this app, so the JSON body has to survive
    // characters an identifier is not expected to hold. Escaping the quotes by hand left a backslash
    // untouched and produced a body that would not parse.
    const messy = ['back\\slash', 'qu\"ote'];
    const snippets = buildConnectSnippets(table([column({ name: 'ok' })], { ordering_key: messy }), noEndpoints);
    const payload = snippets.curlRead.match(/-d '(.*)'$/m)?.[1] ?? '';

    expect(() => JSON.parse(payload)).not.toThrow();
    const { sql } = JSON.parse(payload);
    messy.forEach((name) => expect(sql).toContain(`"${name}"`));
  });

  test('projects the ordering key by exposed name, which is what the query resolves', () => {
    // `ordering_key` reports physical source_names; the query surface publishes each source column under
    // its exposed name and binds the SELECT list against that. The two differ only on a table created
    // through the API, where projecting the physical name is an unknown-column error.
    const snippets = buildConnectSnippets(
      table([column({ name: 'event_id', source_name: 'evt_id' })], { ordering_key: ['evt_id'] }),
      noEndpoints,
    );

    expect(snippets.pythonRead).toContain('SELECT "event_id" FROM widget_metrics LIMIT 100');
    expect(snippets.pythonRead).not.toContain('evt_id');
  });

  test('leaves an ordering-key entry no declared column matches as reported', () => {
    // A system table's key may name a column its payload does not carry; nothing better is known about
    // such an entry than the name itself.
    const snippets = buildConnectSnippets(
      table([column({ name: 'score' })], { ordering_key: ['event_id'] }),
      noEndpoints,
    );

    expect(snippets.pythonRead).toContain('SELECT "event_id" FROM widget_metrics LIMIT 100');
  });

  test('drops a platform column the ordering key names', () => {
    const snippets = buildConnectSnippets(
      table([column({ name: 'event_id' })], { ordering_key: ['_ingested_at', 'event_id'] }),
      noEndpoints,
    );

    expect(snippets.pythonRead).toContain('SELECT "event_id" FROM widget_metrics LIMIT 100');
  });

  test('projects a wildcard when the table declares no ordering key', () => {
    const snippets = buildConnectSnippets(table([column({ name: 'event_id' })]), noEndpoints);

    expect(snippets.pythonRead).toContain('SELECT * FROM widget_metrics LIMIT 100');
  });

  test('projects a wildcard when the ordering key names only platform columns', () => {
    const snippets = buildConnectSnippets(
      table([column({ name: 'event_id' })], { ordering_key: ['_ingested_at'] }),
      noEndpoints,
    );

    expect(snippets.pythonRead).toContain('SELECT * FROM widget_metrics LIMIT 100');
  });

  test('keeps platform columns out of every snippet', () => {
    const snippets = buildConnectSnippets(widgets, { baseUrl: '', flightUri: '' });

    Object.values(snippets).forEach((snippet) => expect(snippet).not.toContain('_ingested_at'));
  });

  test('defaults the Flight endpoint to the configured URI', () => {
    const snippets = buildConnectSnippets(widgets, {
      baseUrl: '',
      flightUri: 'grpc://analytics.example.com:32010',
    });

    expect(snippets.flightInstall).toContain('grpc://analytics.example.com:32010');
    expect(snippets.flightRead).toContain('grpc://analytics.example.com:32010');
  });

  test('falls back to the Flight placeholder, which is not derived from the REST endpoint', () => {
    const snippets = buildConnectSnippets(widgets, { baseUrl: 'https://analytics.example.com', flightUri: '' });

    expect(snippets.flightInstall).toContain(ANALYTICS_FLIGHT_SQL_URL_PLACEHOLDER);
    expect(snippets.flightInstall).not.toContain('https://analytics.example.com');
  });

  test('asks the reader to set only DIAL-branded names, never the internal service name', () => {
    const snippets = buildConnectSnippets(widgets, { baseUrl: '', flightUri: '' });
    const all = Object.values(snippets).join('\n');

    expect(all).toContain('DIAL_API_KEY');
    expect(all).toContain('DIAL_ANALYTICS_BASE_URL');
    expect(all).toContain('DIAL_ANALYTICS_FLIGHT_SQL_URL');
    expect(all.toLowerCase()).not.toContain('adas');
  });

  test('projects a wildcard when the table declares no columns', () => {
    const snippets = buildConnectSnippets(table([]), { baseUrl: '', flightUri: '' });

    expect(snippets.pythonRead).toContain('SELECT * FROM widget_metrics');
    expect(snippets.pythonWrite).toContain('ROW = {}');
  });
});

describe('buildConnectSnippets — enrichment table', () => {
  const noEndpoints = { baseUrl: '', flightUri: '' };

  const enrichment = (overrides: Partial<AnalyticsTable> = {}): AnalyticsTable => ({
    name: 'widget_scores',
    type: AnalyticsTableType.Enrichment,
    source_table: 'widget_events',
    grain: { grain_key: 'event_id' },
    columns: [column({ name: 'score', type: AnalyticsFieldType.Decimal })],
    ...overrides,
  });

  test('reads through the source table, qualifying the enrichment column', () => {
    const snippets = buildConnectSnippets(enrichment(), noEndpoints);
    const statement = 'SELECT "event_id", "widget_scores.score" FROM widget_events LIMIT 100';

    expect(snippets.pythonRead).toContain(statement);
    expect(snippets.flightRead).toContain(statement);
    expect(snippets.pythonRead).not.toContain('FROM widget_scores');
  });

  test('keeps the statement inside a literal its language can carry', () => {
    const snippets = buildConnectSnippets(enrichment(), noEndpoints);

    // Python takes the quoted identifiers in a single-quoted literal; a JSON body has to escape them.
    expect(snippets.pythonRead).toContain(`SQL = 'SELECT "event_id", "widget_scores.score"`);
    expect(snippets.curlRead).toContain('\\"widget_scores.score\\"');
    expect(snippets.curlRead).not.toContain('"sql":"SELECT "event_id"');
  });

  test('projects the grain key alone when the enrichment declares only platform columns', () => {
    const snippets = buildConnectSnippets(
      enrichment({ columns: [column({ name: '_ingested_at', type: AnalyticsFieldType.Timestamp })] }),
      noEndpoints,
    );

    expect(snippets.pythonRead).toContain('SELECT "event_id" FROM widget_events LIMIT 100');
  });

  test('projects a wildcard when it has neither a grain key nor a usable column', () => {
    const snippets = buildConnectSnippets(enrichment({ grain: undefined, columns: [] }), noEndpoints);

    expect(snippets.pythonRead).toContain('SELECT * FROM widget_events LIMIT 100');
  });

  test('never emits an unnamed relation when the payload names no source table', () => {
    const snippets = buildConnectSnippets(enrichment({ source_table: undefined }), noEndpoints);

    expect(snippets.pythonRead).not.toContain('undefined');
  });
});
