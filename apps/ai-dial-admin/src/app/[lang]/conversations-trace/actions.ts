'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import {
  ConversationCandidateIds,
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
  CONVERSATIONS_ENTITY,
  FEEDBACK_CANDIDATE_LIMIT,
} from '@/src/constants/analytics/conversations-trace';
import { AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { withEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { toNumber } from '@/src/utils/analytics/scalar';
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

// Resolved on the first page of a result and returned to the caller, which carries the ids into every
// later page of it: the narrowing is a property of the filter, not of the page. Not exported — a
// server-side cache keyed on the filter state alone would serve one caller's candidates to another, and
// the caller already holds them for the life of the filter state.
async function resolveRatedChatIds(
  filters: ConversationFilters,
  authToken: Token,
): Promise<ServerActionResponse<ConversationCandidateIds>> {
  const query = buildRatedConversationIdsQuery({ range: toRange(filters), feedback: filters.feedback });
  const result = await analyticsDataApi.executeAction(query, authToken);

  if (!result.success) {
    return { ...result, response: undefined };
  }

  const ids = (result.response?.rows ?? [])
    .map((row) => row[RateAnalyticsField.ChatId])
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  return { ...result, response: { ids, isCapped: ids.length >= FEEDBACK_CANDIDATE_LIMIT } };
}

// An active feedback filter narrows by `in`, so an empty candidate set means "nothing carries this
// feedback" — the complete answer. Building the query anyway would drop the `in` predicate and return
// every conversation, and the service rejects an empty `in` list with a 400 either way.
const isNarrowedToNothing = ({ feedback, chatIds }: ConversationPageRequest): boolean =>
  feedback !== FeedbackFilter.All && !chatIds?.length;

export async function getConversationsSchema(): Promise<ServerActionResponse<AnalyticsEntitySchema>> {
  const authToken = await token();
  const schema = await withEntitySchemaCache(CONVERSATIONS_ENTITY, authToken, () =>
    analyticsDataApi.getEntitySchema(CONVERSATIONS_ENTITY, authToken),
  );

  return schema ? { success: true, response: schema } : { success: false };
}

/**
 * One request per fetch cycle. A first-page request resolves the feedback candidates, then runs the row
 * query and the summary query **concurrently** and returns all three; running the summary after the rows
 * would make the merged call slower than the two separate ones it replaces. A later-page request takes the
 * candidate ids from the caller and runs neither.
 */
export async function getConversations(request: ConversationPageRequest): Promise<ConversationsResponse> {
  const authToken = await token();
  const range = toRange(request);
  const isFirstPage = request.offset === 0;

  let candidates: ConversationCandidateIds | undefined;
  let chatIds = request.chatIds;

  if (isFirstPage && request.feedback !== FeedbackFilter.All) {
    const resolved = await resolveRatedChatIds(request, authToken);
    if (!resolved.success) {
      return { ...resolved, response: undefined };
    }
    candidates = resolved.response;
    chatIds = candidates?.ids ?? [];
  }

  if (isNarrowedToNothing({ ...request, chatIds })) {
    return {
      success: true,
      response: {
        rows: [],
        total: 0,
        ...(isFirstPage ? { totals: { conversations: 0, cost: null } } : {}),
        ...(candidates ? { candidates } : {}),
      },
    };
  }

  const query = buildConversationListQuery({
    range,
    search: request.search,
    chatIds: chatIds ?? [],
    columnFilters: request.columnFilters ?? [],
    sort: request.sort ?? [],
    sourceFields: request.sourceFields ?? [],
    visibleEnrichmentFields: request.visibleEnrichmentFields ?? [],
    offset: request.offset,
    limit: request.limit,
  });

  const [page, totals] = await Promise.all([
    (async () => {
      const result = await analyticsDataApi.executeAction(query, authToken);
      if (!result.success) {
        return { result, rows: null };
      }
      const rows = (result.response?.rows ?? []) as unknown as ConversationRow[];
      return { result, rows: await withRatings(rows, range, authToken) };
    })(),
    isFirstPage ? resolveConversationTotals(request, chatIds, authToken) : Promise.resolve(undefined),
  ]);

  // The rows and the summary are separate queries, so one failing is no evidence about the other. A failed
  // row query still reports whatever the summary resolved, which is what lets the pills keep standing.
  const resolved = {
    total: totals ? toNumber(totals.conversations) : null,
    ...(totals ? { totals } : {}),
    ...(candidates ? { candidates } : {}),
  };

  if (!page.rows) {
    return { ...page.result, response: { rows: [], ...resolved } };
  }

  return { ...page.result, response: { rows: page.rows, ...resolved } };
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

// Resolved alongside the first page rather than by a request of its own. Not exported: the summary has to
// be an observation of the same fetch cycle as the rows beside it, which is exactly what returning them
// together guarantees.
async function resolveConversationTotals(
  filters: ConversationFilters,
  chatIds: string[] | undefined,
  authToken: Token,
): Promise<ConversationTotals | undefined> {
  const query = buildConversationTotalsQuery({
    range: toRange(filters),
    search: filters.search,
    chatIds: chatIds ?? [],
    columnFilters: filters.columnFilters ?? [],
  });
  const result = await analyticsDataApi.executeAction(query, authToken);

  if (!result.success) {
    errorObjLog(result, 'Failed to resolve the conversations summary');
    return undefined;
  }

  const row = result.response?.rows?.[0];

  return {
    conversations: (row?.[ConversationTotalsField.Conversations] ?? null) as ConversationTotals['conversations'],
    cost: (row?.[ConversationTotalsField.Cost] ?? null) as ConversationTotals['cost'],
  };
}
