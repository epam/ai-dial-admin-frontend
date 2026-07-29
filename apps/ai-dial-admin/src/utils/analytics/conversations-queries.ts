import { timeRangePredicates } from '@/src/components/Analytics/QueryBuilder/utils/time';
import {
  CONVERSATION_PAGE_SIZE,
  CONVERSATIONS_ENTITY,
  FEEDBACK_CANDIDATE_LIMIT,
  FEEDBACK_ENTITY,
  POSITIVE_RATE_EXCLUSIVE_MIN,
  SUMMARY_ENRICHMENT_FIELDS,
  USE_CONVERSATION_SUMMARY_ENRICHMENT,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationField,
  FeedbackField,
  FeedbackFilter,
  RateAnalyticsField,
  RatingDirection,
  UsageLogField,
} from '@/src/models/analytics/conversations-trace';
import {
  QueryFilterNode,
  QueryOutputColumn,
  QuerySortDirection,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';
import {
  aggregateQuery,
  and,
  col,
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
  sortItem,
  value,
} from '@/src/utils/analytics/query-build';

const emptyString = value(QueryValueType.String, '');

const searchPredicates = (search: string): QueryFilterNode[] => {
  const term = search.trim();
  if (!term) {
    return [];
  }

  const targets: string[] = [UsageLogField.ChatId, UsageLogField.ProjectId];
  if (USE_CONVERSATION_SUMMARY_ENRICHMENT) {
    targets.push(SUMMARY_ENRICHMENT_FIELDS.title, SUMMARY_ENRICHMENT_FIELDS.snippet);
  }

  return [or(targets.map((fieldName) => ico(fieldName, term)))];
};

// Both the select entries and the search targets hang off one flag, so a title can never be
// displayed without being searchable.
const enrichmentColumns = (): QueryOutputColumn[] =>
  USE_CONVERSATION_SUMMARY_ENRICHMENT
    ? [
        col(field(SUMMARY_ENRICHMENT_FIELDS.title), ConversationField.Title),
        col(field(SUMMARY_ENRICHMENT_FIELDS.snippet), ConversationField.Snippet),
      ]
    : [];

interface ConversationListQueryParams {
  range: TimeRange;
  search?: string;
  chatIds?: string[];
}

export const buildConversationListQuery = ({
  range,
  search = '',
  chatIds = [],
}: ConversationListQueryParams): StructuredQuery =>
  aggregateQuery({
    entity: CONVERSATIONS_ENTITY,
    groupBy: [UsageLogField.ChatId],
    select: [
      col(field(UsageLogField.ChatId)),
      col(fn('count', [field(UsageLogField.TraceId)], true), ConversationField.Turns),
      col(fn('sum', [field(UsageLogField.TotalTokens)]), ConversationField.Tokens),
      col(fn('sum', [field(UsageLogField.TotalPrice)]), ConversationField.Cost),
      col(fn('max', [field(UsageLogField.RequestTime)]), ConversationField.LastActivity),
      col(fn('min', [field(UsageLogField.RequestTime)]), ConversationField.FirstActivity),
      col(fn('min', [field(UsageLogField.Deployment)]), ConversationField.Model),
      col(fn('count', [field(UsageLogField.Deployment)], true), ConversationField.ModelCount),
      col(fn('min', [field(UsageLogField.ProjectId)]), ConversationField.Project),
      ...enrichmentColumns(),
    ],
    filter: and([
      ...timeRangePredicates(UsageLogField.RequestTime, range),
      // The column is non-nullable and defaults to '', so `eq null` would match nothing.
      ne(UsageLogField.ChatId, emptyString),
      ...searchPredicates(search),
      ...(chatIds.length ? [inValues(UsageLogField.ChatId, QueryValueType.String, chatIds)] : []),
    ]),
    sort: [
      sortItem(ConversationField.LastActivity, QuerySortDirection.Desc),
      // Without the tiebreaker the fixed page is not stable between requests.
      sortItem(UsageLogField.ChatId, QuerySortDirection.Asc),
    ],
    page: offsetPage(0, CONVERSATION_PAGE_SIZE),
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
