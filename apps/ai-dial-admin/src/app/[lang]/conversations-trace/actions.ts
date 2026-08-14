'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import {
  ConversationDetailResult,
  ConversationDetailRow,
  ConversationFeedbackPage,
  ConversationFeedbackRow,
  ConversationFilters,
  ConversationPageRequest,
  ConversationRatingRow,
  ConversationRow,
  ConversationSpanRow,
  ConversationSpansPage,
  ConversationTotals,
  ConversationTotalsField,
  ConversationTurnRow,
  ConversationTurnsResult,
  ConversationsPage,
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
  buildConversationDetailQuery,
  buildConversationFeedbackQuery,
  buildConversationListQuery,
  buildConversationSpansQuery,
  buildConversationTurnsQuery,
  buildConversationRatingsQuery,
  buildConversationTotalsQuery,
  buildRatedConversationIdsQuery,
} from '@/src/utils/analytics/conversations-queries';
import {
  CONVERSATION_FEEDBACK_LIMIT,
  CONVERSATION_SPAN_LIMIT,
  CONVERSATION_TURN_LIMIT,
} from '@/src/constants/analytics/conversations-trace';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

type ConversationsResponse = ServerActionResponse<ConversationsPage>;

const toRange = ({ startMs, endMs }: ConversationFilters): TimeRange => ({
  startDate: new Date(startMs),
  endDate: new Date(endMs),
});

const ratingRows = (result: ServerActionResponse<StructuredQueryResult>): ConversationRatingRow[] =>
  (result.response?.rows ?? []) as unknown as ConversationRatingRow[];

const withRatings = async (rows: ConversationRow[], range: TimeRange, authToken: Token): Promise<ConversationRow[]> => {
  if (!rows.length) {
    return rows;
  }

  const params = { range, chatIds: rows.map((row) => row.chat_id) };
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

// Resolved once per filter state by the caller and carried into every page of that result: the
// narrowing is a property of the filter, not of the page.
export async function getRatedChatIds(filters: ConversationFilters): Promise<ServerActionResponse<{ ids: string[] }>> {
  const query = buildRatedConversationIdsQuery({ range: toRange(filters), feedback: filters.feedback });
  const result = await analyticsDataApi.executeAction(query, await token());

  if (!result.success) {
    return { ...result, response: undefined };
  }

  const ids = (result.response?.rows ?? [])
    .map((row) => row[RateAnalyticsField.ChatId])
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  return { ...result, response: { ids } };
}

// An active feedback filter narrows by `in`, so an empty candidate set means "nothing carries this
// feedback" — the complete answer. Building the query anyway would drop the `in` predicate and return
// every conversation, and the service rejects an empty `in` list with a 400 either way.
const isNarrowedToNothing = ({ feedback, chatIds }: ConversationPageRequest): boolean =>
  feedback !== FeedbackFilter.All && !chatIds?.length;

export async function getConversations(request: ConversationPageRequest): Promise<ConversationsResponse> {
  if (isNarrowedToNothing(request)) {
    return { success: true, response: { rows: [], total: 0 } };
  }

  const authToken = await token();
  const range = toRange(request);

  const query = buildConversationListQuery({
    range,
    search: request.search,
    chatIds: request.chatIds ?? [],
    offset: request.offset,
    limit: request.limit,
  });
  const result = await analyticsDataApi.executeAction(query, authToken);

  if (!result.success) {
    return { ...result, response: undefined };
  }

  const rows = (result.response?.rows ?? []) as unknown as ConversationRow[];

  return {
    ...result,
    response: {
      rows: await withRatings(rows, range, authToken),
      total: result.response?.totalCount ?? null,
    },
  };
}

export async function getConversationDetail(chatId: string): Promise<ServerActionResponse<ConversationDetailResult>> {
  const result = await analyticsDataApi.executeAction(buildConversationDetailQuery(chatId), await token());

  if (!result.success) {
    return { ...result, response: undefined };
  }

  const conversation = (result.response?.rows?.[0] ?? null) as ConversationDetailRow | null;

  return { ...result, response: { conversation } };
}

export async function getConversationFeedback(chatId: string): Promise<ServerActionResponse<ConversationFeedbackPage>> {
  const query = buildConversationFeedbackQuery(chatId, CONVERSATION_FEEDBACK_LIMIT);
  const result = await analyticsDataApi.executeAction(query, await token());

  if (!result.success) {
    return { ...result, response: undefined };
  }

  return {
    ...result,
    response: {
      rows: (result.response?.rows ?? []) as unknown as ConversationFeedbackRow[],
      total: result.response?.totalCount ?? null,
    },
  };
}

export async function getConversationTurns(chatId: string): Promise<ServerActionResponse<ConversationTurnsResult>> {
  const query = buildConversationTurnsQuery(chatId, CONVERSATION_TURN_LIMIT);
  const result = await analyticsDataApi.executeAction(query, await token());

  if (!result.success) {
    return { ...result, response: undefined };
  }

  return { ...result, response: { turns: (result.response?.rows ?? []) as unknown as ConversationTurnRow[] } };
}

export async function getConversationSpans(
  chatId: string,
  traceId: string,
): Promise<ServerActionResponse<ConversationSpansPage>> {
  const query = buildConversationSpansQuery(chatId, traceId, CONVERSATION_SPAN_LIMIT);
  const result = await analyticsDataApi.executeAction(query, await token());

  if (!result.success) {
    return { ...result, response: undefined };
  }

  return {
    ...result,
    response: {
      spans: (result.response?.rows ?? []) as unknown as ConversationSpanRow[],
      total: result.response?.totalCount ?? null,
    },
  };
}

export async function getConversationTotals(
  filters: ConversationFilters,
  chatIds?: string[],
): Promise<ServerActionResponse<ConversationTotals>> {
  if (isNarrowedToNothing({ ...filters, offset: 0, limit: 0, chatIds })) {
    return { success: true, response: { conversations: 0, cost: null } };
  }

  const query = buildConversationTotalsQuery({
    range: toRange(filters),
    search: filters.search,
    chatIds: chatIds ?? [],
  });
  const result = await analyticsDataApi.executeAction(query, await token());

  if (!result.success) {
    return { ...result, response: undefined };
  }

  const row = result.response?.rows?.[0];

  return {
    ...result,
    response: {
      conversations: (row?.[ConversationTotalsField.Conversations] ?? null) as ConversationTotals['conversations'],
      cost: (row?.[ConversationTotalsField.Cost] ?? null) as ConversationTotals['cost'],
    },
  };
}
