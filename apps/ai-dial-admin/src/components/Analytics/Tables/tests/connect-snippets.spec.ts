import { describe, expect, test } from 'vitest';

import { ADAS_BASE_URL_PLACEHOLDER } from '@/src/components/Analytics/Tables/ConnectPanel/constants';
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

  test('leads an enrichment row with its grain key', () => {
    const row = buildSampleRow(
      table([column({ name: 'score', type: AnalyticsFieldType.Decimal })], {
        type: AnalyticsTableType.Enrichment,
        grain: { grain_key: 'event_id' },
      }),
    );

    expect(Object.keys(row)).toEqual(['event_id', 'score']);
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
  const widgets = table([
    column({ name: 'event_id', type: AnalyticsFieldType.Uuid }),
    column({ name: 'score', type: AnalyticsFieldType.Decimal }),
    column({ name: '_ingested_at', type: AnalyticsFieldType.Timestamp }),
  ]);

  test('defaults the endpoint to the configured public URL', () => {
    const snippets = buildConnectSnippets(widgets, 'https://analytics.example.com');

    expect(snippets.auth).toContain('https://analytics.example.com');
    expect(snippets.pythonWrite).toContain('https://analytics.example.com');
  });

  test('falls back to the placeholder when no endpoint is configured', () => {
    const snippets = buildConnectSnippets(widgets, '');

    expect(snippets.auth).toContain(ADAS_BASE_URL_PLACEHOLDER);
    expect(snippets.pythonWrite).toContain(ADAS_BASE_URL_PLACEHOLDER);
  });

  test('posts rows to this table and projects its columns on read', () => {
    const snippets = buildConnectSnippets(widgets, '');

    expect(snippets.pythonWrite).toContain('/v1/tables/{TABLE}/rows');
    expect(snippets.curlWrite).toContain('/v1/tables/widget_metrics/rows');
    expect(snippets.pythonRead).toContain('SELECT event_id, score FROM widget_metrics LIMIT 100');
    expect(snippets.curlRead).toContain('/v1/queries/execute-sql');
  });

  test('keeps platform columns out of every snippet', () => {
    const snippets = buildConnectSnippets(widgets, '');

    Object.values(snippets).forEach((snippet) => expect(snippet).not.toContain('_ingested_at'));
  });

  test('projects a wildcard when the table declares no columns', () => {
    const snippets = buildConnectSnippets(table([]), '');

    expect(snippets.pythonRead).toContain('SELECT * FROM widget_metrics');
    expect(snippets.pythonWrite).toContain('ROW = {}');
  });
});
