import {
  BREAKDOWN_TAB_COLUMN,
  BUCKET_ROW_LIMIT,
  USAGE_ENTITY,
  USAGE_VIEW_EVENT_KINDS,
} from '@/src/components/Analytics/Usage/constants';
import { BreakdownTab, UsageView } from '@/src/components/Analytics/Usage/models';
import {
  QueryExpr,
  QueryExprType,
  QueryFilterNode,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QuerySortDirection,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';
import { ChartResolution } from '@/src/utils/time-filter/get-chart-resolution';

export interface QueryScope {
  view: UsageView;
  window: TimeRange;
  entityFilter?: string | null;
  projectFilter?: string | null;
}

const field = (name: string): QueryExpr => ({ type: QueryExprType.Field, name });

const value = (raw: string, valueType = QueryValueType.String): QueryExpr => ({
  type: QueryExprType.Value,
  value_type: valueType,
  value: raw,
});

const fn = (name: string, args: QueryExpr[], distinct?: boolean): QueryExpr => ({
  type: QueryExprType.Fn,
  name,
  args,
  ...(distinct ? { distinct } : {}),
});

const eventKindFilter = (view: UsageView): QueryFilterNode => ({
  op: QueryOperator.In,
  args: [
    field('event_kind'),
    {
      type: QueryExprType.Array,
      items: USAGE_VIEW_EVENT_KINDS[view].map(
        (kind) => ({ type: QueryExprType.Value, value_type: QueryValueType.String, value: kind }) as const,
      ),
    },
  ],
});

/**
 * The backend parses a timestamp literal as epoch millis and rejects an ISO string with
 * "invalid long/timestamp literal" — the same contract the query builder's own time bound follows.
 */
const timestampValue = (date: Date): QueryExpr => ({
  type: QueryExprType.Value,
  value_type: QueryValueType.Timestamp,
  value: String(date.getTime()),
});

export const buildFilter = (scope: QueryScope, extra: QueryFilterNode[] = []): QueryFilterNode => {
  const clauses: QueryFilterNode[] = [
    eventKindFilter(scope.view),
    { op: QueryOperator.Ge, args: [field('request_time'), timestampValue(scope.window.startDate)] },
    { op: QueryOperator.Lt, args: [field('request_time'), timestampValue(scope.window.endDate)] },
    ...extra,
  ];

  if (scope.entityFilter) {
    clauses.push({ op: QueryOperator.Eq, args: [field('deployment'), value(scope.entityFilter)] });
  }
  if (scope.projectFilter) {
    clauses.push({ op: QueryOperator.Eq, args: [field('project_id'), value(scope.projectFilter)] });
  }

  return { op: QueryLogicalOperator.And, args: clauses };
};

/** The principal that made the call: the user id on a token call, the project id on an API-key one. */
const USER_REF_FIELD = 'usage_client_identity.user_ref';

export const CALLS_ALIAS = 'calls';
export const SPEND_ALIAS = 'spend';
export const PROMPT_TOKENS_ALIAS = 'prompt_tokens';
export const COMPLETION_TOKENS_ALIAS = 'completion_tokens';
export const FAILED_ALIAS = 'failed';
export const AVG_LATENCY_ALIAS = 'avg_latency';
export const CALLERS_ALIAS = 'callers';
export const BUCKET_ALIAS = 'bucket';
/** Names a row states before it falls back to counting them. */
const GROUP_NAMES_LIMIT = 6;
export const GROUP_NAMES_SEPARATOR = ', ';

/** Tabs whose rows aggregate more than one deployment, so a row has to name which. */
const NAMES_GROUPED_DEPLOYMENTS: BreakdownTab[] = [BreakdownTab.Tools];

export const GROUP_NAMES_ALIAS = 'group_names';
export const GROUP_COUNT_ALIAS = 'group_count';
export const TOOL_CALLS_ALIAS = 'tool_calls';
export const P50_LATENCY_ALIAS = 'p50_latency';
export const P95_LATENCY_ALIAS = 'p95_latency';

/**
 * A column read only on rows that carry their own price.
 *
 * `deployment_price` is a decimal, and the DSL's presence test takes text, so the value is rendered
 * before it is tested — `to_string` of an absent value is absent, which is what makes this a test
 * for "priced at all" rather than for a particular amount. Measured on the live dataset: no row
 * carries a zero price, so presence and non-zero are the same question here.
 */
const pricedOnly = (column: string): QueryExpr =>
  fn('if', [
    fn('not_empty', [fn('to_string', [field('deployment_price')])]),
    field(column),
    value('0', QueryValueType.Integer),
  ]);

/**
 * The figures every aggregate carries. `failed` counts rows whose `success` is false — the DSL has
 * no comparison in expression position, but `success` is already a boolean, so `if` takes it
 * directly.
 */
const commonMeasures = (view: UsageView) => {
  const measures = [
    { expr: fn('count', []), as: CALLS_ALIAS },
    // `user_hash` is set only on token calls and empty on every API-key one, so counting it folds
    // all key traffic into a single bucket.
    { expr: fn('count', [field(USER_REF_FIELD)], true), as: CALLERS_ALIAS },
    {
      expr: fn('sum', [
        fn('if', [field('success'), value('0', QueryValueType.Integer), value('1', QueryValueType.Integer)]),
      ]),
      as: FAILED_ALIAS,
    },
    { expr: fn('avg', [field('operation_duration_ms')]), as: AVG_LATENCY_ALIAS },
  ];

  if (view === UsageView.Llm) {
    // Tokens are counted once per call, on the row that made it. An application calling a model
    // gets a row of its own carrying the tokens of the call it made, so summing every row counts
    // those twice — and spend, summed over the same rows, does not, because only the row that
    // reached a model carries a price. Presence of a price is therefore what separates the two.
    //
    // An earlier guard tried `response_upstream_uri` for this and was wrong twice over: that column
    // is empty on whole adapters, so it dropped 39% of all tokens while keeping the orchestrator
    // rows it was meant to drop, which fill it.
    return [
      ...measures,
      { expr: fn('sum', [field('deployment_price')]), as: SPEND_ALIAS },
      { expr: fn('sum', [pricedOnly('prompt_tokens')]), as: PROMPT_TOKENS_ALIAS },
      { expr: fn('sum', [pricedOnly('completion_tokens')]), as: COMPLETION_TOKENS_ALIAS },
    ];
  }

  return [
    ...measures,
    {
      expr: fn('sum', [
        fn('if', [
          fn('equals', [field('mcp_method'), value('tools/call')]),
          value('1', QueryValueType.Integer),
          value('0', QueryValueType.Integer),
        ]),
      ]),
      as: TOOL_CALLS_ALIAS,
    },
  ];
};

/**
 * Percentiles ride only on the bucketed request. They are an ordered-set aggregate — the engine has
 * to sort each group — so the totals and the per-dimension rows, which need no distribution, do not
 * pay for them.
 */
const latencyPercentiles = () => [
  {
    expr: fn('percentile_cont', [value('0.5', QueryValueType.Decimal), field('operation_duration_ms')]),
    as: P50_LATENCY_ALIAS,
  },
  {
    expr: fn('percentile_cont', [value('0.95', QueryValueType.Decimal), field('operation_duration_ms')]),
    as: P95_LATENCY_ALIAS,
  },
];

const BUCKET_UNIT: Record<ChartResolution['unit'], string> = { m: 'minute', h: 'hour', d: 'day' };

/**
 * Calls over time. One window per request: the grammar has no comparison in expression position, so
 * a single aggregate cannot split its own rows into two windows — the caller asks per window and
 * the bucketed response is cut by bucket timestamp on the client.
 */
export const buildBucketedQuery = (scope: QueryScope, resolution: ChartResolution): StructuredQuery => ({
  entity: USAGE_ENTITY,
  mode: QueryMode.Aggregate,
  filter: buildFilter(scope),
  select: [
    {
      expr: fn('date_bin', [
        value(String(resolution.value), QueryValueType.Integer),
        value(BUCKET_UNIT[resolution.unit]),
        field('request_time'),
      ]),
      as: BUCKET_ALIAS,
    },
    ...commonMeasures(scope.view),
    ...latencyPercentiles(),
  ],
  group_by: [BUCKET_ALIAS],
  sort: [{ field: BUCKET_ALIAS, dir: QuerySortDirection.Asc }],
  page: { type: 'offset', offset: 0, limit: BUCKET_ROW_LIMIT, include_total: false } as StructuredQuery['page'],
});

/**
 * One row of totals for the window. Distinct callers cannot be summed out of the bucketed response —
 * a user active in several buckets is one user — so the headline figures come from here.
 */
export const buildTotalsQuery = (scope: QueryScope): StructuredQuery => ({
  entity: USAGE_ENTITY,
  mode: QueryMode.Aggregate,
  filter: buildFilter(scope),
  select: commonMeasures(scope.view),
});

/**
 * How a caller asks for one page of a breakdown tab. The card asks for the ranked head and takes
 * the defaults; the dialog asks block by block and narrows the rows by its search term.
 */
export interface TabQueryShape {
  offset?: number;
  /** Row-level clauses: they narrow which rows are grouped, not which groups are kept. */
  rowClauses?: QueryFilterNode[];
  /**
   * Which measure the top-N is taken on. The cut happens on the backend, so ranking by one measure
   * and reading another returns the wrong rows outright: the five busiest models are not the five
   * costliest, and re-sorting a page by spend only reorders what the call ranking already kept.
   */
  orderBy?: string;
}

/**
 * Which deployments a row aggregates, for a tab whose own dimension does not name them.
 *
 * A tool name is not unique: `get_me` lives on dozens of toolsets, and a row summing all of them
 * reads as one tool until you ask which. The names are capped rather than listed in full — a cell
 * states a few — and the count is taken separately, since a capped list cannot say what it left out.
 */
const groupNameMeasures = () => [
  {
    expr: fn('array_to_string', [
      fn('array_slice', [
        fn('group_uniq_array', [field('deployment')]),
        value('1', QueryValueType.Integer),
        value(String(GROUP_NAMES_LIMIT), QueryValueType.Integer),
      ]),
      value(GROUP_NAMES_SEPARATOR),
    ]),
    as: GROUP_NAMES_ALIAS,
  },
  { expr: fn('count', [field('deployment')], true), as: GROUP_COUNT_ALIAS },
];

/** A search term narrowing a breakdown to the dimension values containing it, case-insensitively. */
export const buildDimensionSearchClause = (tab: BreakdownTab, term: string): QueryFilterNode => ({
  op: QueryOperator.Ico,
  args: [field(BREAKDOWN_TAB_COLUMN[tab]), value(term)],
});

/**
 * The active breakdown tab, ranked, narrowed and limited by the backend.
 *
 * The ranking carries the dimension as its second key, so paging is stable: a window where two
 * rows hold the same call count would otherwise be free to answer them in either order, and the
 * same row could arrive in two blocks or in none.
 */
export const buildTabQuery = (
  scope: QueryScope,
  tab: BreakdownTab,
  limit: number,
  shape: TabQueryShape = {},
): StructuredQuery => {
  const column = BREAKDOWN_TAB_COLUMN[tab];

  return {
    entity: USAGE_ENTITY,
    mode: QueryMode.Aggregate,
    filter: buildFilter(scope, shape.rowClauses ?? []),
    select: [
      { expr: field(column) },
      ...commonMeasures(scope.view),
      ...(NAMES_GROUPED_DEPLOYMENTS.includes(tab) ? groupNameMeasures() : []),
    ],
    group_by: [column],
    sort: [
      { field: shape.orderBy ?? CALLS_ALIAS, dir: QuerySortDirection.Desc },
      { field: column, dir: QuerySortDirection.Asc },
    ],
    page: {
      type: 'offset',
      offset: shape.offset ?? 0,
      limit,
      include_total: false,
    } as StructuredQuery['page'],
  };
};

/**
 * The same measures for a named set of dimension values, so a block of rows can be compared against
 * the previous window. The block's own ranking does not hold there — a row that leads this window
 * may rank anywhere in the last one — so the values are asked for by name rather than by position.
 *
 * A fallback bucket is not asked for: its value is absent rather than a name, and `in` matches no
 * absence. The dialog therefore states no comparison for that row, which is what it already states
 * for any row the previous window did not answer for.
 */
export const buildTabKeysQuery = (scope: QueryScope, tab: BreakdownTab, keys: string[]): StructuredQuery => {
  const column = BREAKDOWN_TAB_COLUMN[tab];
  const keyClause: QueryFilterNode = {
    op: QueryOperator.In,
    args: [
      field(column),
      {
        type: QueryExprType.Array,
        items: keys.map(
          (key) => ({ type: QueryExprType.Value, value_type: QueryValueType.String, value: key }) as const,
        ),
      },
    ],
  };

  return {
    entity: USAGE_ENTITY,
    mode: QueryMode.Aggregate,
    filter: buildFilter(scope, [keyClause]),
    select: [{ expr: field(column) }, ...commonMeasures(scope.view)],
    group_by: [column],
    sort: [{ field: column, dir: QuerySortDirection.Asc }],
    page: { type: 'offset', offset: 0, limit: keys.length, include_total: false } as StructuredQuery['page'],
  };
};

/**
 * Spend alone, over the page's own window, binned coarsely enough to read as bars rather than as a
 * comb. It carries no other measure, so the plot that reads money asks for money.
 */
export const buildSpendBucketedQuery = (scope: QueryScope, resolution: ChartResolution): StructuredQuery => ({
  entity: USAGE_ENTITY,
  mode: QueryMode.Aggregate,
  filter: buildFilter(scope),
  select: [
    {
      expr: fn('date_bin', [
        value(String(resolution.value), QueryValueType.Integer),
        value(BUCKET_UNIT[resolution.unit]),
        field('request_time'),
      ]),
      as: BUCKET_ALIAS,
    },
    { expr: fn('sum', [field('deployment_price')]), as: SPEND_ALIAS },
  ],
  group_by: [BUCKET_ALIAS],
  sort: [{ field: BUCKET_ALIAS, dir: QuerySortDirection.Asc }],
  page: { type: 'offset', offset: 0, limit: BUCKET_ROW_LIMIT, include_total: false } as StructuredQuery['page'],
});

/**
 * Calls per bucket, split by one dimension. The series are bounded by `ids` — the ranking the share
 * chart already resolved — rather than by a page limit: a limit over bucket × dimension rows would
 * cut series mid-window and leave a stack that climbs and drops for no reason.
 */
export const buildDimensionBucketedQuery = (
  scope: QueryScope,
  resolution: ChartResolution,
  tab: BreakdownTab,
  ids: string[],
): StructuredQuery => {
  const column = BREAKDOWN_TAB_COLUMN[tab];

  return {
    entity: USAGE_ENTITY,
    mode: QueryMode.Aggregate,
    filter: buildFilter(scope, [
      {
        op: QueryOperator.In,
        args: [
          field(column),
          {
            type: QueryExprType.Array,
            items: ids.map(
              (id) => ({ type: QueryExprType.Value, value_type: QueryValueType.String, value: id }) as const,
            ),
          },
        ],
      },
    ]),
    select: [
      {
        expr: fn('date_bin', [
          value(String(resolution.value), QueryValueType.Integer),
          value(BUCKET_UNIT[resolution.unit]),
          field('request_time'),
        ]),
        as: BUCKET_ALIAS,
      },
      { expr: field(column) },
      { expr: fn('count', []), as: CALLS_ALIAS },
    ],
    group_by: [BUCKET_ALIAS, column],
    sort: [{ field: BUCKET_ALIAS, dir: QuerySortDirection.Asc }],
    page: { type: 'offset', offset: 0, limit: BUCKET_ROW_LIMIT, include_total: false } as StructuredQuery['page'],
  };
};
