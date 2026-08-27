import { timeRangePredicates } from '@/src/components/Analytics/QueryBuilder/utils/time';
import {
  CONVERSATIONS_ENTITY,
  CONVERSATION_FIELD_VALUE_TYPE,
  CONVERSATION_FILTER_QUERY_OPERATOR,
  FEEDBACK_CANDIDATE_LIMIT,
  FEEDBACK_ENTITY,
  CONVERSATION_HOP_COUNT_ALIAS,
  OPTIONAL_DETAIL_SELECT_FIELDS,
  OPTIONAL_FEEDBACK_FIELDS,
  OPTIONAL_USAGE_LOG_FIELDS,
  RATING_COUNT_EXCLUSIVE_MIN,
  TURNS_ENTITY,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationColumnFilter,
  ConversationEntryHopRow,
  ConversationSpanRow,
  ConversationFilterOperator,
  ConversationRatingTotalsField,
  ConversationSortKey,
  ConversationTotalsField,
  ConversationTurnField,
  ConversationsField,
  FeedbackField,
  FeedbackFilter,
  ResponseRatingsField,
  TurnsField,
  UsageLogField,
} from '@/src/models/analytics/conversations-trace';
import {
  QueryFilterNode,
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
  col,
  eq,
  field,
  fn,
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

const columnFilterPredicates = (columnFilters: ConversationColumnFilter[]): QueryFilterNode[] =>
  columnFilters.map(({ field: fieldName, operator, value: val, valueTo, valueType: declared }) => {
    const valueType = fieldValueType(fieldName, declared);

    if (operator === ConversationFilterOperator.Range) {
      return and([ge(fieldName, value(valueType, val)), le(fieldName, value(valueType, valueTo as string))]);
    }

    const queryOperator = CONVERSATION_FILTER_QUERY_OPERATOR[operator];
    if (!queryOperator) {
      throw new Error(`No query operator for conversations filter: ${operator}`);
    }
    return predicate(queryOperator, fieldName, value(valueType, val));
  });

interface ConversationFilterParams {
  range: TimeRange;
  search?: string;
  chatIds?: string[];
  columnFilters?: ConversationColumnFilter[];
}

// The list and the totals share one filter, so a pill can never disagree with the rows beneath it.
const conversationFilter = ({
  range,
  search = '',
  chatIds = [],
  columnFilters = [],
}: ConversationFilterParams): QueryFilterNode =>
  and([
    ...timeRangePredicates(ConversationsField.LastRequestTime, range),
    ...searchPredicates(search),
    ...(chatIds.length ? [inValues(ConversationsField.ChatId, QueryValueType.String, chatIds)] : []),
    ...columnFilterPredicates(columnFilters),
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

// The `turns` rollup resolves what a turn is — one row per trace, with the entry time, hop count, token
// total, cost and wall-clock duration already computed — so this reads rows rather than grouping the hop
// log itself. The aliases keep the rollup's columns under the names the timeline already consumes.
export const buildConversationTurnsQuery = (chatId: string, limit: number): StructuredQuery =>
  rowQuery({
    entity: TURNS_ENTITY,
    select: [
      col(field(TurnsField.TraceId)),
      col(field(TurnsField.FirstRequestTime), ConversationTurnField.Started),
      col(field(TurnsField.HopCount), ConversationTurnField.Hops),
      col(field(TurnsField.FailedHopCount), ConversationTurnField.FailedHops),
      col(field(TurnsField.TotalTokens), ConversationTurnField.Tokens),
      col(field(TurnsField.TotalPrice), ConversationTurnField.Cost),
      col(field(TurnsField.DurationMs), ConversationTurnField.DurationMs),
    ],
    filter: eq(TurnsField.ChatId, value(QueryValueType.String, chatId)),
    // The rollup carries no turn index, so the entry time is the only ordering that rebuilds the sequence.
    sort: [sortItem(ConversationTurnField.Started, QuerySortDirection.Asc)],
    page: offsetPage(0, limit),
  });

export const buildConversationSpansQuery = (chatId: string, traceId: string, limit: number): StructuredQuery =>
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
      col(field(UsageLogField.RequestTime)),
      col(field(UsageLogField.ResponseBodyBytes)),
      col(field(UsageLogField.ReasoningTokens)),
      col(field(UsageLogField.McpMethod)),
      col(field(UsageLogField.McpToolCallName)),
      col(field(UsageLogField.ExecutionPath)),
    ],
    filter: and([
      eq(UsageLogField.ChatId, value(QueryValueType.String, chatId)),
      eq(UsageLogField.TraceId, value(QueryValueType.String, traceId)),
    ]),
    sort: [sortItem(UsageLogField.RequestTime, QuerySortDirection.Asc)],
    page: offsetPage(0, limit, true),
  });

const entryHopFilter = (chatId: string): QueryFilterNode =>
  and([eq(UsageLogField.ChatId, value(QueryValueType.String, chatId)), isNull(UsageLogField.CoreParentSpanId)]);

export const buildConversationEntryHopsQuery = (chatId: string, limit: number): StructuredQuery =>
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
    filter: entryHopFilter(chatId),
    sort: [sortItem(UsageLogField.RequestTime, QuerySortDirection.Asc)],
    page: offsetPage(0, limit, true),
  });

export const buildConversationHopCountQuery = (chatId: string): StructuredQuery =>
  aggregateQuery({
    entity: USAGE_LOG_ENTITY,
    select: [col(fn('count'), CONVERSATION_HOP_COUNT_ALIAS)],
    filter: eq(UsageLogField.ChatId, value(QueryValueType.String, chatId)),
  });

// ADAS accepts a `timestamp` value only as epoch millis — an ISO-8601 string is rejected outright. And an
// `in` list over `request_time` compiles to `has(...)`, which prunes no partitions, so the time bound has to
// be a `ge`/`le` range.
export const buildConversationEntryBodiesQuery = (
  chatId: string,
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
      entryHopFilter(chatId),
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

export const buildConversationHopBodyQuery = (
  chatId: string,
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
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
  const recordedMillis = toMillis(requestTime);

  return rowQuery({
    entity: USAGE_LOG_ENTITY,
    select: selectable.map((fieldName) => col(field(fieldName))),
    filter: and([
      eq(UsageLogField.ChatId, value(QueryValueType.String, chatId)),
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

export const buildConversationModelBodiesQuery = (
  chatId: string,
  traceId: string,
  hops: ConversationSpanRow[],
  schemaFieldNames?: string[],
): StructuredQuery => {
  const selectable = availableSelectFields(
    [UsageLogField.CoreSpanId, UsageLogField.ResponseBody, UsageLogField.AssembledResponse],
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
      eq(UsageLogField.ChatId, value(QueryValueType.String, chatId)),
      eq(UsageLogField.TraceId, value(QueryValueType.String, traceId)),
      inValues(
        UsageLogField.CoreSpanId,
        QueryValueType.String,
        hops.map(({ core_span_id }) => core_span_id),
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
