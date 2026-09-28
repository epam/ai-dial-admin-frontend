import { timeRangePredicates } from '@/src/components/Analytics/QueryBuilder/utils/time';
import {
  ARRAY_VALUE_PAGE_SIZE,
  CHAT_ID_SESSION_SOURCE,
  SESSIONS_ENTITY,
  SESSION_FIELD_VALUE_COUNT_ALIAS,
  SESSION_FIELD_VALUE_LIMIT,
  SESSION_FIELD_VALUE_TYPE,
  SESSION_FILTER_QUERY_OPERATOR,
  FEEDBACK_CANDIDATE_LIMIT,
  FEEDBACK_ENTITY,
  OPTIONAL_DETAIL_SELECT_FIELDS,
  OPTIONAL_FEEDBACK_FIELDS,
  RATING_COUNT_EXCLUSIVE_MIN,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/sessions-trace';
import {
  SessionArrayFilter,
  SessionArrayValueSource,
  SessionColumnFilter,
  SessionTraceFigureField,
  SessionTracePageField,
  SessionTraceWindow,
  SessionFilterOperator,
  SessionRatingTotalsField,
  SessionScalarOperator,
  SessionSortKey,
  SessionTotalsField,
  SessionsField,
  FeedbackField,
  FeedbackFilter,
  ResponseRatingsField,
  SessionScope,
  UsageLogField,
} from '@/src/models/analytics/sessions-trace';
import {
  QueryFilterNode,
  QueryFnExpr,
  QueryOperator,
  QuerySortDirection,
  QuerySortItem,
  QuerySortNulls,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { TimeRange } from '@/src/models/time-range';
import {
  aggregateQuery,
  and,
  arrayOf,
  col,
  eq,
  exprPredicate,
  field,
  fn,
  fnIf,
  ge,
  gt,
  ico,
  inValues,
  isNull,
  le,
  ne,
  offsetPage,
  or,
  predicate,
  rowQuery,
  sortItem,
  value,
} from '@/src/utils/analytics/query-build';
import { availableSelectFields } from '@/src/utils/analytics/session-column-catalog';
import { toMillis } from '@/src/utils/analytics/session-formatting';
import { insightColumnsOf } from '@/src/utils/analytics/session-insights';

const emptyString = value(QueryValueType.String, '');

const searchPredicates = (search: string): QueryFilterNode[] => {
  const term = search.trim();
  if (!term) {
    return [];
  }

  return [or([SessionsField.ChatId, SessionsField.ProjectId].map((fieldName) => ico(fieldName, term)))];
};

const fieldValueType = (fieldName: string, declared?: QueryValueType): QueryValueType => {
  const valueType = declared ?? SESSION_FIELD_VALUE_TYPE[fieldName as SessionsField];
  if (!valueType) {
    throw new Error(`No value type for sessions field: ${fieldName}`);
  }
  return valueType;
};

const columnFilterPredicate = (filter: SessionColumnFilter): QueryFilterNode => {
  const { field: fieldName, valueType: declared } = filter;
  const valueType = fieldValueType(fieldName, declared);

  if (filter.operator === SessionFilterOperator.In) {
    return inValues(fieldName, valueType, filter.values);
  }

  if (filter.operator === SessionFilterOperator.Range) {
    return and([
      ge(fieldName, value(valueType, filter.value)),
      le(fieldName, value(valueType, filter.valueTo as string)),
    ]);
  }

  const queryOperator = SESSION_FILTER_QUERY_OPERATOR[filter.operator];
  if (!queryOperator) {
    throw new Error(`No query operator for sessions filter: ${filter.operator}`);
  }
  return predicate(queryOperator, fieldName, value(valueType, filter.value));
};

const columnFilterPredicates = (columnFilters: SessionColumnFilter[]): QueryFilterNode[] =>
  columnFilters.map(columnFilterPredicate);

const ARRAY_HAS = 'array_has';
const ARRAY_HAS_ANY = 'array_has_any';
const ARRAY_LENGTH = 'array_length';

const NEGATED_ARRAY_OPERATORS: SessionScalarOperator[] = [
  SessionFilterOperator.NotContains,
  SessionFilterOperator.NotEquals,
];

// `contains` arrives here as the whole values its text matched, and tests membership in that set. `equals`
// needs no resolution: the entered text *is* the value, so it tests one element directly.
//
// Exported because the server action decides whether to issue the resolution query from the same question.
// Held in one place deliberately: were the two to drift, a resolved multi-name set would be reduced to a
// single-element test and return a wrong answer with nothing raised.
const RESOLVED_ARRAY_OPERATORS: SessionScalarOperator[] = [
  SessionFilterOperator.Contains,
  SessionFilterOperator.NotContains,
];

export const needsValueResolution = (operator: SessionScalarOperator): boolean =>
  RESOLVED_ARRAY_OPERATORS.includes(operator);

// The multi-value guard is not reachable through the grid, where `equals` carries exactly one value. It is
// here because the alternative to widening is dropping: `array_has` takes one element, so a second value
// would vanish with no error, unlike an unmapped operator, which throws.
const arrayMembership = (
  fieldName: string,
  operator: SessionScalarOperator,
  values: string[],
  valueType: QueryValueType,
): QueryFnExpr =>
  needsValueResolution(operator) || values.length > 1
    ? fn(ARRAY_HAS_ANY, [field(fieldName), arrayOf(valueType, values)])
    : fn(ARRAY_HAS, [field(fieldName), value(valueType, values[0])]);

// Nothing resolved, so the predicate is a constant. A positive filter matched no value and therefore matches
// no session; a negated one is satisfied by every session, since no element can equal a value that
// does not exist. Both are still *stated*, rather than the filter being dropped — the header shows an active
// filter and the query has to mean what it shows. `array_length` is 0 for an empty or null array and never
// null, so `< 0` is unsatisfiable and `>= 0` is a tautology over the same column.
const emptyArrayMatch = (fieldName: string, operator: SessionScalarOperator): QueryFilterNode => {
  const length = fn(ARRAY_LENGTH, [field(fieldName)]);
  const zero = value(QueryValueType.Integer, '0');

  return NEGATED_ARRAY_OPERATORS.includes(operator)
    ? exprPredicate(QueryOperator.Ge, length, zero)
    : exprPredicate(QueryOperator.Lt, length, zero);
};

// `ico` and `in` are scalar and reject an array operand, which is what the column's old `filter: false` was
// written against. `array_has*` returns false — never null — for an empty or null array, so comparing the
// call against `false` is exactly "no element matches" and needs no null arm.
const arrayFilterPredicates = (arrayFilters: SessionArrayFilter[]): QueryFilterNode[] =>
  arrayFilters.map(({ field: fieldName, operator, values, valueType: declared }) => {
    if (!values.length) {
      return emptyArrayMatch(fieldName, operator);
    }

    const valueType = fieldValueType(fieldName, declared);
    const isNegated = NEGATED_ARRAY_OPERATORS.includes(operator);

    return exprPredicate(
      QueryOperator.Eq,
      arrayMembership(fieldName, operator, values, valueType),
      value(QueryValueType.Boolean, String(!isNegated)),
    );
  });

interface SessionFilterParams {
  range: TimeRange;
  search?: string;
  chatIds?: string[];
  columnFilters?: SessionColumnFilter[];
  arrayFilters?: SessionArrayFilter[];
}

// The list and the totals share one filter, so a pill can never disagree with the rows beneath it.
const sessionFilter = ({
  range,
  search = '',
  chatIds = [],
  columnFilters = [],
  arrayFilters = [],
}: SessionFilterParams): QueryFilterNode =>
  and([
    ...timeRangePredicates(SessionsField.LastRequestTime, range),
    ...searchPredicates(search),
    ...(chatIds.length ? [inValues(SessionsField.ChatId, QueryValueType.String, chatIds)] : []),
    ...columnFilterPredicates(columnFilters),
    ...arrayFilterPredicates(arrayFilters),
  ]);

const sessionSort = (sort: SessionSortKey[] = []): QuerySortItem[] => {
  const callerKeys = sort.map(({ field: fieldName, direction }) => sortItem(fieldName, direction, QuerySortNulls.Last));

  return [
    ...(callerKeys.length ? callerKeys : [sortItem(SessionsField.LastRequestTime, QuerySortDirection.Desc)]),
    sortItem(SessionsField.ChatId, QuerySortDirection.Asc),
  ];
};

interface SessionListQueryParams extends SessionFilterParams {
  offset: number;
  limit: number;
  sort?: SessionSortKey[];
  // Split by what projecting a field costs, not by whether its column is on screen: the caller sends every
  // cheap source column, plus whichever gated ones — heavy or enrichment — its columns currently show.
  sourceFields?: string[];
  visibleEnrichmentFields?: string[];
}

// Read outside any cell renderer — the grid keys its rows by it, a row click navigates by it, and the loaded
// set is mapped by it — so a row is unusable without it whatever the column state. Every other field a
// column reads is renderer-scoped and therefore reaches the query through the cost buckets instead. Sorting
// and filtering need nothing here: both are resolved server-side by field name, not from the projected row.
const IDENTITY_SELECT_FIELDS: SessionsField[] = [SessionsField.ChatId];

// Named only when the caller has no schema to classify from — the base rollup columns, which is what the
// curated columns still render in that state. With a schema in hand every one of these arrives through
// `sourceFields`, costed like any other field: that is the point of not keeping them exempt, since the day
// the service marks one `heavy` the gating applies with no carve-out list here to re-audit.
const SCHEMALESS_SELECT_FIELDS: SessionsField[] = [
  SessionsField.ChatId,
  SessionsField.ProjectId,
  SessionsField.UserHash,
  SessionsField.TurnCount,
  SessionsField.TotalTokens,
  SessionsField.TotalPrice,
  SessionsField.LastRequestTime,
  SessionsField.FirstRequestTime,
  SessionsField.Deployments,
];

// Both incoming sets are resolved from the entity schema by `projectableSchemaFields`, so a field the
// instance does not carry never reaches here. Only the single-session query, which enumerates a
// frontend enum rather than the schema, has to intersect for itself.
const sessionSelect = (sourceFields: string[] = [], visibleEnrichmentFields: string[] = []): string[] => {
  const core = sourceFields.length ? IDENTITY_SELECT_FIELDS : SCHEMALESS_SELECT_FIELDS;
  const named = new Set<string>(core);

  return [...core, ...sourceFields.filter((fieldName) => !named.has(fieldName)), ...visibleEnrichmentFields];
};

// No `include_total`: the totals query resolves the same count under the same filter, and the service runs
// a requested total as its own statement over the whole filtered result — so asking here would scan it
// again for every page fetched.
export const buildSessionListQuery = ({
  offset,
  limit,
  sort,
  sourceFields,
  visibleEnrichmentFields,
  ...filters
}: SessionListQueryParams): StructuredQuery =>
  rowQuery({
    entity: SESSIONS_ENTITY,
    select: sessionSelect(sourceFields, visibleEnrichmentFields).map((fieldName) => col(field(fieldName))),
    filter: sessionFilter(filters),
    sort: sessionSort(sort),
    page: offsetPage(offset, limit),
  });

interface ArrayValueResolutionParams {
  source: SessionArrayValueSource;
  range: TimeRange;
  term: string;
  offset: number;
}

// Step one of a contains filter over an array-valued column. The values are read from the scalar column the
// array is built from, so they match exactly — a list read from an admin API would be the *configured* set,
// and a name present there but absent from the data gives a filter that finds nothing for no visible reason.
// The period carries, which costs one predicate and keeps the set to names that can appear in the result.
//
// One page of `ARRAY_VALUE_PAGE_SIZE`, which the caller walks to exhaustion; the ordering is what makes
// those pages disjoint.
export const buildArrayValueResolutionQuery = ({
  source,
  range,
  term,
  offset,
}: ArrayValueResolutionParams): StructuredQuery =>
  aggregateQuery({
    entity: source.entity,
    groupBy: [source.field],
    select: [col(field(source.field))],
    filter: and([...timeRangePredicates(source.timeField, range), ico(source.field, term)]),
    sort: [sortItem(source.field, QuerySortDirection.Asc)],
    page: offsetPage(offset, ARRAY_VALUE_PAGE_SIZE),
  });

interface SessionFieldValuesParams extends SessionFilterParams {
  field: string;
}

// Faceted against the page's *other* narrowing: the period, the search term, the feedback candidates and
// every other column's predicate all carry, so each count equals what selecting that value returns. The
// opened column's own predicate does not — including it collapses the list to what is already selected, and
// a selection could then never be widened without first being cleared.
export const buildSessionFieldValuesQuery = ({
  field: fieldName,
  columnFilters = [],
  arrayFilters = [],
  ...filters
}: SessionFieldValuesParams): StructuredQuery =>
  aggregateQuery({
    entity: SESSIONS_ENTITY,
    groupBy: [fieldName],
    select: [col(field(fieldName)), col(fn('count'), SESSION_FIELD_VALUE_COUNT_ALIAS)],
    filter: sessionFilter({
      ...filters,
      columnFilters: columnFilters.filter((filter) => filter.field !== fieldName),
      arrayFilters: arrayFilters.filter((filter) => filter.field !== fieldName),
    }),
    // The value breaks a tie on the count, so two equally frequent values keep a stable order between
    // openings rather than swapping places under the operator's pointer.
    sort: [
      sortItem(SESSION_FIELD_VALUE_COUNT_ALIAS, QuerySortDirection.Desc),
      sortItem(fieldName, QuerySortDirection.Asc),
    ],
    page: offsetPage(0, SESSION_FIELD_VALUE_LIMIT),
  });

// The curated columns the view has always read, plus **every** column the insight enrichment exposes. The
// second half is discovered from the schema rather than enumerated: the enrichment is provisioned per
// instance and supersedes its own columns, so a list here would name a replaced column that comes back null
// while never asking for the one that replaced it.
//
// The curated half still passes through `availableSelectFields`, which is what keeps an optional column out
// of the select on an instance that does not report it — the service rejects a whole query for one unknown
// field.
export const buildSessionDetailQuery = (chatId: string, schemaFields?: AnalyticsEntityField[]): StructuredQuery => {
  const curated = availableSelectFields(
    Object.values(SessionsField),
    OPTIONAL_DETAIL_SELECT_FIELDS,
    schemaFields?.map(({ name }) => name),
  );
  const named = new Set(curated);
  const insights = insightColumnsOf(schemaFields)
    .map(({ name }) => name)
    .filter((name) => !named.has(name));

  return rowQuery({
    entity: SESSIONS_ENTITY,
    select: [...curated, ...insights].map((fieldName) => col(field(fieldName))),
    filter: eq(SessionsField.ChatId, value(QueryValueType.String, chatId)),
    page: offsetPage(0, 1, true),
  });
};

export const buildSessionFeedbackQuery = (
  chatId: string,
  limit: number,
  schemaFieldNames?: string[],
): StructuredQuery => {
  const selectable = availableSelectFields(
    [
      ResponseRatingsField.ResponseId,
      ResponseRatingsField.FirstRateTime,
      ResponseRatingsField.LastRateTime,
      ResponseRatingsField.RatePosCount,
      ResponseRatingsField.RateZeroCount,
      ResponseRatingsField.RateNegCount,
      ResponseRatingsField.RateDistinctCount,
      ResponseRatingsField.CommentCount,
      ResponseRatingsField.CommentSample,
    ],
    OPTIONAL_FEEDBACK_FIELDS,
    schemaFieldNames,
  );

  return rowQuery({
    entity: FEEDBACK_ENTITY,
    select: selectable.map((fieldName) => col(field(fieldName))),
    filter: eq(ResponseRatingsField.ChatId, value(QueryValueType.String, chatId)),
    sort: [sortItem(ResponseRatingsField.LastRateTime, QuerySortDirection.Desc)],
    page: offsetPage(0, limit, true),
  });
};

// The trace listing, in three passes over the live hop log.
//
// They differ in one way that looks like an inconsistency and is not, so it is stated once here and asserted
// in the query-shape test: **`project_id` filters the page query and nothing else.**
//
// On the page query it is admissible because that query is already restricted to rows carrying the chat id,
// and a trace's chat-id-carrying rows are single-project (measured: no trace's labelled rows span two
// projects). It is also the only prune available — `chat_id` is not in the sort key and has no index.
//
// On the roots and figures queries it is destructive. A trace's Core-internal calls are recorded under
// Core's own project while the client's rows carry the session's, so filtering by the session's
// project drops exactly the rows and cards this listing exists to show — and drops them *silently*, because
// the figures query would still count what the roots query lost. That is the arithmetic-correction bug this
// design removes, so do not "unify" the three filter lists into one shared helper.
//
// `project_id` is nonetheless *projected* by the roots query: the Core-internal marker compares it against
// the session's. Required in one clause, forbidden in the other.

// The window the roots and figures passes share. Both take it as one value rather than deriving it twice, so
// they cannot end up scoped to different ranges.
const traceWindowPredicates = (window: SessionTraceWindow): QueryFilterNode[] => [
  ge(UsageLogField.RequestTime, value(QueryValueType.Timestamp, String(window.fromMs))),
  le(UsageLogField.RequestTime, value(QueryValueType.Timestamp, String(window.toMs))),
];

// Pass one. Yields the page's trace ids, the ordering key, and the bounds the other two passes are scoped by
// — and no figures: a figure resolved under a `chat_id` filter is computed without the rows that filter
// excludes, which is the defect being fixed.
//
// Ascending order is load-bearing, not cosmetic. This reads a live table, so rows arrive between page
// fetches; ordered ascending, a newly recorded trace sorts past the last page fetched and the offsets already
// consumed do not shift. `trace_id` breaks ties so a boundary is never arbitrary. A newest-first order is
// unsound under offset paging and must not be introduced without keyset paging first — which needs the
// cursor bound over `min(request_time)` in a HAVING, since filtering rows by the cursor changes a straddling
// trace's computed minimum and it reappears on the next page.
// The hop log is bloom-filtered on `chat_id`, `trace_id` and `core_span_id` and on nothing else, so a
// chat-origin session keeps that index and only a harness session — whose hops carry no `chat_id` at all —
// pays for the enrichment column. An unknown source takes the enrichment column too: it is correct for both
// populations, and being slow is the safer way to be wrong here.
const sessionScopeField = (source?: string | null): UsageLogField =>
  source === CHAT_ID_SESSION_SOURCE ? UsageLogField.ChatId : UsageLogField.ClientSessionId;

const sessionScopePredicate = ({ id, source }: SessionScope): QueryFilterNode =>
  eq(sessionScopeField(source), value(QueryValueType.String, id));

export const buildSessionTracePageQuery = (
  scope: SessionScope,
  projectId: string,
  window: SessionTraceWindow,
  offset: number,
  limit: number,
): StructuredQuery =>
  aggregateQuery({
    entity: USAGE_LOG_ENTITY,
    groupBy: [UsageLogField.TraceId],
    select: [
      col(field(UsageLogField.TraceId)),
      col(fn('min', [field(UsageLogField.RequestTime)]), SessionTracePageField.FirstRequestTime),
      col(fn('max', [field(UsageLogField.RequestTime)]), SessionTracePageField.LastRequestTime),
    ],
    filter: and([
      sessionScopePredicate(scope),
      eq(UsageLogField.ProjectId, value(QueryValueType.String, projectId)),
      ...traceWindowPredicates(window),
    ]),
    sort: [
      sortItem(SessionTracePageField.FirstRequestTime, QuerySortDirection.Asc),
      sortItem(UsageLogField.TraceId, QuerySortDirection.Asc),
    ],
    page: offsetPage(offset, limit),
  });

// Pass two. Every root span of the page's traces, each read for the card it becomes. Located by `trace_id`
// alone: requiring the session header here would drop the roots that carry none, which is the shape this
// listing exists to render.
export const buildSessionTraceRootsQuery = (
  traceIds: string[],
  window: SessionTraceWindow,
  limit: number,
): StructuredQuery =>
  rowQuery({
    entity: USAGE_LOG_ENTITY,
    select: [
      col(field(UsageLogField.TraceId)),
      col(field(UsageLogField.CoreSpanId)),
      col(field(UsageLogField.RequestTime)),
      col(field(UsageLogField.OperationDurationMs)),
      col(field(UsageLogField.Success)),
      col(field(UsageLogField.ResponseStatus)),
      col(field(UsageLogField.TotalTokens)),
      col(field(UsageLogField.TotalPrice)),
      col(field(UsageLogField.DeploymentPrice)),
      // The label test's operand, and the reason it is the normalised session id rather than `chat_id`: an
      // agent session's rows carry no chat id at all, so every root would read as Core-internal.
      col(field(UsageLogField.ClientSessionId)),
      col(field(UsageLogField.RequestUri)),
      col(field(UsageLogField.EventKind)),
      col(field(UsageLogField.NumberRequestMessages)),
      col(field(UsageLogField.Deployment)),
      // Projected for the marker's comparison — never filtered on. See the note above this group.
      col(field(UsageLogField.ProjectId)),
    ],
    filter: and([
      isNull(UsageLogField.CoreParentSpanId),
      inValues(UsageLogField.TraceId, QueryValueType.String, traceIds),
      ...traceWindowPredicates(window),
    ]),
    sort: [sortItem(UsageLogField.RequestTime, QuerySortDirection.Asc)],
    page: offsetPage(0, limit),
  });

// Pass three. The traces' own figures and their chips. Grouping by `(trace_id, event_kind)` gives the chips
// their counts; summing the kinds gives the trace its totals.
//
// No `chat_id` here is what makes those totals correct *without correction*. Scoped by trace, the span count,
// tokens and price are simply the trace's own — there is no root to add back and no count to increment.
export const buildSessionTraceFiguresQuery = (
  traceIds: string[],
  window: SessionTraceWindow,
  limit: number,
): StructuredQuery =>
  aggregateQuery({
    entity: USAGE_LOG_ENTITY,
    groupBy: [UsageLogField.TraceId, UsageLogField.EventKind],
    select: [
      col(field(UsageLogField.TraceId)),
      col(field(UsageLogField.EventKind)),
      col(fn('count'), SessionTraceFigureField.Spans),
      col(fn('sum', [field(UsageLogField.TotalTokens)]), SessionTraceFigureField.Tokens),
      col(fn('sum', [field(UsageLogField.DeploymentPrice)]), SessionTraceFigureField.Price),
      // No `countIf` in the catalog and no `CASE` in the grammar; `if` is what expresses this.
      col(
        fn('sum', [
          fnIf(field(UsageLogField.Success), value(QueryValueType.Integer, '0'), value(QueryValueType.Integer, '1')),
        ]),
        SessionTraceFigureField.FailedSpans,
      ),
      col(fn('group_uniq_array', [field(UsageLogField.ResponseId)]), SessionTraceFigureField.ResponseIds),
    ],
    filter: and([inValues(UsageLogField.TraceId, QueryValueType.String, traceIds), ...traceWindowPredicates(window)]),
    sort: [sortItem(UsageLogField.TraceId, QuerySortDirection.Asc)],
    page: offsetPage(0, limit),
  });

// Scoped by `trace_id` alone, deliberately: a `chat_id` predicate drops the rows the listing counts — a root
// carrying no header, and the Core-internal calls recorded under the trace — so the drawer contradicts the
// card that opened it. No trace carries two distinct non-empty chat ids, so the trace id alone cannot draw in
// another session's rows.
export const buildSessionSpansQuery = (traceId: string, limit: number, fieldNames: string[]): StructuredQuery =>
  rowQuery({
    entity: USAGE_LOG_ENTITY,
    // Supplied by the caller, resolved against the fetched schema: a `sensitive` column is absent from the
    // schema below full administrator, and naming a field the schema does not carry rejects the whole read.
    select: fieldNames.map((fieldName) => col(field(fieldName))),
    filter: eq(UsageLogField.TraceId, value(QueryValueType.String, traceId)),
    sort: [sortItem(UsageLogField.RequestTime, QuerySortDirection.Asc)],
    page: offsetPage(0, limit, true),
  });

// The body columns to read are supplied rather than assumed: entitlement to the request body and to the
// response body is separate, and a caller holding one must not have the other named in their query — an
// unknown field rejects the whole read, which would withdraw the side they *are* entitled to along with the
// one they are not.
//
// Never scoped by the session header: a Core-internal call carries none, so the tree offered its row while
// every tab of that row reported the hop had recorded nothing. `buildSessionSpansQuery` dropped the same
// predicate. The read stays bounded — the table partitions on the day of `request_time`, and the hop's own
// instant collapses that to one partition.
export const buildSessionHopBodyQuery = (
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
  bodyFields: string[],
): StructuredQuery => {
  const plain = [UsageLogField.TraceId, UsageLogField.EventKind, UsageLogField.RequestUri];
  const recordedMillis = toMillis(requestTime);

  return rowQuery({
    entity: USAGE_LOG_ENTITY,
    // Selected under the names the service publishes, qualified enrichment columns included. A projection
    // alias is not honoured on a row read — the qualified key comes back whatever the query asked for — so
    // the namespace is stripped where the row is read rather than pretended away here.
    select: [...plain, ...bodyFields].map((fieldName) => col(field(fieldName))),
    filter: and([
      eq(UsageLogField.TraceId, value(QueryValueType.String, traceId)),
      eq(UsageLogField.CoreSpanId, value(QueryValueType.String, coreSpanId)),
      ...(recordedMillis === null
        ? []
        : [
            ge(UsageLogField.RequestTime, value(QueryValueType.Timestamp, String(recordedMillis))),
            le(UsageLogField.RequestTime, value(QueryValueType.Timestamp, String(recordedMillis))),
          ]),
    ]),
    page: offsetPage(0, 1),
  });
};

// Takes the period, not a filter object: a search or column predicate reaching here would silently make the
// pills a summary of the filtered result again, which is the behaviour this replaced.
export const buildSessionTotalsQuery = (range: TimeRange): StructuredQuery =>
  aggregateQuery({
    entity: SESSIONS_ENTITY,
    select: [
      col(fn('count'), SessionTotalsField.Sessions),
      col(fn('sum', [field(SessionsField.TotalPrice)]), SessionTotalsField.Cost),
    ],
    filter: and(timeRangePredicates(SessionsField.LastRequestTime, range)),
  });

const ratePredicates = (feedback: FeedbackFilter): QueryFilterNode[] => {
  const threshold = value(QueryValueType.Integer, String(RATING_COUNT_EXCLUSIVE_MIN));
  const positive = gt(ResponseRatingsField.RatePosCount, threshold);
  const nonPositive = [
    gt(ResponseRatingsField.RateZeroCount, threshold),
    gt(ResponseRatingsField.RateNegCount, threshold),
  ];

  switch (feedback) {
    case FeedbackFilter.Positive:
      return [positive];
    case FeedbackFilter.Negative:
      return [or(nonPositive)];
    case FeedbackFilter.Rated:
      return [or([positive, ...nonPositive])];
    case FeedbackFilter.All:
      return [];
  }
};

interface FeedbackQueryParams {
  range: TimeRange;
  feedback: FeedbackFilter;
}

export const buildSessionRatingTotalsQuery = ({ range, feedback }: FeedbackQueryParams): StructuredQuery =>
  aggregateQuery({
    entity: FEEDBACK_ENTITY,
    select: [col(fn('count', [field(ResponseRatingsField.ChatId)], true), SessionRatingTotalsField.Sessions)],
    filter: and([
      ...timeRangePredicates(ResponseRatingsField.LastRateTime, range),
      ne(ResponseRatingsField.ChatId, emptyString),
      ...ratePredicates(feedback),
    ]),
  });

export const buildRatedSessionIdsQuery = ({ range, feedback }: FeedbackQueryParams): StructuredQuery =>
  aggregateQuery({
    entity: FEEDBACK_ENTITY,
    groupBy: [ResponseRatingsField.ChatId],
    select: [
      col(field(ResponseRatingsField.ChatId)),
      col(fn('max', [field(ResponseRatingsField.LastRateTime)]), FeedbackField.LastRated),
    ],
    filter: and([
      ...timeRangePredicates(ResponseRatingsField.LastRateTime, range),
      ne(ResponseRatingsField.ChatId, emptyString),
      ...ratePredicates(feedback),
    ]),
    sort: [
      sortItem(FeedbackField.LastRated, QuerySortDirection.Desc),
      sortItem(ResponseRatingsField.ChatId, QuerySortDirection.Asc),
    ],
    page: offsetPage(0, FEEDBACK_CANDIDATE_LIMIT),
  });

const ratingSums = () => [
  col(fn('sum', [field(ResponseRatingsField.RatePosCount)]), FeedbackField.RatingUp),
  col(fn('sum', [field(ResponseRatingsField.RateZeroCount)]), FeedbackField.RateZero),
  col(fn('sum', [field(ResponseRatingsField.RateNegCount)]), FeedbackField.RateNegative),
  col(fn('sum', [field(ResponseRatingsField.RateBoolFalseCount)]), FeedbackField.RateBoolFalse),
  col(fn('sum', [field(ResponseRatingsField.RateRawCount)]), FeedbackField.RateRaw),
  col(fn('sum', [field(ResponseRatingsField.RateEventCount)]), FeedbackField.RateEvents),
];

interface RatingsQueryParams {
  range: TimeRange;
  chatIds: string[];
}

export const buildSessionRatingsQuery = ({ range, chatIds }: RatingsQueryParams): StructuredQuery =>
  aggregateQuery({
    entity: FEEDBACK_ENTITY,
    groupBy: [ResponseRatingsField.ChatId],
    select: [col(field(ResponseRatingsField.ChatId)), ...ratingSums()],
    filter: and([
      ...timeRangePredicates(ResponseRatingsField.LastRateTime, range),
      inValues(ResponseRatingsField.ChatId, QueryValueType.String, chatIds),
    ]),
    page: offsetPage(0, Math.max(chatIds.length, 1)),
  });

export const buildSessionRatingCountsQuery = (chatId: string): StructuredQuery =>
  aggregateQuery({
    entity: FEEDBACK_ENTITY,
    groupBy: [ResponseRatingsField.ChatId],
    select: [col(field(ResponseRatingsField.ChatId)), ...ratingSums()],
    filter: eq(ResponseRatingsField.ChatId, value(QueryValueType.String, chatId)),
    page: offsetPage(0, 1),
  });
