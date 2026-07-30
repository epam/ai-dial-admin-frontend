'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import {
  ConversationFilters,
  ConversationRatingRow,
  ConversationRow,
  FeedbackFilter,
  RateAnalyticsField,
  RatingDirection,
} from '@/src/models/analytics/conversations-trace';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { errorObjLog } from '@/src/server/logger';
import { attachRatings, unresolvedRatings } from '@/src/utils/analytics/conversation-rows';
import {
  buildConversationListQuery,
  buildConversationRatingsQuery,
  buildRatedConversationIdsQuery,
} from '@/src/utils/analytics/conversations-queries';
import { USE_CONVERSATIONS_MOCK, buildConversationsMock } from '@/src/mocks/analytics/conversations-trace';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

type ConversationsResponse = ServerActionResponse<{ rows: ConversationRow[] }>;

const toRange = ({ startMs, endMs }: ConversationFilters): TimeRange => ({
  startDate: new Date(startMs),
  endDate: new Date(endMs),
});

const fetchRatedChatIds = async (
  filters: ConversationFilters,
  authToken: Token,
): Promise<{ ids: string[] | null; failure?: ConversationsResponse }> => {
  if (filters.feedback === FeedbackFilter.All) {
    return { ids: null };
  }

  const query = buildRatedConversationIdsQuery({ range: toRange(filters), feedback: filters.feedback });
  const result = await analyticsDataApi.executeAction(query, authToken);

  if (!result.success) {
    return { ids: null, failure: { ...result, response: undefined } };
  }

  const ids = (result.response?.rows ?? [])
    .map((row) => row[RateAnalyticsField.ChatId])
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  return { ids };
};

const ratingRows = (result: ServerActionResponse<StructuredQueryResult>): ConversationRatingRow[] =>
  (result.response?.rows ?? []) as unknown as ConversationRatingRow[];

const withRatings = async (
  rows: ConversationRow[],
  filters: ConversationFilters,
  authToken: Token,
): Promise<ConversationRow[]> => {
  if (!rows.length) {
    return rows;
  }

  const params = { range: toRange(filters), chatIds: rows.map((row) => row.chat_id) };
  const [up, down] = await Promise.all(
    [RatingDirection.Up, RatingDirection.Down].map((direction) =>
      analyticsDataApi.executeAction(buildConversationRatingsQuery({ ...params, direction }), authToken),
    ),
  );

  // Either direction missing leaves the split unknowable, so the cell shows nothing rather than a
  // half-counted rating that reads as real.
  if (!up.success || !down.success) {
    errorObjLog(up.success ? down : up, 'Failed to resolve conversation ratings');
    return unresolvedRatings(rows);
  }

  return attachRatings(rows, ratingRows(up), ratingRows(down));
};

export async function getConversations(filters: ConversationFilters): Promise<ConversationsResponse> {
  if (USE_CONVERSATIONS_MOCK) {
    return { success: true, response: { rows: buildConversationsMock(filters) } };
  }

  const authToken = await token();

  const { ids, failure } = await fetchRatedChatIds(filters, authToken);
  if (failure) {
    return failure;
  }

  if (ids?.length === 0) {
    return { success: true, response: { rows: [] } };
  }

  const query = buildConversationListQuery({
    range: toRange(filters),
    search: filters.search,
    chatIds: ids ?? [],
  });
  const result = await analyticsDataApi.executeAction(query, authToken);

  if (!result.success) {
    return { ...result, response: undefined };
  }

  const rows = (result.response?.rows ?? []) as unknown as ConversationRow[];

  return { ...result, response: { rows: await withRatings(rows, filters, authToken) } };
}
