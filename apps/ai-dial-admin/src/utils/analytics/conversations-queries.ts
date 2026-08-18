import { timeRangePredicates } from '@/src/components/Analytics/QueryBuilder/utils/time';
import {
  CONVERSATIONS_ENTITY,
  CONVERSATION_FIELD_VALUE_TYPE,
  CONVERSATION_FILTER_QUERY_OPERATOR,
  FEEDBACK_CANDIDATE_LIMIT,
  FEEDBACK_ENTITY,
  LIST_SELECT_FIELDS,
  OPTIONAL_DETAIL_SELECT_FIELDS,
  OPTIONAL_LIST_SELECT_FIELDS,
  POSITIVE_RATE_EXCLUSIVE_MIN,
  TURNS_ENTITY,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationColumnFilter,
  ConversationFilterOperator,
  ConversationSortKey,
  ConversationTotalsField,
  ConversationTurnField,
  ConversationsField,
  FeedbackField,
  FeedbackFilter,
  RateAnalyticsField,
  RatingDirection,
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
  isNotNull,
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
  visibleFields?: string[];
  availableFields?: string[];
}

// The projection floor: the fields the default-visible columns need, narrowed to what the instance carries.
// Every other curated column defaults to hidden and is projected through `visibleFields` when it is shown,
// so the page fetch does not pay for a column nobody asked for.
const conversationSelect = (visibleFields: string[] = [], availableFields?: string[]): string[] => {
  const floor = availableSelectFields(LIST_SELECT_FIELDS, OPTIONAL_LIST_SELECT_FIELDS, availableFields);
  const named = new Set<string>(floor);
  // `visibleFields` is already derived from the same schema, so this intersection is normally a no-op — it
  // is here so a caller supplying a stale column state cannot reintroduce an unknown field. With no schema
  // it drops them all, matching the floor: nothing optional can be confirmed, so nothing optional is named.
  const available = new Set(availableFields ?? []);

  return [...floor, ...visibleFields.filter((fieldName) => !named.has(fieldName) && available.has(fieldName))];
};

export const buildConversationListQuery = ({
  offset,
  limit,
  sort,
  visibleFields,
  availableFields,
  ...filters
}: ConversationListQueryParams): StructuredQuery =>
  rowQuery({
    entity: CONVERSATIONS_ENTITY,
    select: conversationSelect(visibleFields, availableFields).map((fieldName) => col(field(fieldName))),
    filter: conversationFilter(filters),
    sort: conversationSort(sort),
    page: offsetPage(offset, limit, true),
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

export const buildConversationFeedbackQuery = (chatId: string, limit: number): StructuredQuery =>
  rowQuery({
    entity: FEEDBACK_ENTITY,
    select: [
      col(field(RateAnalyticsField.ResponseId)),
      col(field(RateAnalyticsField.Rate)),
      col(field(RateAnalyticsField.RequestTime)),
    ],
    filter: eq(RateAnalyticsField.ChatId, value(QueryValueType.String, chatId)),
    sort: [sortItem(RateAnalyticsField.RequestTime, QuerySortDirection.Desc)],
    page: offsetPage(0, limit, true),
  });

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
    ],
    filter: and([
      eq(UsageLogField.ChatId, value(QueryValueType.String, chatId)),
      eq(UsageLogField.TraceId, value(QueryValueType.String, traceId)),
    ]),
    sort: [sortItem(UsageLogField.RequestTime, QuerySortDirection.Asc)],
    page: offsetPage(0, limit, true),
  });

export const buildConversationTotalsQuery = (filters: ConversationFilterParams): StructuredQuery =>
  aggregateQuery({
    entity: CONVERSATIONS_ENTITY,
    select: [
      col(fn('count'), ConversationTotalsField.Conversations),
      col(fn('sum', [field(ConversationsField.TotalPrice)]), ConversationTotalsField.Cost),
    ],
    filter: conversationFilter(filters),
  });

const ratePredicates = (feedback: FeedbackFilter): QueryFilterNode[] => {
  const threshold = value(QueryValueType.Integer, String(POSITIVE_RATE_EXCLUSIVE_MIN));

  switch (feedback) {
    case FeedbackFilter.Positive:
      return [gt(RateAnalyticsField.Rate, threshold)];
    case FeedbackFilter.Negative:
      return [le(RateAnalyticsField.Rate, threshold)];
    case FeedbackFilter.Rated:
      return [isNotNull(RateAnalyticsField.Rate)];
    case FeedbackFilter.All:
      return [];
  }
};

interface FeedbackQueryParams {
  range: TimeRange;
  feedback: FeedbackFilter;
}

export const buildRatedConversationIdsQuery = ({ range, feedback }: FeedbackQueryParams): StructuredQuery =>
  aggregateQuery({
    entity: FEEDBACK_ENTITY,
    groupBy: [RateAnalyticsField.ChatId],
    select: [
      col(field(RateAnalyticsField.ChatId)),
      col(fn('max', [field(RateAnalyticsField.RequestTime)]), FeedbackField.LastRated),
    ],
    filter: and([
      ...timeRangePredicates(RateAnalyticsField.RequestTime, range),
      ne(RateAnalyticsField.ChatId, emptyString),
      ...ratePredicates(feedback),
    ]),
    sort: [
      sortItem(FeedbackField.LastRated, QuerySortDirection.Desc),
      sortItem(RateAnalyticsField.ChatId, QuerySortDirection.Asc),
    ],
    page: offsetPage(0, FEEDBACK_CANDIDATE_LIMIT),
  });

interface RatingsQueryParams {
  range: TimeRange;
  chatIds: string[];
  direction: RatingDirection;
}

// `rate` is a signed integer: DIAL sends 1 for a like and -1 for a dislike, and a boolean `false` is
// normalized to 0 — so the split cannot be derived from count and sum, and each direction is counted
// under the same predicate the feedback filter uses. That shared predicate is the point: a conversation
// the Positive filter selects is guaranteed to show a non-zero up count.
const DIRECTION_FEEDBACK: Record<RatingDirection, FeedbackFilter> = {
  [RatingDirection.Up]: FeedbackFilter.Positive,
  [RatingDirection.Down]: FeedbackFilter.Negative,
};

export const buildConversationRatingsQuery = ({ range, chatIds, direction }: RatingsQueryParams): StructuredQuery =>
  aggregateQuery({
    entity: FEEDBACK_ENTITY,
    groupBy: [RateAnalyticsField.ChatId],
    select: [
      col(field(RateAnalyticsField.ChatId)),
      col(fn('count', [field(RateAnalyticsField.Rate)]), FeedbackField.RatingCount),
    ],
    filter: and([
      ...timeRangePredicates(RateAnalyticsField.RequestTime, range),
      inValues(RateAnalyticsField.ChatId, QueryValueType.String, chatIds),
      ...ratePredicates(DIRECTION_FEEDBACK[direction]),
    ]),
    page: offsetPage(0, Math.max(chatIds.length, 1)),
  });
