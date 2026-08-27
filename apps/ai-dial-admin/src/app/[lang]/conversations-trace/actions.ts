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
  ConversationHopBodies,
  ModelCallOutput,
  ConversationPageRequest,
  ConversationPeriodSummary,
  ConversationRatingRow,
  ConversationRatingTotalsField,
  ConversationRow,
  ConversationEntryBodyRow,
  ConversationModelBodyRow,
  ConversationEntryHopRow,
  ConversationSpanRow,
  ConversationSpansPage,
  ConversationTranscript,
  ConversationTotals,
  ConversationTotalsField,
  HopTextsState,
  TranscriptState,
  ConversationTurnRow,
  ConversationTurnsResult,
  ConversationsPage,
  FeedbackFilter,
  ResponseRatingsField,
} from '@/src/models/analytics/conversations-trace';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { errorObjLog } from '@/src/server/logger';
import { attachRatings, conversationRatingCounts, unresolvedRatings } from '@/src/utils/analytics/conversation-rows';
import {
  buildConversationDetailQuery,
  buildConversationEntryBodiesQuery,
  buildConversationEntryHopsQuery,
  buildConversationFeedbackQuery,
  buildConversationHopBodyQuery,
  buildConversationHopCountQuery,
  buildConversationModelBodiesQuery,
  buildConversationListQuery,
  buildConversationSpansQuery,
  buildConversationTurnsQuery,
  buildConversationRatingCountsQuery,
  buildConversationRatingsQuery,
  buildConversationRatingTotalsQuery,
  buildConversationTotalsQuery,
  buildRatedConversationIdsQuery,
} from '@/src/utils/analytics/conversations-queries';
import {
  CONVERSATION_ENTRY_HOP_LIMIT,
  CONVERSATION_FEEDBACK_LIMIT,
  CONVERSATION_HOP_COUNT_ALIAS,
  CONVERSATION_SPAN_LIMIT,
  CONVERSATION_TURN_LIMIT,
  CONVERSATIONS_ENTITY,
  FEEDBACK_CANDIDATE_LIMIT,
  FEEDBACK_ENTITY,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import { AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { withEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { toNumber } from '@/src/utils/analytics/scalar';
import { transcriptBodyFields } from '@/src/utils/analytics/conversation-column-catalog';
import {
  assembleTranscript,
  carriesWholeConversation,
  transcriptStateOf,
} from '@/src/utils/analytics/conversation-transcript';
import { hopTextsOf } from '@/src/utils/analytics/conversation-hop-texts';
import { isConversationHop } from '@/src/utils/analytics/conversation-hop-stream';
import { isModelCall } from '@/src/utils/analytics/conversation-spans';
import { modelOutputOf, splitModelBodyBudget, unreadOutputOf } from '@/src/utils/analytics/conversation-model-outputs';
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

  const query = buildConversationRatingsQuery({ range, chatIds: rows.map((row) => row.chat_id) });
  const result = await analyticsDataApi.executeAction(query, authToken);

  if (!result.success) {
    errorObjLog(result, 'Failed to resolve conversation ratings');
    return unresolvedRatings(rows);
  }

  return attachRatings(rows, ratingRows(result));
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
    .map((row) => row[ResponseRatingsField.ChatId])
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

  const periodSummary = isFirstPage ? resolvePeriodSummary(range, authToken) : Promise.resolve(undefined);

  if (isNarrowedToNothing({ ...request, chatIds })) {
    return {
      success: true,
      response: {
        rows: [],
        total: 0,
        ...withPeriod(await periodSummary),
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

  const [page, period] = await Promise.all([
    (async () => {
      const result = await analyticsDataApi.executeAction(query, authToken);
      if (!result.success) {
        return { result, rows: null };
      }
      const rows = (result.response?.rows ?? []) as unknown as ConversationRow[];
      return { result, rows: await withRatings(rows, range, authToken) };
    })(),
    periodSummary,
  ]);

  // The grid's row total is the period count, which is the grid's own count only while nothing narrows the
  // period. Under a filter it is not, and must not be offered as one: the grid then finds the end of the
  // result by a page coming back short, which is the signal it already terminates on.
  const gridTotal = isNarrowed(request) ? null : toNumber(period?.totals?.conversations ?? null);

  const resolved = {
    total: gridTotal,
    ...withPeriod(period),
    ...(candidates ? { candidates } : {}),
  };

  if (!page.rows) {
    return { ...page.result, response: { rows: [], ...resolved } };
  }

  return { ...page.result, response: { rows: page.rows, ...resolved } };
}

export async function getConversationDetail(
  chatId: string,
  availableFields?: string[],
): Promise<ServerActionResponse<ConversationDetailResult>> {
  const result = await analyticsDataApi.executeAction(
    buildConversationDetailQuery(chatId, availableFields),
    await token(),
  );

  if (!result.success) {
    return { ...result, response: undefined };
  }

  const conversation = (result.response?.rows?.[0] ?? null) as ConversationDetailRow | null;

  return { ...result, response: { conversation } };
}

// Never rejects: a failed schema read must cost the optional comment column, not the page. Without this the
// rejection would reach the detail route's `Promise.all` and render the error state for a conversation whose
// transcript, turns and record all resolved. `resolveModelOutputs` defends the same way for the same reason.
async function feedbackSchemaFields(authToken: Token): Promise<string[] | undefined> {
  try {
    const schema = await withEntitySchemaCache(FEEDBACK_ENTITY, authToken, () =>
      analyticsDataApi.getEntitySchema(FEEDBACK_ENTITY, authToken),
    );
    return schema?.fields?.map(({ name }) => name);
  } catch (error) {
    errorObjLog(error, 'Failed to fetch the rating source entity schema');
    return undefined;
  }
}

/**
 * The list and the conversation's own figures, resolved together. The figures come from an aggregate scoped
 * to the conversation rather than from counting the listed rows: the list is bounded, so counting it would
 * report the bound as the conversation's total. Both reads are issued concurrently — neither needs the other
 * — and the counts failing leaves them unresolved without taking the list down with them.
 */
export async function getConversationFeedback(chatId: string): Promise<ServerActionResponse<ConversationFeedbackPage>> {
  const authToken = await token();
  const schemaFieldNames = await feedbackSchemaFields(authToken);

  const [list, counts] = await Promise.all([
    analyticsDataApi.executeAction(
      buildConversationFeedbackQuery(chatId, CONVERSATION_FEEDBACK_LIMIT, schemaFieldNames),
      authToken,
    ),
    analyticsDataApi.executeAction(buildConversationRatingCountsQuery(chatId), authToken),
  ]);

  if (!list.success) {
    return { ...list, response: undefined };
  }

  const countRow = ratingRows(counts)[0];
  if (!counts.success) {
    errorObjLog(counts, 'Failed to resolve conversation rating counts');
  }

  return {
    ...list,
    response: {
      rows: (list.response?.rows ?? []) as unknown as ConversationFeedbackRow[],
      total: list.response?.totalCount ?? null,
      ratings: counts.success ? conversationRatingCounts(countRow) : null,
      isCommentTextReadable: (schemaFieldNames ?? []).includes(ResponseRatingsField.CommentSample),
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

const NO_HOP_TEXTS = { sent: null, received: null, toolCalls: [] };

const hopBodiesOf = (state: HopTextsState): ConversationHopBodies => ({ state, ...NO_HOP_TEXTS });

export async function getConversationHopBodies(
  chatId: string,
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
): Promise<ServerActionResponse<ConversationHopBodies>> {
  const authToken = await token();
  const schema = await withEntitySchemaCache(USAGE_LOG_ENTITY, authToken, () =>
    analyticsDataApi.getEntitySchema(USAGE_LOG_ENTITY, authToken),
  );

  if (!schema) {
    return { success: false, response: hopBodiesOf(HopTextsState.LoadFailed) };
  }

  const schemaFieldNames = schema.fields?.map(({ name }) => name) ?? [];
  if (!transcriptBodyFields(schemaFieldNames).isReadable) {
    return { success: true, response: hopBodiesOf(HopTextsState.ColumnsUnavailable) };
  }

  const result = await analyticsDataApi.executeAction(
    buildConversationHopBodyQuery(chatId, traceId, coreSpanId, requestTime, schemaFieldNames),
    authToken,
  );

  if (!result.success) {
    errorObjLog(result, 'Failed to fetch the conversation hop bodies');
    return { ...result, response: hopBodiesOf(HopTextsState.LoadFailed) };
  }

  const row = (result.response?.rows ?? [])[0] as unknown as ConversationEntryBodyRow | undefined;
  if (!row) {
    return { success: true, response: hopBodiesOf(HopTextsState.NoBodies) };
  }

  const texts = hopTextsOf(row);
  const hasText = texts.sent !== null || texts.received !== null || texts.toolCalls.length > 0;

  return {
    success: true,
    response: { state: hasText ? HopTextsState.Available : HopTextsState.NoBodies, ...texts },
  };
}

// Never rejects: the outputs enrich the event stream, and the spans beside them are worth rendering
// without it. A throw here used to discard a span read that had already succeeded.
async function resolveModelOutputs(
  chatId: string,
  traceId: string,
  spans: ConversationSpanRow[],
  authToken: Token,
): Promise<ModelCallOutput[]> {
  try {
    return await readModelOutputs(chatId, traceId, spans, authToken);
  } catch (error) {
    errorObjLog(error, 'Failed to enrich the conversation spans with model call outputs');
    return [];
  }
}

async function readModelOutputs(
  chatId: string,
  traceId: string,
  spans: ConversationSpanRow[],
  authToken: Token,
): Promise<ModelCallOutput[]> {
  const schema = await withEntitySchemaCache(USAGE_LOG_ENTITY, authToken, () =>
    analyticsDataApi.getEntitySchema(USAGE_LOG_ENTITY, authToken),
  );
  const schemaFieldNames = schema?.fields?.map(({ name }) => name) ?? [];

  if (!schema || !transcriptBodyFields(schemaFieldNames).responseFields.length) {
    return [];
  }

  const candidates = spans.filter(
    (span) => isModelCall(span) && isConversationHop(span) && toNumber(span.response_body_bytes) !== 0,
  );
  const { read, skipped } = splitModelBodyBudget(candidates);
  if (!read.length) {
    return candidates.map(unreadOutputOf);
  }

  const result = await analyticsDataApi.executeAction(
    buildConversationModelBodiesQuery(chatId, traceId, read, schemaFieldNames),
    authToken,
  );

  if (!result.success) {
    errorObjLog(result, 'Failed to fetch the conversation model call outputs');
    return [];
  }

  const decoded = ((result.response?.rows ?? []) as unknown as ConversationModelBodyRow[]).map(modelOutputOf);

  return [...decoded, ...skipped.map(unreadOutputOf)];
}

export async function getConversationSpans(
  chatId: string,
  traceId: string,
): Promise<ServerActionResponse<ConversationSpansPage>> {
  const authToken = await token();
  const query = buildConversationSpansQuery(chatId, traceId, CONVERSATION_SPAN_LIMIT);
  const result = await analyticsDataApi.executeAction(query, authToken);

  if (!result.success) {
    return { ...result, response: undefined };
  }

  const spans = (result.response?.rows ?? []) as unknown as ConversationSpanRow[];

  return {
    ...result,
    response: {
      spans,
      total: result.response?.totalCount ?? null,
      modelOutputs: await resolveModelOutputs(chatId, traceId, spans, authToken),
    },
  };
}

const isNarrowed = ({ search, columnFilters, feedback }: ConversationPageRequest): boolean =>
  Boolean(search) || Boolean(columnFilters?.length) || feedback !== FeedbackFilter.All;

const withPeriod = (period?: ConversationPeriodSummary) => (period ? { period } : {});

async function resolveConversationTotals(range: TimeRange, authToken: Token): Promise<ConversationTotals | undefined> {
  const result = await analyticsDataApi.executeAction(buildConversationTotalsQuery(range), authToken);

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

async function resolveRatingCount(
  range: TimeRange,
  feedback: FeedbackFilter,
  authToken: Token,
): Promise<number | null | undefined> {
  const result = await analyticsDataApi.executeAction(
    buildConversationRatingTotalsQuery({ range, feedback }),
    authToken,
  );

  if (!result.success) {
    errorObjLog(result, 'Failed to resolve the conversation rating totals');
    return undefined;
  }

  const row = result.response?.rows?.[0];

  return toNumber((row?.[ConversationRatingTotalsField.Conversations] ?? null) as number | string | null);
}

async function resolvePeriodSummary(range: TimeRange, authToken: Token): Promise<ConversationPeriodSummary> {
  const [totals, rated, negative] = await Promise.all([
    resolveConversationTotals(range, authToken),
    resolveRatingCount(range, FeedbackFilter.Rated, authToken),
    resolveRatingCount(range, FeedbackFilter.Negative, authToken),
  ]);

  const hasRatings = rated !== undefined && negative !== undefined;

  return {
    ...(totals ? { totals } : {}),
    ...(hasRatings ? { ratings: { rated: rated ?? null, negative: negative ?? null } } : {}),
  };
}

const EMPTY_TRANSCRIPT = { messages: [], loadedTurns: null };

const transcriptOf = (state: TranscriptState): ConversationTranscript => ({ state, ...EMPTY_TRANSCRIPT });

export async function getConversationTranscript(
  chatId: string,
  lastRequestTime: number | string | null,
  nowMs: number,
): Promise<ServerActionResponse<ConversationTranscript>> {
  const authToken = await token();
  const schema = await withEntitySchemaCache(USAGE_LOG_ENTITY, authToken, () =>
    analyticsDataApi.getEntitySchema(USAGE_LOG_ENTITY, authToken),
  );

  if (!schema) {
    return { success: false, response: transcriptOf(TranscriptState.LoadFailed) };
  }

  const schemaFieldNames = schema.fields?.map(({ name }) => name) ?? [];
  const { isReadable } = transcriptBodyFields(schemaFieldNames);

  if (!isReadable) {
    return { success: true, response: transcriptOf(TranscriptState.ColumnsUnavailable) };
  }

  const [entryResult, countResult] = await Promise.all([
    analyticsDataApi.executeAction(buildConversationEntryHopsQuery(chatId, CONVERSATION_ENTRY_HOP_LIMIT), authToken),
    analyticsDataApi.executeAction(buildConversationHopCountQuery(chatId), authToken),
  ]);

  if (!entryResult.success) {
    errorObjLog(entryResult, 'Failed to fetch the conversation entry hops');
    return { ...entryResult, response: transcriptOf(TranscriptState.LoadFailed) };
  }

  const entryHops = (entryResult.response?.rows ?? []) as unknown as ConversationEntryHopRow[];

  if (!entryHops.length && !countResult.success) {
    errorObjLog(countResult, 'Failed to resolve the conversation hop count');
    return { ...countResult, response: transcriptOf(TranscriptState.LoadFailed) };
  }

  const countRow = countResult.response?.rows?.[0];
  const hopCount = toNumber((countRow?.[CONVERSATION_HOP_COUNT_ALIAS] ?? null) as number | string | null) ?? 0;
  const state = transcriptStateOf({
    isReadable,
    hasLoadFailed: false,
    entryHopCount: entryHops.length,
    hopCount,
    lastRequestTime,
    nowMs,
  });

  if (state !== TranscriptState.Available) {
    return { success: true, response: transcriptOf(state) };
  }

  const needed = carriesWholeConversation(entryHops) ? [entryHops[entryHops.length - 1]] : entryHops;
  const bodyResult = await analyticsDataApi.executeAction(
    buildConversationEntryBodiesQuery(chatId, needed, schemaFieldNames),
    authToken,
  );

  if (!bodyResult.success) {
    errorObjLog(bodyResult, 'Failed to fetch the conversation entry bodies');
    return { ...bodyResult, response: transcriptOf(TranscriptState.LoadFailed) };
  }

  const bodies = (bodyResult.response?.rows ?? []) as unknown as ConversationEntryBodyRow[];
  const messages = assembleTranscript(entryHops, bodies);

  // Entry hops that yielded no message is not "nothing was recorded": the rows are there and the bodies
  // could not be turned into a transcript, which is what this state says.
  if (!messages.length) {
    return { success: true, response: transcriptOf(TranscriptState.NotReconstructable) };
  }

  return {
    success: true,
    response: {
      state: TranscriptState.Available,
      messages,
      loadedTurns: entryHops.length,
    },
  };
}
