import {
  BREAKDOWN_TAB_COLUMN,
  BREAKDOWN_TAB_QUALIFIERS,
  DEPLOYMENT_ROUTE_SEGMENT,
  LLM_EVENT_KINDS,
  MCP_EVENT_KIND,
  MCP_TOOL_CALL_METHOD,
  QUERY_ROW_LIMIT,
  ROUTE_EVENT_KIND,
  ROUTE_OWNER_COLUMN,
  ROUTE_PATH_COLUMN,
  ROW_KEY_SEPARATOR,
  BUCKET_ROW_LIMIT,
  USAGE_ENTITY,
} from '@/src/components/Analytics/Usage/constants';
import { BreakdownTab, UsageView } from '@/src/components/Analytics/Usage/models';
import { isPricedView } from '@/src/components/Analytics/Usage/utils/views';
import {
  QueryExpr,
  QueryExprType,
  QueryFilterNode,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryOutputColumn,
  QuerySortDirection,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';
import { ChartResolution } from '@/src/utils/time-filter/get-chart-resolution';

export interface QueryScope {
  view: UsageView;
  window: TimeRange;
  /** The entity's clauses for the rows this request reads. */
  entityClauses?: QueryFilterNode[];
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

const stringArray = (values: string[]): QueryExpr => ({
  type: QueryExprType.Array,
  items: values.map((item) => ({ type: QueryExprType.Value, value_type: QueryValueType.String, value: item }) as const),
});

const and = (...args: QueryFilterNode[]): QueryFilterNode => ({ op: QueryLogicalOperator.And, args });
const or = (...args: QueryFilterNode[]): QueryFilterNode => ({ op: QueryLogicalOperator.Or, args });
const not = (node: QueryFilterNode): QueryFilterNode => ({ op: QueryLogicalOperator.Not, args: [node] });
const eq = (left: QueryExpr, right: QueryExpr): QueryFilterNode => ({ op: QueryOperator.Eq, args: [left, right] });

/**
 * A deployment is named on the row. A boolean call is a filter predicate only as a comparison with
 * `true` — the shape the service's own SQL translation emits for one.
 */
const hasDeployment = (): QueryExpr => fn('not_empty', [field('deployment')]);
const deploymentPresent = (): QueryFilterNode => eq(hasDeployment(), value('true', QueryValueType.Boolean));

/**
 * A call Core resolved against its global routes map. The log records neither a route name nor a
 * deployment for it, and gives it no event kind — the kind the LLM view also reads for model calls
 * through an API that carries none. The missing deployment is what tells the two apart: no priced
 * row lacks one.
 */
const globalRouteCall = (): QueryFilterNode => and(eq(field('event_kind'), value('')), not(deploymentPresent()));

/**
 * Which rows each view is about. LLM and Routes share one predicate for the global route calls, so a
 * row cannot fall into both views, or into neither, by the two definitions drifting apart.
 */
const viewFilter = (view: UsageView): QueryFilterNode => {
  if (view === UsageView.Mcp) {
    return and(eq(field('event_kind'), value(MCP_EVENT_KIND)), eq(field('mcp_method'), value(MCP_TOOL_CALL_METHOD)));
  }

  if (view === UsageView.Routes) {
    return or(eq(field('event_kind'), value(ROUTE_EVENT_KIND)), globalRouteCall());
  }

  return and(
    { op: QueryOperator.In, args: [field('event_kind'), stringArray(LLM_EVENT_KINDS)] },
    not(globalRouteCall()),
  );
};

/**
 * `array_slice` takes a length literal and no "to the end", but a slice reaching past the end returns
 * what exists — so a bound no request URI comes near reads the rest of the text.
 */
const REST_OF_TEXT_SEGMENTS = 1000;

/** The `index`-th element (1-based) of a text cut on a delimiter, as text. */
const segment = (text: QueryExpr, delimiter: string, index: number): QueryExpr =>
  fn('array_to_string', [
    fn('array_slice', [
      fn('split_string', [text, value(delimiter)]),
      value(String(index), QueryValueType.Integer),
      value('1', QueryValueType.Integer),
    ]),
    value(''),
  ]);

/**
 * Everything after the first delimiter, rejoined by it — the old writer's lazy `(.+?)/route/(.+?)$`,
 * which keeps a path that itself carries the delimiter whole rather than cutting it at the next one.
 */
const afterFirst = (text: QueryExpr, delimiter: string): QueryExpr =>
  fn('array_to_string', [
    fn('array_slice', [
      fn('split_string', [text, value(delimiter)]),
      value('2', QueryValueType.Integer),
      value(String(REST_OF_TEXT_SEGMENTS), QueryValueType.Integer),
    ]),
    value(delimiter),
  ]);

/** The request path without its query: one path called with different parameters is one path. */
const requestPath = (): QueryExpr => segment(field('request_uri'), '?', 1);

/*
 * The Routes view's derived dimensions. Each branches on the deployment rather than on the event
 * kind because the grammar has no comparison in expression position. Inside the Routes view the two
 * tests agree: a row without a deployment is admitted only as a global route, and every deployment
 * route carries the deployment that declares it.
 */
const DERIVED_COLUMNS: Record<string, QueryExpr> = {
  // The declaring deployment, or a global route's first path segment — the log names no route. Cut
  // from the path, not the URI, so a query on a one-segment path stays off the owner as it does the path.
  [ROUTE_OWNER_COLUMN]: fn('if', [
    hasDeployment(),
    field('deployment'),
    fn('concat', [value('/'), segment(requestPath(), '/', 2)]),
  ]),
  // What follows `/route/` on a deployment route, and the whole path on a global one.
  [ROUTE_PATH_COLUMN]: fn('if', [
    hasDeployment(),
    fn('concat', [value('/'), afterFirst(requestPath(), DEPLOYMENT_ROUTE_SEGMENT)]),
    requestPath(),
  ]),
};

/**
 * What a dimension column is read as. A filter does not see select aliases, so a clause over a
 * derived column repeats its expression.
 */
const columnExpr = (name: string): QueryExpr => DERIVED_COLUMNS[name] ?? field(name);

/** A dimension in a select list: a derived one is computed under its column's name. */
const selectColumn = (name: string): QueryOutputColumn =>
  name in DERIVED_COLUMNS ? { expr: DERIVED_COLUMNS[name], as: name } : { expr: field(name) };

/** The qualifiers lead, so rows of one server — or one owner — sit together where the ranking allows it. */
const tabColumns = (tab: BreakdownTab): string[] => [
  ...(BREAKDOWN_TAB_QUALIFIERS[tab] ?? []),
  BREAKDOWN_TAB_COLUMN[tab],
];

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
    viewFilter(scope.view),
    { op: QueryOperator.Ge, args: [field('request_time'), timestampValue(scope.window.startDate)] },
    { op: QueryOperator.Lt, args: [field('request_time'), timestampValue(scope.window.endDate)] },
    ...extra,
    ...(scope.entityClauses ?? []),
  ];

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
    /*
     * The principal, falling back to the anonymized hash.
     *
     * `user_hash` alone is set only on token calls and empty on every API-key one, so counting it
     * folds all key traffic into a single bucket. `user_ref` covers both branches — but it comes
     * from an enrichment that is provisioned per environment rather than shipped with the service,
     * and where that enrichment is absent the column is null on every row and the card read zero.
     * The fallback costs nothing where the enrichment is there: the two agree row by row.
     */
    {
      expr: fn(
        'count',
        [fn('if', [fn('not_empty', [field(USER_REF_FIELD)]), field(USER_REF_FIELD), field('user_hash')])],
        true,
      ),
      as: CALLERS_ALIAS,
    },
    {
      expr: fn('sum', [
        fn('if', [field('success'), value('0', QueryValueType.Integer), value('1', QueryValueType.Integer)]),
      ]),
      as: FAILED_ALIAS,
    },
    { expr: fn('avg', [field('operation_duration_ms')]), as: AVG_LATENCY_ALIAS },
  ];

  if (isPricedView(view)) {
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

  // No separate tool-call count: the MCP view holds nothing but tool calls, so it would restate
  // `calls` in a second column.
  return measures;
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

/**
 * A search term narrowing a breakdown to the rows containing it, case-insensitively.
 *
 * A qualified tab searches both of its columns: a row there is a tool on a server, and a reader
 * typing a server name means the tools it serves, not nothing at all.
 */
export const buildDimensionSearchClause = (tab: BreakdownTab, term: string): QueryFilterNode => {
  const match = (name: string): QueryFilterNode => ({ op: QueryOperator.Ico, args: [columnExpr(name), value(term)] });
  const columns = tabColumns(tab);

  return columns.length > 1 ? or(...columns.map(match)) : match(columns[0]);
};

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
  const columns = tabColumns(tab);

  return {
    entity: USAGE_ENTITY,
    mode: QueryMode.Aggregate,
    filter: buildFilter(scope, shape.rowClauses ?? []),
    select: [
      ...columns.map(selectColumn),
      ...commonMeasures(scope.view),
      ...(NAMES_GROUPED_DEPLOYMENTS.includes(tab) ? groupNameMeasures() : []),
    ],
    group_by: columns,
    sort: [
      { field: shape.orderBy ?? CALLS_ALIAS, dir: QuerySortDirection.Desc },
      ...columns.map((name) => ({ field: name, dir: QuerySortDirection.Asc })),
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
 *
 * A key is a row's id, which on a qualified tab carries both of its group values — the row is a
 * tool *on a server*. The clause is therefore built per column from the keys' own parts, and the
 * response groups by both, so the ids it folds back match the ids that were asked for. Matching on
 * the dimension alone returned nothing at all, and every row's change read as absent.
 */
export const buildTabKeysQuery = (scope: QueryScope, tab: BreakdownTab, keys: string[]): StructuredQuery => {
  const columns = tabColumns(tab);

  const inClause = (name: string, values: string[]): QueryFilterNode => ({
    op: QueryOperator.In,
    args: [columnExpr(name), stringArray([...new Set(values)])],
  });

  /*
   * One clause per column rather than a set of tuples: the grammar has no tuple comparison, so the
   * filter is the cross product of the sets. It can admit a pair nobody asked for — a tool that
   * also exists on another named server — and that is harmless: the extra group folds to an id the
   * caller never looks up.
   */
  const keyParts = keys.map((key) => key.split(ROW_KEY_SEPARATOR));
  const keyClauses = columns.map((name, index) =>
    inClause(
      name,
      keyParts.map((parts) => (parts.length > index ? parts[index] : '')),
    ),
  );

  return {
    entity: USAGE_ENTITY,
    mode: QueryMode.Aggregate,
    filter: buildFilter(scope, keyClauses),
    select: [...columns.map(selectColumn), ...commonMeasures(scope.view)],
    group_by: columns,
    sort: columns.map((name) => ({ field: name, dir: QuerySortDirection.Asc })),
    page: {
      type: 'offset',
      offset: 0,
      limit: Math.min(keys.length * columns.length, QUERY_ROW_LIMIT),
      include_total: false,
    } as StructuredQuery['page'],
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
    filter: buildFilter(scope, [{ op: QueryOperator.In, args: [columnExpr(column), stringArray(ids)] }]),
    select: [
      {
        expr: fn('date_bin', [
          value(String(resolution.value), QueryValueType.Integer),
          value(BUCKET_UNIT[resolution.unit]),
          field('request_time'),
        ]),
        as: BUCKET_ALIAS,
      },
      selectColumn(column),
      { expr: fn('count', []), as: CALLS_ALIAS },
    ],
    group_by: [BUCKET_ALIAS, column],
    sort: [{ field: BUCKET_ALIAS, dir: QuerySortDirection.Asc }],
    page: { type: 'offset', offset: 0, limit: BUCKET_ROW_LIMIT, include_total: false } as StructuredQuery['page'],
  };
};
