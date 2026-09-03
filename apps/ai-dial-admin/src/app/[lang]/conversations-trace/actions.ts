'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi } from '@/src/app/api/api';
import {
  ConversationArrayFilter,
  ConversationArrayValueSource,
  ConversationCandidateIds,
  ConversationColumnFilter,
  ConversationDetailResult,
  ConversationDetailRow,
  ConversationFeedbackPage,
  ConversationFeedbackRow,
  ConversationFieldValue,
  ConversationFieldValuesRequest,
  ConversationFilterOperator,
  ConversationFilters,
  ConversationPageRequest,
  ConversationPeriodSummary,
  ConversationRatingRow,
  ConversationRatingTotalsField,
  ConversationScalarFilter,
  ConversationRow,
  ConversationEntryBodyRow,
  ConversationSpanRow,
  ConversationSpansPage,
  ConversationsField,
  ConversationTotals,
  ConversationTotalsField,
  HopDialect,
  HopEmbeddingFacts,
  HopInspectorSide,
  HopMcpFacts,
  HopParams,
  HopMessageValue,
  HopRawBody,
  HopReadState,
  HopRequestEnvelope,
  HopResponseEnvelope,
  HopBodyFields,
  UsageLogField,
  ConversationTracePage,
  ConversationTracePageRow,
  HopBodyGrants,
  ConversationTraceFigureRow,
  ConversationTraceRootRow,
  ConversationsPage,
  FeedbackFilter,
  ResponseRatingsField,
  SessionScope,
} from '@/src/models/analytics/conversations-trace';
import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { StructuredQueryResult } from '@/src/models/analytics/query';
import { TimeRange } from '@/src/models/time-range';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { errorObjLog } from '@/src/server/logger';
import { attachRatings, conversationRatingCounts, unresolvedRatings } from '@/src/utils/analytics/conversation-rows';
import {
  buildArrayValueResolutionQuery,
  buildConversationDetailQuery,
  buildConversationFeedbackQuery,
  buildConversationFieldValuesQuery,
  buildConversationHopBodyQuery,
  buildConversationListQuery,
  buildConversationSpansQuery,
  buildConversationTraceFiguresQuery,
  buildConversationTracePageQuery,
  buildConversationTraceRootsQuery,
  buildConversationRatingCountsQuery,
  buildConversationRatingsQuery,
  buildConversationRatingTotalsQuery,
  buildConversationTotalsQuery,
  buildRatedConversationIdsQuery,
  needsValueResolution,
} from '@/src/utils/analytics/conversations-queries';
import {
  ARRAY_VALUE_PAGE_CAP,
  ARRAY_VALUE_PAGE_SIZE,
  CONVERSATION_ARRAY_VALUE_SOURCE,
  CONVERSATION_FEEDBACK_LIMIT,
  CONVERSATION_FIELD_VALUE_COUNT_ALIAS,
  CONVERSATION_SPAN_LIMIT,
  CONVERSATION_TRACE_PAGE_SIZE,
  CONVERSATION_TRACE_ROOT_CAP,
  CONVERSATIONS_ENTITY,
  FEEDBACK_CANDIDATE_LIMIT,
  FEEDBACK_ENTITY,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { withEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { toNumber } from '@/src/utils/analytics/scalar';
import { paddedUtcDayRange } from '@/src/utils/analytics/conversation-formatting';
import { traceGroupsOf, traceInvariantViolations } from '@/src/utils/analytics/conversation-trace-groups';
import { hopBodyFields } from '@/src/utils/analytics/conversation-column-catalog';
import { dialectOf, messagesForDialect } from '@/src/utils/analytics/hop-inspector/dialect';
import { embeddingFactsOf } from '@/src/utils/analytics/hop-inspector/embedding';
import {
  buildRequestEnvelope,
  NO_CLAMP,
  parseJson,
  textByteLength,
} from '@/src/utils/analytics/hop-inspector/envelope';
import { mcpFactsOf } from '@/src/utils/analytics/hop-inspector/mcp';
import { paramsOf } from '@/src/utils/analytics/hop-inspector/params';
import { NO_FACTS, responseEnvelopeOf, rawBodyOf } from '@/src/utils/analytics/hop-inspector/response';
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

  const query = buildConversationRatingsQuery({ range, chatIds: rows.map((row) => row.client_session_id) });
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

const arrayValueSource = (fieldName: string): ConversationArrayValueSource | undefined =>
  CONVERSATION_ARRAY_VALUE_SOURCE[fieldName as ConversationsField];

/**
 * Every value the entered text matches, paged to exhaustion — a truncated set would narrow the listing to
 * fewer conversations than match, with an active filter in the header and nothing saying so, and no single
 * query can hold it (see `ARRAY_VALUE_PAGE_SIZE`).
 *
 * `undefined` on a failed read, never a partial set: half the values would narrow the result to a subset of
 * the matches, which is the outcome the paging exists to avoid.
 */
async function resolveArrayValues(
  source: ConversationArrayValueSource,
  range: TimeRange,
  term: string,
  authToken: Token,
): Promise<string[] | undefined> {
  const values: string[] = [];

  for (let page = 0; page < ARRAY_VALUE_PAGE_CAP; page += 1) {
    const result = await analyticsDataApi.executeAction(
      buildArrayValueResolutionQuery({ source, range, term, offset: page * ARRAY_VALUE_PAGE_SIZE }),
      authToken,
    );

    if (!result.success) {
      errorObjLog(result, `Failed to resolve the values of the ${source.field} filter`);
      return undefined;
    }

    const rows = result.response?.rows ?? [];
    for (const row of rows) {
      const name = row[source.field];
      if (typeof name === 'string' && name.length > 0) {
        values.push(name);
      }
    }

    if (rows.length < ARRAY_VALUE_PAGE_SIZE) {
      return values;
    }
  }

  errorObjLog(
    { field: source.field, cap: ARRAY_VALUE_PAGE_CAP },
    'The array value resolution never returned a short page and was abandoned rather than truncated',
  );
  return undefined;
}

async function resolveArrayFilter(
  filter: ConversationScalarFilter,
  source: ConversationArrayValueSource,
  range: TimeRange,
  authToken: Token,
): Promise<ConversationArrayFilter | undefined> {
  const carried = {
    field: filter.field,
    operator: filter.operator,
    ...(filter.valueType ? { valueType: filter.valueType } : {}),
  };

  if (!needsValueResolution(filter.operator)) {
    return { ...carried, values: [filter.value] };
  }

  const values = await resolveArrayValues(source, range, filter.value, authToken);

  // An empty result is an answer, not a failure: no value matched the text, so no conversation does. The
  // query builder states that as a predicate rather than dropping the filter.
  return values ? { ...carried, values } : undefined;
}

interface ResolvedColumnFilters {
  columnFilters: ConversationColumnFilter[];
  arrayFilters: ConversationArrayFilter[];
}

/**
 * Splits the grid's column filters into the ones the listing query can predicate on directly and the ones
 * over an array-valued column, whose text is resolved to whole values here.
 *
 * Returns `undefined` when a resolution query failed. Dropping the filter instead would widen the result
 * past what the column header states — the operator would read conversations their filter excludes as
 * matches — so the caller fails rather than answering a different question.
 *
 * A value-set (`in`) filter is never an array filter: the value picker binds only to a field the schema
 * types `enum`, and an array-typed field is never derived into a column at all.
 *
 * `resolved` carries the sets a previous call worked out, so a later page of one result reuses them instead
 * of resolving again — it only ever narrows the caller's own query.
 */
async function resolveColumnFilters(
  columnFilters: ConversationColumnFilter[],
  range: TimeRange,
  authToken: Token,
  resolved?: ConversationArrayFilter[],
): Promise<ResolvedColumnFilters | undefined> {
  const scalar: ConversationColumnFilter[] = [];
  const arrays: ConversationArrayFilter[] = [];

  for (const filter of columnFilters) {
    if (filter.operator === ConversationFilterOperator.In) {
      scalar.push(filter);
      continue;
    }

    const source = arrayValueSource(filter.field);
    if (!source) {
      scalar.push(filter);
      continue;
    }

    // A set the caller already holds for this result, matched on the field alone: one filter per column is
    // all the grid's model can express.
    const carried = resolved?.find((entry) => entry.field === filter.field);
    if (carried) {
      arrays.push(carried);
      continue;
    }

    const values = await resolveArrayFilter(filter, source, range, authToken);
    if (!values) {
      return undefined;
    }
    arrays.push(values);
  }

  return { columnFilters: scalar, arrayFilters: arrays };
}

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

  const resolvedFilters = await resolveColumnFilters(
    request.columnFilters ?? [],
    range,
    authToken,
    request.arrayFilters,
  );

  if (!resolvedFilters) {
    return {
      success: false,
      response: {
        rows: [],
        total: null,
        ...withPeriod(await periodSummary),
        ...(candidates ? { candidates } : {}),
      },
    };
  }

  const query = buildConversationListQuery({
    range,
    search: request.search,
    chatIds: chatIds ?? [],
    columnFilters: resolvedFilters.columnFilters,
    arrayFilters: resolvedFilters.arrayFilters,
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
    ...(isFirstPage && resolvedFilters.arrayFilters.length ? { arrayFilters: resolvedFilters.arrayFilters } : {}),
  };

  if (!page.rows) {
    return { ...page.result, response: { rows: [], ...resolved } };
  }

  return { ...page.result, response: { rows: page.rows, ...resolved } };
}

/**
 * The values a column holds, for the filter that lists them for selection.
 *
 * Faceted against the page's other narrowing — see `buildConversationFieldValuesQuery` for which predicates
 * carry and why the opened column's own does not.
 */
export async function getConversationFieldValues(
  request: ConversationFieldValuesRequest,
): Promise<ServerActionResponse<ConversationFieldValue[]>> {
  const authToken = await token();
  const range = toRange(request);

  // Same guard as the listing's: an empty candidate set under an active feedback filter is the complete
  // answer, not a missing predicate.
  if (request.feedback !== FeedbackFilter.All && !request.chatIds?.length) {
    return { success: true, response: [] };
  }

  // The caller passes the sets its rows are narrowed by rather than letting this resolve its own: the
  // resolution reads a live table, so a fresh one could count under a different set than the rows on screen,
  // and a count that disagrees with what selecting the value returns is worse than no count.
  const resolvedFilters = await resolveColumnFilters(
    request.columnFilters ?? [],
    range,
    authToken,
    request.arrayFilters,
  );

  if (!resolvedFilters) {
    return { success: false };
  }

  const result = await analyticsDataApi.executeAction(
    buildConversationFieldValuesQuery({
      field: request.field,
      range,
      search: request.search,
      chatIds: request.chatIds ?? [],
      columnFilters: resolvedFilters.columnFilters,
      arrayFilters: resolvedFilters.arrayFilters,
    }),
    authToken,
  );

  if (!result.success) {
    errorObjLog(result, `Failed to resolve the values of the ${request.field} column`);
    return { ...result, response: undefined };
  }

  // Null is not one of an enum's values: on an enrichment-backed field it means the enrichment has not
  // reached that conversation, which is a statement about coverage rather than something to select. The
  // grouped count reports it as a group all the same, so it is dropped here.
  const values = (result.response?.rows ?? []).reduce<ConversationFieldValue[]>((list, row) => {
    const name = row[request.field];
    if (typeof name === 'string' && name.length > 0) {
      list.push({
        value: name,
        count: toNumber((row[CONVERSATION_FIELD_VALUE_COUNT_ALIAS] ?? null) as number | string | null),
      });
    }
    return list;
  }, []);

  return { success: true, response: values };
}

export async function getConversationDetail(
  chatId: string,
  schemaFields?: AnalyticsEntityField[],
): Promise<ServerActionResponse<ConversationDetailResult>> {
  const result = await analyticsDataApi.executeAction(
    buildConversationDetailQuery(chatId, schemaFields),
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
// header, traces and record all resolved.
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

// A page's roots and figures are read for at most this many rows. Both bounds assume rows spread evenly
// across the page's traces, and neither is guaranteed: dev data holds traces with over a hundred roots, and a
// new event kind widens the figures read. So the bound alone is not the safeguard — a read that comes back
// exactly full is treated as clipped and reported, because a silently clipped roots read renders traces as
// "entry call not recorded" and a silently clipped figures read produces wrong totals.
const TRACE_ROOTS_LIMIT = CONVERSATION_TRACE_PAGE_SIZE * CONVERSATION_TRACE_ROOT_CAP;
const TRACE_FIGURES_LIMIT = CONVERSATION_TRACE_PAGE_SIZE * 8;

/**
 * One page of the conversation's trace listing, resolved live over the hop log in three passes.
 *
 * The first pass pages the traces and yields nothing but their ids and their own time bounds. The other two
 * are then issued concurrently against **the page's** window rather than the conversation's: a page spans
 * minutes, so the read stays within a handful of daily partitions however long the conversation ran.
 *
 * The window is padded past whole UTC days at both ends. The bounds come from rows a chat-id-scoped read can
 * see, and they have to cover rows it cannot — a root recorded before its first child, and a Core-internal
 * root recorded after its parent's last child.
 */
export async function getConversationTracePage(
  scope: SessionScope,
  projectId: string,
  firstRequestTime: number | string | null,
  lastRequestTime: number | string | null,
  offset: number,
): Promise<ServerActionResponse<ConversationTracePage>> {
  const authToken = await token();
  const conversationWindow = paddedUtcDayRange([firstRequestTime, lastRequestTime]);

  if (!conversationWindow) {
    return { success: true, response: { groups: [], hasMore: false } };
  }

  const pageResult = await analyticsDataApi.executeAction(
    buildConversationTracePageQuery(scope, projectId, conversationWindow, offset, CONVERSATION_TRACE_PAGE_SIZE),
    authToken,
  );

  if (!pageResult.success) {
    errorObjLog(pageResult, 'Failed to fetch the conversation trace page');
    return { ...pageResult, response: undefined };
  }

  const pageRows = (pageResult.response?.rows ?? []) as unknown as ConversationTracePageRow[];
  if (!pageRows.length) {
    return { success: true, response: { groups: [], hasMore: false } };
  }

  // Aggregate mode never populates a total, so a full page is the only evidence that another may exist.
  const hasMore = pageRows.length === CONVERSATION_TRACE_PAGE_SIZE;
  const traceIds = pageRows.map(({ trace_id }) => trace_id);
  const pageWindow = paddedUtcDayRange(
    pageRows.flatMap(({ first_request_time, last_request_time }) => [first_request_time, last_request_time]),
  );

  if (!pageWindow) {
    return { success: true, response: { groups: [], hasMore } };
  }

  const [rootsResult, figuresResult] = await Promise.all([
    analyticsDataApi.executeAction(
      buildConversationTraceRootsQuery(traceIds, pageWindow, TRACE_ROOTS_LIMIT),
      authToken,
    ),
    analyticsDataApi.executeAction(
      buildConversationTraceFiguresQuery(traceIds, pageWindow, TRACE_FIGURES_LIMIT),
      authToken,
    ),
  ]);

  if (!rootsResult.success) {
    errorObjLog(rootsResult, 'Failed to fetch the conversation trace root spans');
  }

  // A failed *figures* read is not survivable: the figures are the trace-level totals, so rendering without
  // them states 0 spans, 0 tokens and no cost as though they were the trace's facts. That is the
  // silently-wrong-figure outcome this design removes, so the page fails instead of degrading.
  if (!figuresResult.success) {
    errorObjLog(figuresResult, 'Failed to fetch the conversation trace figures');
    return { ...figuresResult, response: undefined };
  }

  // A failed *roots* read costs the cards, not the page: a trace still renders from its figures, stating that
  // its entry call was not recorded — the same presentation a genuinely unrecorded root gets, and accurate
  // either way.
  const rootRows = (rootsResult.response?.rows ?? []) as unknown as ConversationTraceRootRow[];
  const figureRows = (figuresResult.response?.rows ?? []) as unknown as ConversationTraceFigureRow[];

  if (rootRows.length >= TRACE_ROOTS_LIMIT) {
    errorObjLog(
      { traceCount: traceIds.length, limit: TRACE_ROOTS_LIMIT },
      'The trace roots read came back full and may be clipped: some traces will render as "entry call not recorded"',
    );
  }
  if (figureRows.length >= TRACE_FIGURES_LIMIT) {
    errorObjLog(
      { traceCount: traceIds.length, limit: TRACE_FIGURES_LIMIT },
      'The trace figures read came back full and may be clipped: some trace totals will be understated',
    );
  }

  // Reported, never resolved. A violation means the recorded data has a shape this design did not anticipate,
  // so it is logged as a fault to investigate while the listing still renders from what was read — rather
  // than silently picking one of the candidates, which is the failure mode the guards exist to prevent.
  for (const violation of traceInvariantViolations(rootRows, projectId)) {
    errorObjLog(violation, `Conversation trace invariant violated: ${violation.invariant}`);
  }

  return {
    success: true,
    response: {
      groups: traceGroupsOf(pageRows, rootRows, figureRows, projectId),
      hasMore,
    },
  };
}

// One hop's body row, read the way the retained payload requirement demands: filtered by session, trace and
// hop, and bounded by that hop's own instant — a single instant is a single partition, measured at 71-337 ms.
// Every tier below re-reads it rather than holding a parsed body between calls: server actions here are
// stateless and the app runs no server cache, and introducing one for a debugging panel is more new surface
// than a re-read of one partition costs.
interface HopBodyRead {
  row?: ConversationEntryBodyRow;
  state: HopReadState;
  fields: HopBodyFields;
}

const bodyFieldsFor = (side: HopInspectorSide, fields: HopBodyFields): UsageLogField[] => {
  if (side === HopInspectorSide.Request) {
    return [UsageLogField.RequestBody];
  }

  return fields.responseFields;
};

const isSideReadable = (side: HopInspectorSide, fields: HopBodyFields): boolean =>
  side === HopInspectorSide.Request ? fields.isRequestReadable : fields.isResponseReadable;

async function readHopBody(
  scope: SessionScope,
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
  sides: HopInspectorSide[],
): Promise<HopBodyRead> {
  const authToken = await token();
  const schema = await withEntitySchemaCache(USAGE_LOG_ENTITY, authToken, () =>
    analyticsDataApi.getEntitySchema(USAGE_LOG_ENTITY, authToken),
  );

  const fields = hopBodyFields(schema?.fields?.map(({ name }) => name) ?? []);

  if (!schema) {
    return { state: HopReadState.LoadFailed, fields };
  }

  const readable = sides.filter((side) => isSideReadable(side, fields));
  if (!readable.length) {
    return { state: HopReadState.ColumnWithheld, fields };
  }

  const bodyFields = [...new Set(readable.flatMap((side) => bodyFieldsFor(side, fields)))];
  const result = await analyticsDataApi.executeAction(
    buildConversationHopBodyQuery(scope, traceId, coreSpanId, requestTime, bodyFields),
    authToken,
  );

  if (!result.success) {
    errorObjLog(result, 'Failed to fetch the conversation hop bodies');
    return { state: HopReadState.LoadFailed, fields };
  }

  const row = (result.response?.rows ?? [])[0] as unknown as ConversationEntryBodyRow | undefined;

  return row ? { row, state: HopReadState.Available, fields } : { state: HopReadState.NoBody, fields };
}

const EMPTY_PARAMS: HopParams = { stated: [] };

const emptyRequestEnvelope = (state: HopReadState): HopRequestEnvelope => ({
  state,
  dialect: HopDialect.Unknown,
  params: EMPTY_PARAMS,
  messages: [],
  roleCounts: [],
  recordedBytes: null,
  isClamped: false,
});

// Tier 1. What crosses to the browser is an envelope — roles, positions, sizes, property names and sizes, and
// each text clamped — never a body. A dialect no parser claims resolves to `Unstructured`, which the panel
// answers with the raw view rather than with an empty result.
export async function getConversationHopRequest(
  scope: SessionScope,
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
): Promise<ServerActionResponse<HopRequestEnvelope>> {
  const { row, state } = await readHopBody(scope, traceId, coreSpanId, requestTime, [HopInspectorSide.Request]);

  if (!row) {
    return { success: state !== HopReadState.LoadFailed, response: emptyRequestEnvelope(state) };
  }

  const dialect = dialectOf(row.request_uri ?? null);
  const parsed = parseJson(row.request_body);
  const params = paramsOf(parsed);
  const recordedBytes = row.request_body === null ? null : textByteLength(row.request_body);

  if (dialect === HopDialect.Unknown) {
    return {
      success: true,
      response: { ...emptyRequestEnvelope(HopReadState.Unstructured), params, recordedBytes },
    };
  }

  const messages = messagesForDialect(dialect, parsed);

  if (!messages.length) {
    return {
      success: true,
      response: { ...emptyRequestEnvelope(HopReadState.NoBody), dialect, params, recordedBytes },
    };
  }

  return { success: true, response: buildRequestEnvelope({ dialect, params, messages, recordedBytes }) };
}

const emptyResponseEnvelope = (state: HopReadState): HopResponseEnvelope => ({
  state,
  text: null,
  textClamp: NO_CLAMP,
  reasoningText: null,
  finishReason: null,
  toolCalls: [],
  facts: NO_FACTS,
  recordedBytes: null,
});

export async function getConversationHopResponse(
  scope: SessionScope,
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
): Promise<ServerActionResponse<HopResponseEnvelope>> {
  const { row, state } = await readHopBody(scope, traceId, coreSpanId, requestTime, [HopInspectorSide.Response]);

  if (!row) {
    return { success: state !== HopReadState.LoadFailed, response: emptyResponseEnvelope(state) };
  }

  return { success: true, response: responseEnvelopeOf(row, dialectOf(row.request_uri ?? null)) };
}

// Tier 2. One message, in full — its text and the arguments of anything it called. A reader who opens five
// messages issues five reads of the same row; that is the deliberate trade against paying for the whole body
// on every hop selection. The dialect parsers already yield the unclamped message, so this needs no decoder of
// its own: it parses, picks the index the envelope numbered, and returns that message.
export async function getConversationHopMessage(
  scope: SessionScope,
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
  messageIndex: number,
): Promise<ServerActionResponse<HopMessageValue>> {
  const { row, state } = await readHopBody(scope, traceId, coreSpanId, requestTime, [HopInspectorSide.Request]);

  if (!row) {
    return { success: state !== HopReadState.LoadFailed, response: { state, text: null, toolCalls: [] } };
  }

  const messages = messagesForDialect(dialectOf(row.request_uri ?? null), parseJson(row.request_body));
  const message = messages[messageIndex];

  if (!message) {
    return { success: true, response: { state: HopReadState.NoBody, text: null, toolCalls: [] } };
  }

  return {
    success: true,
    response: { state: HopReadState.Available, text: message.text, toolCalls: message.toolCalls },
  };
}

// Tier 3. The body as recorded, clamped to a stated budget — never the unbounded value, which reaches 4 MiB.
export async function getConversationHopRawBody(
  scope: SessionScope,
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
  side: HopInspectorSide,
): Promise<ServerActionResponse<HopRawBody>> {
  const { row, state } = await readHopBody(scope, traceId, coreSpanId, requestTime, [side]);

  if (!row) {
    return {
      success: state !== HopReadState.LoadFailed,
      response: { state, text: null, clamp: NO_CLAMP },
    };
  }

  return {
    success: true,
    response: rawBodyOf(side === HopInspectorSide.Request ? row.request_body : row.response_body),
  };
}

export async function getConversationHopMcp(
  scope: SessionScope,
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
  method: string | null,
  toolName: string | null,
  toolset: string | null,
): Promise<ServerActionResponse<HopMcpFacts>> {
  const { row, state, fields } = await readHopBody(scope, traceId, coreSpanId, requestTime, [
    HopInspectorSide.Request,
    HopInspectorSide.Response,
  ]);

  if (!row) {
    return {
      success: state !== HopReadState.LoadFailed,
      response: {
        state,
        method,
        toolName,
        toolset,
        argumentsText: null,
        resultText: null,
        resultClamp: NO_CLAMP,
        argumentsState: state,
        resultState: state,
      },
    };
  }

  // Both sides are asked for and either may be denied: the read proceeds when *one* is granted, so the facts
  // are built with the grants rather than left to infer a denial from an absent column.
  return { success: true, response: mcpFactsOf({ row, method, toolName, toolset, grants: fields }) };
}

export async function getConversationHopEmbedding(
  scope: SessionScope,
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
): Promise<ServerActionResponse<HopEmbeddingFacts>> {
  const { row, state, fields } = await readHopBody(scope, traceId, coreSpanId, requestTime, [
    HopInspectorSide.Request,
    HopInspectorSide.Response,
  ]);

  if (!row) {
    return {
      success: state !== HopReadState.LoadFailed,
      response: {
        state,
        model: null,
        inputCount: null,
        dimensions: null,
        inputText: null,
        inputClamp: NO_CLAMP,
        isDimensionsWithheld: false,
      },
    };
  }

  return { success: true, response: embeddingFactsOf(row, fields) };
}

export async function getConversationSpans(traceId: string): Promise<ServerActionResponse<ConversationSpansPage>> {
  const authToken = await token();
  const query = buildConversationSpansQuery(traceId, CONVERSATION_SPAN_LIMIT);
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

/**
 * Which body columns this caller can read — a **schema** fact, resolved from the cached entity schema without
 * issuing any body query.
 */
export async function getHopBodyGrants(): Promise<ServerActionResponse<HopBodyGrants>> {
  const authToken = await token();
  const schema = await withEntitySchemaCache(USAGE_LOG_ENTITY, authToken, () =>
    analyticsDataApi.getEntitySchema(USAGE_LOG_ENTITY, authToken),
  );

  if (!schema) {
    return { success: false, response: { isRequestReadable: false, isResponseReadable: false } };
  }

  const { isRequestReadable, isResponseReadable } = hopBodyFields(schema.fields?.map(({ name }) => name) ?? []);

  return { success: true, response: { isRequestReadable, isResponseReadable } };
}
