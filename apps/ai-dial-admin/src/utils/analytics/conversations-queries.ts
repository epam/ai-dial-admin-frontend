import { timeRangePredicates } from '@/src/components/Analytics/QueryBuilder/utils/time';
import {
  CONVERSATIONS_ENTITY,
  FEEDBACK_CANDIDATE_LIMIT,
  FEEDBACK_ENTITY,
  POSITIVE_RATE_EXCLUSIVE_MIN,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationTotalsField,
  ConversationTurnField,
  ConversationsField,
  FeedbackField,
  FeedbackFilter,
  RateAnalyticsField,
  RatingDirection,
  UsageLogField,
} from '@/src/models/analytics/conversations-trace';
import { QueryFilterNode, QuerySortDirection, QueryValueType, StructuredQuery } from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';
import {
  aggregateQuery,
  and,
  col,
  eq,
  field,
  fn,
  gt,
  ico,
  inValues,
  isNotNull,
  le,
  ne,
  offsetPage,
  or,
  rowQuery,
  sortItem,
  value,
} from '@/src/utils/analytics/query-build';

const emptyString = value(QueryValueType.String, '');

const searchPredicates = (search: string): QueryFilterNode[] => {
  const term = search.trim();
  if (!term) {
    return [];
  }

  return [or([ConversationsField.ChatId, ConversationsField.ProjectId].map((fieldName) => ico(fieldName, term)))];
};

interface ConversationFilterParams {
  range: TimeRange;
  search?: string;
  chatIds?: string[];
}

// The list and the totals share one filter, so a pill can never disagree with the rows beneath it.
const conversationFilter = ({ range, search = '', chatIds = [] }: ConversationFilterParams): QueryFilterNode =>
  and([
    ...timeRangePredicates(ConversationsField.LastRequestTime, range),
    ...searchPredicates(search),
    ...(chatIds.length ? [inValues(ConversationsField.ChatId, QueryValueType.String, chatIds)] : []),
  ]);

interface ConversationListQueryParams extends ConversationFilterParams {
  offset: number;
  limit: number;
}

export const buildConversationListQuery = ({
  offset,
  limit,
  ...filters
}: ConversationListQueryParams): StructuredQuery =>
  rowQuery({
    entity: CONVERSATIONS_ENTITY,
    select: [
      col(field(ConversationsField.ChatId)),
      col(field(ConversationsField.ProjectId)),
      col(field(ConversationsField.TurnCount)),
      col(field(ConversationsField.TotalTokens)),
      col(field(ConversationsField.TotalPrice)),
      col(field(ConversationsField.LastRequestTime)),
      col(field(ConversationsField.FirstRequestTime)),
    ],
    filter: conversationFilter(filters),
    sort: [
      sortItem(ConversationsField.LastRequestTime, QuerySortDirection.Desc),
      // The service appends no implicit tiebreaker, so without this a paged result is not stable
      // between requests and a row can be skipped or repeated across pages.
      sortItem(ConversationsField.ChatId, QuerySortDirection.Asc),
    ],
    page: offsetPage(offset, limit, true),
  });

export const buildConversationDetailQuery = (chatId: string): StructuredQuery =>
  rowQuery({
    entity: CONVERSATIONS_ENTITY,
    select: Object.values(ConversationsField).map((fieldName) => col(field(fieldName))),
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

export const buildConversationTurnsQuery = (chatId: string, limit: number): StructuredQuery =>
  aggregateQuery({
    entity: USAGE_LOG_ENTITY,
    groupBy: [UsageLogField.TraceId],
    select: [
      col(field(UsageLogField.TraceId)),
      col(fn('min', [field(UsageLogField.RequestTime)]), ConversationTurnField.Started),
      col(fn('count'), ConversationTurnField.Hops),
      col(fn('sum', [field(UsageLogField.TotalTokens)]), ConversationTurnField.Tokens),
      col(fn('sum', [field(UsageLogField.DeploymentPrice)]), ConversationTurnField.Cost),
      col(fn('max', [field(UsageLogField.OperationDurationMs)]), ConversationTurnField.DurationMs),
    ],
    filter: eq(UsageLogField.ChatId, value(QueryValueType.String, chatId)),
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
