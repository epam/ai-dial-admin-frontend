import { describe, expect, test } from 'vitest';

import { BUCKET_ROW_LIMIT, USAGE_ENTITY, USAGE_VIEW_EVENT_KINDS } from '@/src/components/Analytics/Usage/constants';
import { BreakdownTab, SpendScaleUnit, UsageView } from '@/src/components/Analytics/Usage/models';
import {
  BUCKET_ALIAS,
  CALLERS_ALIAS,
  CALLS_ALIAS,
  COMPLETION_TOKENS_ALIAS,
  PROMPT_TOKENS_ALIAS,
  P50_LATENCY_ALIAS,
  P95_LATENCY_ALIAS,
  QueryScope,
  SPEND_ALIAS,
  TOOL_CALLS_ALIAS,
  buildBucketedQuery,
  buildDimensionBucketedQuery,
  buildFilter,
  buildSpendBucketedQuery,
  buildTabQuery,
  buildTotalsQuery,
} from '@/src/components/Analytics/Usage/queries';
import { QueryExprType, QueryOperator, QueryValueType, StructuredQuery } from '@/src/models/analytics/query';

const WINDOW = {
  startDate: new Date('2026-09-17T12:00:00.000Z'),
  endDate: new Date('2026-09-17T13:00:00.000Z'),
};

const scope = (overrides: Partial<QueryScope> = {}): QueryScope => ({
  view: UsageView.Llm,
  window: WINDOW,
  ...overrides,
});

const RESOLUTION = { value: 15, unit: 'm' as const };

const aliasesOf = (query: StructuredQuery) => (query.select ?? []).map((entry) => entry.as).filter(Boolean);

const clausesOf = (query: StructuredQuery) => (query.filter as { args: { op: string }[] }).args;

describe('buildFilter', () => {
  test('bounds the window with epoch-millis literals, which is the only form the backend parses', () => {
    const [, from, to] = clausesOf({ filter: buildFilter(scope()) } as StructuredQuery);

    expect(from).toEqual({
      op: QueryOperator.Ge,
      args: [
        { type: QueryExprType.Field, name: 'request_time' },
        { type: QueryExprType.Value, value_type: QueryValueType.Timestamp, value: String(WINDOW.startDate.getTime()) },
      ],
    });
    expect(to).toMatchObject({ op: QueryOperator.Lt });
  });

  test('takes the LLM view to include the rows whose event kind is empty', () => {
    expect(USAGE_VIEW_EVENT_KINDS[UsageView.Llm]).toContain('');
  });

  test('adds a deployment clause only when one is asked for', () => {
    expect(clausesOf({ filter: buildFilter(scope()) } as StructuredQuery)).toHaveLength(3);
    expect(clausesOf({ filter: buildFilter(scope({ entityFilter: 'gpt-4o' })) } as StructuredQuery)).toHaveLength(4);
  });
});

describe('buildTotalsQuery', () => {
  test('groups by nothing, so a distinct user counts once for the window', () => {
    const query = buildTotalsQuery(scope());

    expect(query.entity).toBe(USAGE_ENTITY);
    expect(query.group_by).toBeUndefined();
  });

  test('carries the price and token figures in the LLM view', () => {
    expect(aliasesOf(buildTotalsQuery(scope()))).toContain(SPEND_ALIAS);
  });

  test('counts callers by the principal reference, which an API-key call also carries', () => {
    const entry = (buildTotalsQuery(scope()).select ?? []).find((select) => select.as === CALLERS_ALIAS);

    expect(entry?.expr).toEqual({
      type: QueryExprType.Fn,
      name: 'count',
      args: [{ type: QueryExprType.Field, name: 'usage_client_identity.user_ref' }],
      distinct: true,
    });
  });

  test('sums tokens over the same rows as spend, so a figure derived from both shares one basis', () => {
    const select = buildTotalsQuery(scope()).select ?? [];
    const tokenAliases = [PROMPT_TOKENS_ALIAS, COMPLETION_TOKENS_ALIAS];

    for (const alias of tokenAliases) {
      const entry = select.find((item) => item.as === alias);

      expect(entry?.expr).toEqual({
        type: QueryExprType.Fn,
        name: 'sum',
        args: [{ type: QueryExprType.Field, name: alias }],
      });
    }
  });

  test('carries tool calls instead in the MCP view, which records no price', () => {
    const aliases = aliasesOf(buildTotalsQuery(scope({ view: UsageView.Mcp })));

    expect(aliases).toContain(TOOL_CALLS_ALIAS);
    expect(aliases).not.toContain(SPEND_ALIAS);
  });
});

describe('buildBucketedQuery', () => {
  const query = buildBucketedQuery(scope(), RESOLUTION);

  test('bins the window at the chart resolution', () => {
    expect(query.select?.[0]).toEqual({
      expr: {
        type: QueryExprType.Fn,
        name: 'date_bin',
        args: [
          { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: '15' },
          { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'minute' },
          { type: QueryExprType.Field, name: 'request_time' },
        ],
      },
      as: BUCKET_ALIAS,
    });
  });

  test('asks for the percentiles only here, where the distribution is plotted', () => {
    expect(aliasesOf(query)).toEqual(expect.arrayContaining([P50_LATENCY_ALIAS, P95_LATENCY_ALIAS]));
    expect(aliasesOf(buildTotalsQuery(scope()))).not.toContain(P95_LATENCY_ALIAS);
  });

  test('states a row limit, since an unstated one is cut at a hundred without a word', () => {
    expect(query.page).toMatchObject({ limit: BUCKET_ROW_LIMIT });
  });
});

describe('buildTabQuery', () => {
  test('groups by the tab dimension and ranks by calls', () => {
    const query = buildTabQuery(scope(), BreakdownTab.Models, 10);

    expect(query.group_by).toEqual(['deployment']);
    expect(query.sort?.[0]).toMatchObject({ field: CALLS_ALIAS, dir: 'desc' });
    expect(query.page).toMatchObject({ limit: 10 });
  });

  test('groups an application breakdown by the calling deployment', () => {
    expect(buildTabQuery(scope(), BreakdownTab.Applications, 10).group_by).toEqual(['parent_deployment']);
  });

  test('adds no search clause when no term was typed', () => {
    expect(clausesOf(buildTabQuery(scope(), BreakdownTab.Models, 10))).toHaveLength(3);
  });

  test('filters the aggregate by the term, so it reaches rows no page held', () => {
    const clauses = clausesOf(buildTabQuery(scope(), BreakdownTab.Models, 10, 'gpt'));

    expect(clauses).toHaveLength(4);
    expect(clauses[3]).toMatchObject({ op: QueryOperator.Ico });
  });
});

describe('buildDimensionBucketedQuery', () => {
  const query = buildDimensionBucketedQuery(scope(), RESOLUTION, BreakdownTab.Models, ['a', 'b']);

  test('splits each bucket by the dimension', () => {
    expect(query.group_by).toEqual([BUCKET_ALIAS, 'deployment']);
  });

  test('bounds the series by the ranking already resolved, not by a page limit', () => {
    const clause = clausesOf(query).at(-1) as { op: string; args: { items?: unknown[] }[] };

    expect(clause.op).toBe(QueryOperator.In);
    expect(clause.args[1].items).toHaveLength(2);
  });

  test('states a row limit for the bucket-by-series rows it produces', () => {
    expect(query.page).toMatchObject({ limit: BUCKET_ROW_LIMIT });
  });
});

describe('buildSpendBucketedQuery', () => {
  test('truncates to the calendar unit the spend scale reads on', () => {
    const query = buildSpendBucketedQuery(scope(), SpendScaleUnit.Month);

    expect(query.select?.[0].expr).toMatchObject({ name: 'date_trunc' });
    expect(query.select?.[0].expr).toMatchObject({
      args: [{ value: 'month' }, { name: 'request_time' }],
    });
  });

  test('carries spend alone, since the view reads no other figure', () => {
    expect(aliasesOf(buildSpendBucketedQuery(scope(), SpendScaleUnit.Day))).toEqual([BUCKET_ALIAS, SPEND_ALIAS]);
  });
});
