import { timeRangePredicates } from '@/src/components/Analytics/QueryBuilder/utils/time';
import {
  ARRAY_VALUE_PAGE_SIZE,
  CHAT_ID_SESSION_SOURCE,
  CONVERSATIONS_ENTITY,
  CONVERSATION_FIELD_VALUE_COUNT_ALIAS,
  CONVERSATION_FIELD_VALUE_LIMIT,
  CONVERSATION_FIELD_VALUE_TYPE,
  CONVERSATION_FILTER_QUERY_OPERATOR,
  FEEDBACK_CANDIDATE_LIMIT,
  FEEDBACK_ENTITY,
  CONVERSATION_HOP_COUNT_ALIAS,
  OPTIONAL_DETAIL_SELECT_FIELDS,
  OPTIONAL_FEEDBACK_FIELDS,
  OPTIONAL_USAGE_LOG_FIELDS,
  RATING_COUNT_EXCLUSIVE_MIN,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationArrayFilter,
  ConversationArrayValueSource,
  ConversationColumnFilter,
  ConversationEntryHopRow,
  ConversationTraceFigureField,
  ConversationTracePageField,
  ConversationTraceWindow,
  ConversationFilterOperator,
  ConversationRatingTotalsField,
  ConversationScalarOperator,
  ConversationSortKey,
  ConversationTotalsField,
  ConversationsField,
  FeedbackField,
  FeedbackFilter,
  ResponseRatingsField,
  SessionScope,
  UsageLogField,
} from '@/src/models/analytics/conversations-trace';
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
import { availableSelectFields } from '@/src/utils/analytics/conversation-column-catalog';
import { toMillis } from '@/src/utils/analytics/conversation-formatting';

const emptyString = value(QueryValueType.String, '');

const searchPredicates = (search: string): QueryFilterNode[] => {
  const term = search.trim();
  if (!term) {
    return [];
  }

  return [or([ConversationsField.ChatId, ConversationsField.ProjectId].map((fieldName) => ico(fieldName, term)))];
};

const fieldValueType = (fieldName: string, declared?: QueryValueType): QueryValueType => {
  const valueType = declared ?? CONVERSATION_FIELD_VALUE_TYPE[fieldName as ConversationsField];
  if (!valueType) {
    throw new Error(`No value type for conversations field: ${fieldName}`);
  }
  return valueType;
};

const columnFilterPredicate = (filter: ConversationColumnFilter): QueryFilterNode => {
  const { field: fieldName, valueType: declared } = filter;
  const valueType = fieldValueType(fieldName, declared);

  if (filter.operator === ConversationFilterOperator.In) {
    return inValues(fieldName, valueType, filter.values);
  }

  if (filter.operator === ConversationFilterOperator.Range) {
    return and([
      ge(fieldName, value(valueType, filter.value)),
      le(fieldName, value(valueType, filter.valueTo as string)),
    ]);
  }

  const queryOperator = CONVERSATION_FILTER_QUERY_OPERATOR[filter.operator];
  if (!queryOperator) {
    throw new Error(`No query operator for conversations filter: ${filter.operator}`);
  }
  return predicate(queryOperator, fieldName, value(valueType, filter.value));
};

const columnFilterPredicates = (columnFilters: ConversationColumnFilter[]): QueryFilterNode[] =>
  columnFilters.map(columnFilterPredicate);

const ARRAY_HAS = 'array_has';
const ARRAY_HAS_ANY = 'array_has_any';
const ARRAY_LENGTH = 'array_length';

const NEGATED_ARRAY_OPERATORS: ConversationScalarOperator[] = [
  ConversationFilterOperator.NotContains,
  ConversationFilterOperator.NotEquals,
];

// `contains` arrives here as the whole values its text matched, and tests membership in that set. `equals`
// needs no resolution: the entered text *is* the value, so it tests one element directly.
//
// Exported because the server action decides whether to issue the resolution query from the same question.
// Held in one place deliberately: were the two to drift, a resolved multi-name set would be reduced to a
// single-element test and return a wrong answer with nothing raised.
const RESOLVED_ARRAY_OPERATORS: ConversationScalarOperator[] = [
  ConversationFilterOperator.Contains,
  ConversationFilterOperator.NotContains,
];

export const needsValueResolution = (operator: ConversationScalarOperator): boolean =>
  RESOLVED_ARRAY_OPERATORS.includes(operator);

// The multi-value guard is not reachable through the grid, where `equals` carries exactly one value. It is
// here because the alternative to widening is dropping: `array_has` takes one element, so a second value
// would vanish with no error, unlike an unmapped operator, which throws.
const arrayMembership = (
  fieldName: string,
  operator: ConversationScalarOperator,
  values: string[],
  valueType: QueryValueType,
): QueryFnExpr =>
  needsValueResolution(operator) || values.length > 1
    ? fn(ARRAY_HAS_ANY, [field(fieldName), arrayOf(valueType, values)])
    : fn(ARRAY_HAS, [field(fieldName), value(valueType, values[0])]);

// Nothing resolved, so the predicate is a constant. A positive filter matched no value and therefore matches
// no conversation; a negated one is satisfied by every conversation, since no element can equal a value that
// does not exist. Both are still *stated*, rather than the filter being dropped — the header shows an active
// filter and the query has to mean what it shows. `array_length` is 0 for an empty or null array and never
// null, so `< 0` is unsatisfiable and `>= 0` is a tautology over the same column.
const emptyArrayMatch = (fieldName: string, operator: ConversationScalarOperator): QueryFilterNode => {
  const length = fn(ARRAY_LENGTH, [field(fieldName)]);
  const zero = value(QueryValueType.Integer, '0');

  return NEGATED_ARRAY_OPERATORS.includes(operator)
    ? exprPredicate(QueryOperator.Ge, length, zero)
    : exprPredicate(QueryOperator.Lt, length, zero);
};

// `ico` and `in` are scalar and reject an array operand, which is what the column's old `filter: false` was
// written against. `array_has*` returns false — never null — for an empty or null array, so comparing the
// call against `false` is exactly "no element matches" and needs no null arm.
const arrayFilterPredicates = (arrayFilters: ConversationArrayFilter[]): QueryFilterNode[] =>
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

interface ConversationFilterParams {
  range: TimeRange;
  search?: string;
  chatIds?: string[];
  columnFilters?: ConversationColumnFilter[];
  arrayFilters?: ConversationArrayFilter[];
}

// The list and the totals share one filter, so a pill can never disagree with the rows beneath it.
const conversationFilter = ({
  range,
  search = '',
  chatIds = [],
  columnFilters = [],
  arrayFilters = [],
}: ConversationFilterParams): QueryFilterNode =>
  and([
    ...timeRangePredicates(ConversationsField.LastRequestTime, range),
    ...searchPredicates(search),
    ...(chatIds.length ? [inValues(ConversationsField.ChatId, QueryValueType.String, chatIds)] : []),
    ...columnFilterPredicates(columnFilters),
    ...arrayFilterPredicates(arrayFilters),
  ]);

const conversationSort = (sort: ConversationSortKey[] = []): QuerySortItem[] => {
  const callerKeys = sort.map(({ field: fieldName, direction }) => sortItem(fieldName, direction, QuerySortNulls.Last));

  return [
    ...(callerKeys.length ? callerKeys : [sortItem(ConversationsField.LastRequestTime, QuerySortDirection.Desc)]),
    sortItem(ConversationsField.ChatId, QuerySortDirection.Asc),
  ];
};

interface ConversationListQueryParams extends ConversationFilterParams {
  offset: number;
  limit: number;
  sort?: ConversationSortKey[];
  // Split by what projecting a field costs, not by whether its column is on screen: the caller sends every
  // cheap source column, plus whichever gated ones — heavy or enrichment — its columns currently show.
  sourceFields?: string[];
  visibleEnrichmentFields?: string[];
}

// Read outside any cell renderer — the grid keys its rows by it, a row click navigates by it, and the loaded
// set is mapped by it — so a row is unusable without it whatever the column state. Every other field a
// column reads is renderer-scoped and therefore reaches the query through the cost buckets instead. Sorting
// and filtering need nothing here: both are resolved server-side by field name, not from the projected row.
const IDENTITY_SELECT_FIELDS: ConversationsField[] = [ConversationsField.ChatId];

// Named only when the caller has no schema to classify from — the base rollup columns, which is what the
// curated columns still render in that state. With a schema in hand every one of these arrives through
// `sourceFields`, costed like any other field: that is the point of not keeping them exempt, since the day
// the service marks one `heavy` the gating applies with no carve-out list here to re-audit.
const SCHEMALESS_SELECT_FIELDS: ConversationsField[] = [
  ConversationsField.ChatId,
  ConversationsField.ProjectId,
  ConversationsField.UserHash,
  ConversationsField.TurnCount,
  ConversationsField.TotalTokens,
  ConversationsField.TotalPrice,
  ConversationsField.LastRequestTime,
  ConversationsField.FirstRequestTime,
  ConversationsField.Deployments,
];

// Both incoming sets are resolved from the entity schema by `projectableSchemaFields`, so a field the
// instance does not carry never reaches here. Only the single-conversation query, which enumerates a
// frontend enum rather than the schema, has to intersect for itself.
const conversationSelect = (sourceFields: string[] = [], visibleEnrichmentFields: string[] = []): string[] => {
  const core = sourceFields.length ? IDENTITY_SELECT_FIELDS : SCHEMALESS_SELECT_FIELDS;
  const named = new Set<string>(core);

  return [...core, ...sourceFields.filter((fieldName) => !named.has(fieldName)), ...visibleEnrichmentFields];
};

// No `include_total`: the totals query resolves the same count under the same filter, and the service runs
// a requested total as its own statement over the whole filtered result — so asking here would scan it
// again for every page fetched.
export const buildConversationListQuery = ({
  offset,
  limit,
  sort,
  sourceFields,
  visibleEnrichmentFields,
  ...filters
}: ConversationListQueryParams): StructuredQuery =>
  rowQuery({
    entity: CONVERSATIONS_ENTITY,
    select: conversationSelect(sourceFields, visibleEnrichmentFields).map((fieldName) => col(field(fieldName))),
    filter: conversationFilter(filters),
    sort: conversationSort(sort),
    page: offsetPage(offset, limit),
  });

interface ArrayValueResolutionParams {
  source: ConversationArrayValueSource;
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

interface ConversationFieldValuesParams extends ConversationFilterParams {
  field: string;
}

// Faceted against the page's *other* narrowing: the period, the search term, the feedback candidates and
// every other column's predicate all carry, so each count equals what selecting that value returns. The
// opened column's own predicate does not — including it collapses the list to what is already selected, and
// a selection could then never be widened without first being cleared.
export const buildConversationFieldValuesQuery = ({
  field: fieldName,
  columnFilters = [],
  arrayFilters = [],
  ...filters
}: ConversationFieldValuesParams): StructuredQuery =>
  aggregateQuery({
    entity: CONVERSATIONS_ENTITY,
    groupBy: [fieldName],
    select: [col(field(fieldName)), col(fn('count'), CONVERSATION_FIELD_VALUE_COUNT_ALIAS)],
    filter: conversationFilter({
      ...filters,
      columnFilters: columnFilters.filter((filter) => filter.field !== fieldName),
      arrayFilters: arrayFilters.filter((filter) => filter.field !== fieldName),
    }),
    // The value breaks a tie on the count, so two equally frequent values keep a stable order between
    // openings rather than swapping places under the operator's pointer.
    sort: [
      sortItem(CONVERSATION_FIELD_VALUE_COUNT_ALIAS, QuerySortDirection.Desc),
      sortItem(fieldName, QuerySortDirection.Asc),
    ],
    page: offsetPage(0, CONVERSATION_FIELD_VALUE_LIMIT),
  });

export const buildConversationDetailQuery = (chatId: string, availableFields?: string[]): StructuredQuery =>
  rowQuery({
    entity: CONVERSATIONS_ENTITY,
    select: availableSelectFields(
      Object.values(ConversationsField),
      OPTIONAL_DETAIL_SELECT_FIELDS,
      availableFields,
    ).map((fieldName) => col(field(fieldName))),
    filter: eq(ConversationsField.ChatId, value(QueryValueType.String, chatId)),
    page: offsetPage(0, 1, true),
  });

export const buildConversationFeedbackQuery = (
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
// Core's own project while the client's rows carry the conversation's, so filtering by the conversation's
// project drops exactly the rows and cards this listing exists to show — and drops them *silently*, because
// the figures query would still count what the roots query lost. That is the arithmetic-correction bug this
// design removes, so do not "unify" the three filter lists into one shared helper.
//
// `project_id` is nonetheless *projected* by the roots query: the Core-internal marker compares it against
// the conversation's. Required in one clause, forbidden in the other.

// The window the roots and figures passes share. Both take it as one value rather than deriving it twice, so
// they cannot end up scoped to different ranges.
const traceWindowPredicates = (window: ConversationTraceWindow): QueryFilterNode[] => [
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

export const buildConversationTracePageQuery = (
  scope: SessionScope,
  projectId: string,
  window: ConversationTraceWindow,
  offset: number,
  limit: number,
): StructuredQuery =>
  aggregateQuery({
    entity: USAGE_LOG_ENTITY,
    groupBy: [UsageLogField.TraceId],
    select: [
      col(field(UsageLogField.TraceId)),
      col(fn('min', [field(UsageLogField.RequestTime)]), ConversationTracePageField.FirstRequestTime),
      col(fn('max', [field(UsageLogField.RequestTime)]), ConversationTracePageField.LastRequestTime),
    ],
    filter: and([
      sessionScopePredicate(scope),
      eq(UsageLogField.ProjectId, value(QueryValueType.String, projectId)),
      ...traceWindowPredicates(window),
    ]),
    sort: [
      sortItem(ConversationTracePageField.FirstRequestTime, QuerySortDirection.Asc),
      sortItem(UsageLogField.TraceId, QuerySortDirection.Asc),
    ],
    page: offsetPage(offset, limit),
  });

// Pass two. Every root span of the page's traces, each read for the card it becomes. Located by `trace_id`
// alone: requiring the conversation header here would drop the roots that carry none, which is the shape this
// listing exists to render.
export const buildConversationTraceRootsQuery = (
  traceIds: string[],
  window: ConversationTraceWindow,
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
//
// Also the second call site's shape: the Chat view resolves figures for the traces its own transcript covers
// by passing that transcript's trace ids, so an answer's figures never depend on how far the listing has been
// paged. Same scoping rules apply there.
export const buildConversationTraceFiguresQuery = (
  traceIds: string[],
  window: ConversationTraceWindow,
  limit: number,
): StructuredQuery =>
  aggregateQuery({
    entity: USAGE_LOG_ENTITY,
    groupBy: [UsageLogField.TraceId, UsageLogField.EventKind],
    select: [
      col(field(UsageLogField.TraceId)),
      col(field(UsageLogField.EventKind)),
      col(fn('count'), ConversationTraceFigureField.Spans),
      col(fn('sum', [field(UsageLogField.TotalTokens)]), ConversationTraceFigureField.Tokens),
      col(fn('sum', [field(UsageLogField.DeploymentPrice)]), ConversationTraceFigureField.Price),
      // No `countIf` in the catalog and no `CASE` in the grammar; `if` is what expresses this.
      col(
        fn('sum', [
          fnIf(field(UsageLogField.Success), value(QueryValueType.Integer, '0'), value(QueryValueType.Integer, '1')),
        ]),
        ConversationTraceFigureField.FailedSpans,
      ),
      col(fn('group_uniq_array', [field(UsageLogField.ResponseId)]), ConversationTraceFigureField.ResponseIds),
    ],
    filter: and([inValues(UsageLogField.TraceId, QueryValueType.String, traceIds), ...traceWindowPredicates(window)]),
    sort: [sortItem(UsageLogField.TraceId, QuerySortDirection.Asc)],
    page: offsetPage(0, limit),
  });

// Scoped by `trace_id` alone, deliberately. A `chat_id` predicate here excluded the rows the listing counts —
// a root carrying no header, and the Core-internal calls recorded under the trace — so the drawer contradicted
// the card that opened it: one measured trace's card states two hops while a header-scoped read returned one,
// and the root the card describes was absent from its own span tree. No trace carries two distinct non-empty
// chat ids, so the trace id alone cannot draw in another conversation's rows.
export const buildConversationSpansQuery = (traceId: string, limit: number): StructuredQuery =>
  rowQuery({
    entity: USAGE_LOG_ENTITY,
    select: [
      col(field(UsageLogField.CoreSpanId)),
      col(field(UsageLogField.CoreParentSpanId)),
      col(field(UsageLogField.EventKind)),
      col(field(UsageLogField.Deployment)),
      col(field(UsageLogField.ParentDeployment)),
      col(field(UsageLogField.RequestMethod)),
      col(field(UsageLogField.RequestUri)),
      col(field(UsageLogField.ResponseUpstreamUri)),
      col(field(UsageLogField.ResponseStatus)),
      col(field(UsageLogField.Success)),
      col(field(UsageLogField.OperationDurationMs)),
      col(field(UsageLogField.TotalTokens)),
      col(field(UsageLogField.DeploymentPrice)),
      // The chain-inclusive price, and the only cost figure a hop that metered nothing of its own has: an
      // application hop records a null `deployment_price` while its subtree really did spend.
      col(field(UsageLogField.TotalPrice)),
      col(field(UsageLogField.RequestTime)),
      col(field(UsageLogField.ResponseBodyBytes)),
      // Plain columns, and the inspector's only pre-body facts: the request message count is what the Request
      // tab's badge states, and it stays right when a body read is clamped or withheld.
      col(field(UsageLogField.RequestBodyBytes)),
      col(field(UsageLogField.NumberRequestMessages)),
      col(field(UsageLogField.ReasoningTokens)),
      col(field(UsageLogField.McpMethod)),
      col(field(UsageLogField.McpToolCallName)),
      col(field(UsageLogField.ExecutionPath)),
    ],
    filter: eq(UsageLogField.TraceId, value(QueryValueType.String, traceId)),
    sort: [sortItem(UsageLogField.RequestTime, QuerySortDirection.Asc)],
    page: offsetPage(0, limit, true),
  });

const entryHopFilter = (scope: SessionScope): QueryFilterNode =>
  and([sessionScopePredicate(scope), isNull(UsageLogField.CoreParentSpanId)]);

export const buildConversationEntryHopsQuery = (scope: SessionScope, limit: number): StructuredQuery =>
  rowQuery({
    entity: USAGE_LOG_ENTITY,
    select: [
      col(field(UsageLogField.TraceId)),
      col(field(UsageLogField.RequestTime)),
      col(field(UsageLogField.Deployment)),
      col(field(UsageLogField.NumberRequestMessages)),
      col(field(UsageLogField.RequestBodyBytes)),
      col(field(UsageLogField.ResponseBodyBytes)),
    ],
    filter: entryHopFilter(scope),
    sort: [sortItem(UsageLogField.RequestTime, QuerySortDirection.Asc)],
    page: offsetPage(0, limit, true),
  });

export const buildConversationHopCountQuery = (scope: SessionScope): StructuredQuery =>
  aggregateQuery({
    entity: USAGE_LOG_ENTITY,
    select: [col(fn('count'), CONVERSATION_HOP_COUNT_ALIAS)],
    filter: sessionScopePredicate(scope),
  });

// ADAS accepts a `timestamp` value only as epoch millis — an ISO-8601 string is rejected outright. And an
// `in` list over `request_time` compiles to `has(...)`, which prunes no partitions, so the time bound has to
// be a `ge`/`le` range.
export const buildConversationEntryBodiesQuery = (
  scope: SessionScope,
  hops: ConversationEntryHopRow[],
  schemaFieldNames?: string[],
): StructuredQuery => {
  const selectable = availableSelectFields(
    [
      UsageLogField.TraceId,
      UsageLogField.EventKind,
      UsageLogField.RequestBody,
      UsageLogField.ResponseBody,
      UsageLogField.AssembledResponse,
    ],
    OPTIONAL_USAGE_LOG_FIELDS,
    schemaFieldNames,
  );
  const recordedMillis = hops
    .map(({ request_time }) => toMillis(request_time))
    .filter((ms): ms is number => ms !== null);

  return rowQuery({
    entity: USAGE_LOG_ENTITY,
    select: selectable.map((fieldName) => col(field(fieldName))),
    filter: and([
      entryHopFilter(scope),
      inValues(
        UsageLogField.TraceId,
        QueryValueType.String,
        hops.map(({ trace_id }) => trace_id),
      ),
      ...(recordedMillis.length
        ? [
            ge(UsageLogField.RequestTime, value(QueryValueType.Timestamp, String(Math.min(...recordedMillis)))),
            le(UsageLogField.RequestTime, value(QueryValueType.Timestamp, String(Math.max(...recordedMillis)))),
          ]
        : []),
    ]),
    sort: [sortItem(UsageLogField.RequestTime, QuerySortDirection.Asc)],
    page: offsetPage(0, Math.max(hops.length, 1)),
  });
};

// The body columns to read are supplied rather than assumed: entitlement to the request body and to the
// response body is separate, and a caller holding one must not have the other named in their query — an
// unknown field rejects the whole read, which would withdraw the side they *are* entitled to along with the
// one they are not.
export const buildConversationHopBodyQuery = (
  scope: SessionScope,
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
  bodyFields: UsageLogField[],
): StructuredQuery => {
  const selectable = [UsageLogField.TraceId, UsageLogField.EventKind, UsageLogField.RequestUri, ...bodyFields];
  const recordedMillis = toMillis(requestTime);

  return rowQuery({
    entity: USAGE_LOG_ENTITY,
    select: selectable.map((fieldName) => col(field(fieldName))),
    filter: and([
      sessionScopePredicate(scope),
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
export const buildConversationTotalsQuery = (range: TimeRange): StructuredQuery =>
  aggregateQuery({
    entity: CONVERSATIONS_ENTITY,
    select: [
      col(fn('count'), ConversationTotalsField.Conversations),
      col(fn('sum', [field(ConversationsField.TotalPrice)]), ConversationTotalsField.Cost),
    ],
    filter: and(timeRangePredicates(ConversationsField.LastRequestTime, range)),
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

export const buildConversationRatingTotalsQuery = ({ range, feedback }: FeedbackQueryParams): StructuredQuery =>
  aggregateQuery({
    entity: FEEDBACK_ENTITY,
    select: [col(fn('count', [field(ResponseRatingsField.ChatId)], true), ConversationRatingTotalsField.Conversations)],
    filter: and([
      ...timeRangePredicates(ResponseRatingsField.LastRateTime, range),
      ne(ResponseRatingsField.ChatId, emptyString),
      ...ratePredicates(feedback),
    ]),
  });

export const buildRatedConversationIdsQuery = ({ range, feedback }: FeedbackQueryParams): StructuredQuery =>
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

export const buildConversationRatingsQuery = ({ range, chatIds }: RatingsQueryParams): StructuredQuery =>
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

export const buildConversationRatingCountsQuery = (chatId: string): StructuredQuery =>
  aggregateQuery({
    entity: FEEDBACK_ENTITY,
    groupBy: [ResponseRatingsField.ChatId],
    select: [col(field(ResponseRatingsField.ChatId)), ...ratingSums()],
    filter: eq(ResponseRatingsField.ChatId, value(QueryValueType.String, chatId)),
    page: offsetPage(0, 1),
  });
