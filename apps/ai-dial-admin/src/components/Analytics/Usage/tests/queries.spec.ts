import { describe, expect, test } from 'vitest';

import { BUCKET_ROW_LIMIT, USAGE_ENTITY, USAGE_VIEW_EVENT_KINDS } from '@/src/components/Analytics/Usage/constants';
import { BreakdownTab, UsageView } from '@/src/components/Analytics/Usage/models';
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
  buildBucketedQuery,
  buildDimensionBucketedQuery,
  buildDimensionSearchClause,
  buildFilter,
  buildSpendBucketedQuery,
  buildTabKeysQuery,
  buildTabQuery,
  buildTotalsQuery,
} from '@/src/components/Analytics/Usage/queries';
import {
  QueryExprType,
  QueryOperator,
  QuerySortDirection,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';

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

    expect(entry?.expr).toMatchObject({ name: 'count', distinct: true });
    // The hash is the fallback for an environment whose client-identity enrichment is not
    // provisioned: there the reference is null on every row and a bare count read zero.
    expect(JSON.stringify(entry?.expr)).toContain('usage_client_identity.user_ref');
    expect(JSON.stringify(entry?.expr)).toContain('user_hash');
  });

  test('counts tokens once per call, on the row that carries the price for it', () => {
    const select = buildTotalsQuery(scope()).select ?? [];

    for (const alias of [PROMPT_TOKENS_ALIAS, COMPLETION_TOKENS_ALIAS]) {
      const entry = select.find((item) => item.as === alias);

      expect(entry?.expr).toEqual({
        type: QueryExprType.Fn,
        name: 'sum',
        args: [
          {
            type: QueryExprType.Fn,
            name: 'if',
            args: [
              {
                type: QueryExprType.Fn,
                name: 'not_empty',
                args: [
                  {
                    type: QueryExprType.Fn,
                    name: 'to_string',
                    args: [{ type: QueryExprType.Field, name: 'deployment_price' }],
                  },
                ],
              },
              { type: QueryExprType.Field, name: alias },
              { type: QueryExprType.Value, value_type: QueryValueType.Integer, value: '0' },
            ],
          },
        ],
      });
    }
  });

  test('sums spend over every row, since an application row carries no price of its own', () => {
    const entry = (buildTotalsQuery(scope()).select ?? []).find((item) => item.as === SPEND_ALIAS);

    expect(entry?.expr).toEqual({
      type: QueryExprType.Fn,
      name: 'sum',
      args: [{ type: QueryExprType.Field, name: 'deployment_price' }],
    });
  });

  test('carries no price in the MCP view, which records none', () => {
    expect(aliasesOf(buildTotalsQuery(scope({ view: UsageView.Mcp })))).not.toContain(SPEND_ALIAS);
  });

  test('narrows the MCP view to tool calls, so its figures describe work and not connections', () => {
    const clauses = clausesOf(buildTotalsQuery(scope({ view: UsageView.Mcp })));

    expect(clauses).toContainEqual({
      op: QueryOperator.Eq,
      args: [
        { type: QueryExprType.Field, name: 'mcp_method' },
        { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'tools/call' },
      ],
    });
  });

  test('adds no method clause in the LLM view', () => {
    const clauses = clausesOf(buildTotalsQuery(scope()));

    expect(clauses.some((clause) => JSON.stringify(clause).includes('mcp_method'))).toBe(false);
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

  test('ranks on the measure the caller asked for, since the backend takes the cut', () => {
    const query = buildTabQuery(scope(), BreakdownTab.Models, 5, { orderBy: SPEND_ALIAS });

    expect(query.sort?.[0]).toMatchObject({ field: SPEND_ALIAS, dir: 'desc' });
    expect(query.sort?.[1]).toMatchObject({ field: 'deployment', dir: 'asc' });
  });

  test('groups the tools breakdown by the server as well, since a tool name is not unique', () => {
    const query = buildTabQuery(scope({ view: UsageView.Mcp }), BreakdownTab.Tools, 10);

    expect(query.group_by).toEqual(['deployment', 'mcp_tool_call_name']);
    expect(query.sort?.slice(1)).toEqual([
      { field: 'deployment', dir: 'asc' },
      { field: 'mcp_tool_call_name', dir: 'asc' },
    ]);
  });

  test('groups an application breakdown by the calling deployment', () => {
    expect(buildTabQuery(scope(), BreakdownTab.Applications, 10).group_by).toEqual(['parent_deployment']);
  });

  test('carries the window clauses alone, so the ranked head is not re-ranked by a term', () => {
    const clauses = clausesOf(buildTabQuery(scope(), BreakdownTab.Models, 10));

    expect(clauses).toHaveLength(3);
    expect(clauses.some((clause) => clause.op === QueryOperator.Ico)).toBe(false);
  });

  test('reads a later block by its offset, keeping the ranking stable', () => {
    const query = buildTabQuery(scope(), BreakdownTab.Models, 25, { offset: 50 });

    expect(query.page).toMatchObject({ offset: 50, limit: 25 });
    expect(query.sort).toEqual([
      { field: CALLS_ALIAS, dir: 'desc' },
      { field: 'deployment', dir: 'asc' },
    ]);
  });

  test('narrows the rows by a search term, case-insensitively', () => {
    const query = buildTabQuery(scope(), BreakdownTab.Models, 25, {
      rowClauses: [buildDimensionSearchClause(BreakdownTab.Models, 'gpt')],
    });
    const clauses = clausesOf(query);

    expect(clauses).toHaveLength(4);
    expect(clauses[3]).toMatchObject({ op: QueryOperator.Ico });
    expect(query.having).toBeUndefined();
  });

  test('names the tab own dimension in that term', () => {
    expect(buildDimensionSearchClause(BreakdownTab.Applications, 'rag')).toMatchObject({
      op: QueryOperator.Ico,
      args: [{ name: 'parent_deployment' }, { value: 'rag' }],
    });
  });

  test('asks the previous window for the block values by name', () => {
    const query = buildTabKeysQuery(scope(), BreakdownTab.Models, ['gpt-4o', 'claude-sonnet']);
    const clauses = clausesOf(query);

    expect(clauses).toHaveLength(4);
    expect(clauses[3]).toMatchObject({ op: QueryOperator.In });
    expect(query.page).toMatchObject({ limit: 2 });
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
  test('bins the page window at the resolution it is given', () => {
    const query = buildSpendBucketedQuery(scope(), { value: 6, unit: 'h' });

    expect(query.select?.[0].expr).toMatchObject({ name: 'date_bin' });
    expect(query.select?.[0].expr).toMatchObject({
      args: [{ value: '6' }, { value: 'hour' }, { name: 'request_time' }],
    });
  });

  test('carries spend alone, since the view reads no other figure', () => {
    expect(aliasesOf(buildSpendBucketedQuery(scope(), { value: 1, unit: 'd' }))).toEqual([BUCKET_ALIAS, SPEND_ALIAS]);
  });
});
