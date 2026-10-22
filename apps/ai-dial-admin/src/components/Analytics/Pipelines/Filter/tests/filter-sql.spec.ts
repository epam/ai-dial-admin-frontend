import { describe, expect, test } from 'vitest';

import {
  createFilterRow,
  getRowIssue,
  quoteIdentifier,
  quoteString,
  renderFilterSql,
  splitInValues,
} from '@/src/components/Analytics/Pipelines/Filter/filter-sql';
import {
  PipelineFilterMatch,
  PipelineFilterOperator,
  PipelineFilterRow,
  PipelineFilterRowIssue,
} from '@/src/components/Analytics/Pipelines/Filter/models';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

const field = (name: string, type: AnalyticsFieldType): AnalyticsEntityField => ({ name, type, source: 'src' });

const FIELDS: AnalyticsEntityField[] = [
  field('deployment', AnalyticsFieldType.String),
  field('id', AnalyticsFieldType.Uuid),
  field('status', AnalyticsFieldType.Enum),
  field('code', AnalyticsFieldType.Integer),
  field('tokens', AnalyticsFieldType.Long),
  field('cost', AnalyticsFieldType.Decimal),
  field('success', AnalyticsFieldType.Boolean),
  field('day', AnalyticsFieldType.Date),
  field('at', AnalyticsFieldType.Timestamp),
  field('labels.label', AnalyticsFieldType.String),
];

const row = (fieldName: string, operator: PipelineFilterOperator, value = ''): PipelineFilterRow => ({
  id: `${fieldName}-${operator}`,
  field: fieldName,
  operator,
  value,
});

const renderOne = (value: PipelineFilterRow): string => renderFilterSql([value], PipelineFilterMatch.All, FIELDS).sql;

describe('quoteIdentifier', () => {
  test('wraps a name in double quotes and doubles any quote inside it', () => {
    expect(quoteIdentifier('deployment')).toBe('"deployment"');
    expect(quoteIdentifier('we"ird')).toBe('"we""ird"');
  });

  test('quotes an enrichment column as one qualified identifier', () => {
    expect(quoteIdentifier('labels.label')).toBe('"labels.label"');
  });
});

describe('quoteString', () => {
  test('wraps a value in single quotes and doubles any quote inside it', () => {
    expect(quoteString("o'neil")).toBe("'o''neil'");
    expect(quoteString('')).toBe("''");
  });
});

describe('splitInValues', () => {
  test('splits on commas, trims and drops empty items', () => {
    expect(splitInValues(' 200, 201 ,,')).toEqual(['200', '201']);
    expect(splitInValues('')).toEqual([]);
  });
});

describe('renderFilterSql — literals by column type', () => {
  test('renders a string and a uuid quoted', () => {
    expect(renderOne(row('deployment', PipelineFilterOperator.Eq, "o'neil"))).toBe(`"deployment" = 'o''neil'`);
    expect(renderOne(row('id', PipelineFilterOperator.Eq, 'a-b'))).toBe(`"id" = 'a-b'`);
  });

  test('renders an enum value as a string', () => {
    expect(renderOne(row('status', PipelineFilterOperator.Ne, 'failed'))).toBe(`"status" <> 'failed'`);
  });

  test('renders numbers bare', () => {
    expect(renderOne(row('code', PipelineFilterOperator.Ge, '200'))).toBe('"code" >= 200');
    expect(renderOne(row('tokens', PipelineFilterOperator.Lt, '-5'))).toBe('"tokens" < -5');
    expect(renderOne(row('cost', PipelineFilterOperator.Gt, '0.25'))).toBe('"cost" > 0.25');
  });

  test('renders a boolean as a keyword', () => {
    expect(renderOne(row('success', PipelineFilterOperator.Eq, 'false'))).toBe('"success" = FALSE');
  });

  test('renders a date and a timestamp with their type keyword', () => {
    expect(renderOne(row('day', PipelineFilterOperator.Le, '2026-10-01'))).toBe(`"day" <= DATE '2026-10-01'`);
    expect(renderOne(row('at', PipelineFilterOperator.Gt, '2026-10-01 08:30:00.5'))).toBe(
      `"at" > TIMESTAMP '2026-10-01 08:30:00.5'`,
    );
  });

  test('keeps a string value exactly as typed, edge spaces included', () => {
    expect(renderOne(row('deployment', PipelineFilterOperator.Eq, 'x '))).toBe(`"deployment" = 'x '`);
    expect(renderOne(row('deployment', PipelineFilterOperator.Eq, ' '))).toBe(`"deployment" = ' '`);
  });

  test('trims a single non-text value before rendering it', () => {
    expect(renderOne(row('code', PipelineFilterOperator.Eq, ' 7 '))).toBe('"code" = 7');
  });
});

describe('renderFilterSql — operators', () => {
  test('renders every comparison operator', () => {
    expect(renderOne(row('code', PipelineFilterOperator.Eq, '1'))).toBe('"code" = 1');
    expect(renderOne(row('code', PipelineFilterOperator.Ne, '1'))).toBe('"code" <> 1');
    expect(renderOne(row('code', PipelineFilterOperator.Lt, '1'))).toBe('"code" < 1');
    expect(renderOne(row('code', PipelineFilterOperator.Gt, '1'))).toBe('"code" > 1');
    expect(renderOne(row('code', PipelineFilterOperator.Le, '1'))).toBe('"code" <= 1');
    expect(renderOne(row('code', PipelineFilterOperator.Ge, '1'))).toBe('"code" >= 1');
  });

  test('renders contains as a case-insensitive pattern, escaping quotes', () => {
    expect(renderOne(row('deployment', PipelineFilterOperator.Contains, "gpt'4"))).toBe(
      `"deployment" ILIKE '%gpt''4%'`,
    );
    expect(renderOne(row('deployment', PipelineFilterOperator.NotContains, 'gpt'))).toBe(
      `"deployment" NOT ILIKE '%gpt%'`,
    );
  });

  test('renders in as a typed list', () => {
    expect(renderOne(row('code', PipelineFilterOperator.In, '200, 201'))).toBe('"code" IN (200, 201)');
    expect(renderOne(row('status', PipelineFilterOperator.In, 'ok, failed'))).toBe(`"status" IN ('ok', 'failed')`);
  });

  test('renders emptiness as a null check with no value', () => {
    expect(renderOne(row('deployment', PipelineFilterOperator.IsEmpty))).toBe('"deployment" IS NULL');
    expect(renderOne(row('deployment', PipelineFilterOperator.IsNotEmpty))).toBe('"deployment" IS NOT NULL');
  });
});

describe('renderFilterSql — lists', () => {
  const rows = [row('deployment', PipelineFilterOperator.Eq, 'a'), row('code', PipelineFilterOperator.Gt, '1')];

  test('joins conditions with AND when every one must match', () => {
    expect(renderFilterSql(rows, PipelineFilterMatch.All, FIELDS)).toEqual({
      sql: `"deployment" = 'a' AND "code" > 1`,
      skippedCount: 0,
    });
  });

  test('joins conditions with OR when any may match', () => {
    expect(renderFilterSql(rows, PipelineFilterMatch.Any, FIELDS).sql).toBe(`"deployment" = 'a' OR "code" > 1`);
  });

  test('renders an empty list as no filter', () => {
    expect(renderFilterSql([], PipelineFilterMatch.All, FIELDS)).toEqual({ sql: '', skippedCount: 0 });
  });

  test('leaves out rows it cannot write and counts those that name a column', () => {
    const result = renderFilterSql(
      [...rows, row('code', PipelineFilterOperator.Eq), createFilterRow()],
      PipelineFilterMatch.All,
      FIELDS,
    );
    expect(result).toEqual({ sql: `"deployment" = 'a' AND "code" > 1`, skippedCount: 1 });
  });

  test('renders a column the schema no longer lists as a string', () => {
    expect(renderOne(row('gone', PipelineFilterOperator.Eq, '1'))).toBe(`"gone" = '1'`);
  });
});

describe('getRowIssue', () => {
  test('reports a row with no column or no value as incomplete', () => {
    expect(getRowIssue(createFilterRow(), FIELDS)).toBe(PipelineFilterRowIssue.Incomplete);
    expect(getRowIssue(row('code', PipelineFilterOperator.Eq, '  '), FIELDS)).toBe(PipelineFilterRowIssue.Incomplete);
    expect(getRowIssue(row('deployment', PipelineFilterOperator.Contains), FIELDS)).toBe(
      PipelineFilterRowIssue.Incomplete,
    );
    expect(getRowIssue(row('code', PipelineFilterOperator.In, ', ,'), FIELDS)).toBe(PipelineFilterRowIssue.Incomplete);
  });

  test('accepts an emptiness check with no value', () => {
    expect(getRowIssue(row('code', PipelineFilterOperator.IsEmpty), FIELDS)).toBeUndefined();
  });

  test('refuses a LIKE wildcard in a contains value', () => {
    expect(getRowIssue(row('deployment', PipelineFilterOperator.Contains, 'a_b'), FIELDS)).toBe(
      PipelineFilterRowIssue.Wildcard,
    );
    expect(getRowIssue(row('deployment', PipelineFilterOperator.NotContains, '50%'), FIELDS)).toBe(
      PipelineFilterRowIssue.Wildcard,
    );
  });

  test('allows a wildcard character in an equality value', () => {
    expect(getRowIssue(row('deployment', PipelineFilterOperator.Eq, 'a_b'), FIELDS)).toBeUndefined();
  });

  test('refuses a value that does not match the column type', () => {
    expect(getRowIssue(row('code', PipelineFilterOperator.Eq, '1.5'), FIELDS)).toBe(
      PipelineFilterRowIssue.InvalidNumber,
    );
    expect(getRowIssue(row('cost', PipelineFilterOperator.Eq, 'abc'), FIELDS)).toBe(
      PipelineFilterRowIssue.InvalidNumber,
    );
    expect(getRowIssue(row('success', PipelineFilterOperator.Eq, 'yes'), FIELDS)).toBe(
      PipelineFilterRowIssue.InvalidBoolean,
    );
    expect(getRowIssue(row('day', PipelineFilterOperator.Eq, '01.10.2026'), FIELDS)).toBe(
      PipelineFilterRowIssue.InvalidDate,
    );
    expect(getRowIssue(row('at', PipelineFilterOperator.Eq, '2026-10-01'), FIELDS)).toBe(
      PipelineFilterRowIssue.InvalidTimestamp,
    );
  });

  test('checks every item of an in list', () => {
    expect(getRowIssue(row('code', PipelineFilterOperator.In, '1, x'), FIELDS)).toBe(
      PipelineFilterRowIssue.InvalidNumber,
    );
    expect(getRowIssue(row('code', PipelineFilterOperator.In, '1, 2'), FIELDS)).toBeUndefined();
  });
});
