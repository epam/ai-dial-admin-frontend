'use server';

import { cookies, headers } from 'next/headers';

import { analyticsDataApi, sessionsSourceApi } from '@/src/app/api/api';
import {
  SessionArrayFilter,
  SessionArrayValueSource,
  SessionColumnFilter,
  SessionDetailResult,
  SessionDetailRow,
  SessionFeedbackPage,
  SessionFeedbackRow,
  SessionFieldValue,
  SessionFieldValuesRequest,
  SessionFilterOperator,
  SessionFilters,
  SessionPageRequest,
  SessionPeriodSummary,
  SessionRatingTotalsField,
  SessionScalarFilter,
  SessionEntryBodyRow,
  SpanFieldRow,
  SessionSpansPage,
  SessionsField,
  SessionTotals,
  SessionTotalsField,
  HopDialect,
  HopEmbeddingFacts,
  HopInspectorSide,
  HopMcpFacts,
  HopProtocolFacts,
  HopParams,
  HopMessageValue,
  HopRawBody,
  HopReadState,
  HopRequestEnvelope,
  HopResponseEnvelope,
  HopBodyFields,
  SessionTracePage,
  SessionTracePageRow,
  HopBodyGrants,
  SessionTraceFigureRow,
  SessionTraceRootRow,
  SessionsPage,
  FeedbackFilter,
  ResponseRatingsField,
  SessionScope,
  UsageLogField,
} from '@/src/models/analytics/sessions-trace';
import { Token } from '@/src/models/auth';
import { ReadFailure, ServerActionResponse } from '@/src/models/server-action';
import { toReadFailure } from '@/src/utils/notification';
import { TimeRange } from '@/src/models/time-range';
import { ApplicationRoute } from '@/src/types/routes';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { errorObjLog } from '@/src/server/logger';
import { ratedSessionRow } from '@/src/utils/analytics/session-rows';
import {
  buildArrayValueResolutionQuery,
  buildSessionDetailQuery,
  buildSessionFieldValuesQuery,
  buildSessionRatedResponsesQuery,
  buildSessionHopBodyQuery,
  buildSessionListQuery,
  buildSessionSpansQuery,
  buildSessionTraceFiguresQuery,
  buildSessionTracePageQuery,
  buildSessionTraceRootsQuery,
  buildSessionRatingTotalsQuery,
  buildSessionTotalsQuery,
  needsValueResolution,
} from '@/src/utils/analytics/sessions-queries';
import {
  ARRAY_VALUE_PAGE_CAP,
  ARRAY_VALUE_PAGE_SIZE,
  SESSION_ARRAY_VALUE_SOURCE,
  SESSION_FEEDBACK_LIMIT,
  SESSION_FIELD_VALUE_COUNT_ALIAS,
  SESSION_SPAN_LIMIT,
  SESSION_TRACE_PAGE_SIZE,
  SESSION_TRACE_ROOT_CAP,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/sessions-trace';
import { AnalyticsEntitySchema } from '@/src/models/analytics/entity';
import { EntityCallRow, EntityTraceCursor, EntityTracePage } from '@/src/models/analytics/entity-traces';
import { withEntitySchemaCache } from '@/src/server/analytics/entity-schema-cache';
import { toNumber } from '@/src/utils/analytics/scalar';
import { paddedUtcDayRange } from '@/src/utils/analytics/session-formatting';
import { traceGroupsOf, traceInvariantViolations } from '@/src/utils/analytics/session-trace-groups';
import { entityTraceCursorOf, entityTraceGroupsOf } from '@/src/utils/analytics/entity-trace-groups';
import { buildEntityCallPageQuery, entityCallClauses } from '@/src/utils/analytics/entity-trace-queries';
import { hopBodyFields, spanFields } from '@/src/utils/analytics/session-column-catalog';
import { unqualified } from '@/src/utils/analytics/session-enrichment';
import { dialectOf, messagesForDialect } from '@/src/utils/analytics/hop-inspector/dialect';
import { embeddingFactsOf } from '@/src/utils/analytics/hop-inspector/embedding';
import {
  buildRequestEnvelope,
  isRebuildPartial,
  NO_CLAMP,
  parseJson,
  textByteLength,
} from '@/src/utils/analytics/hop-inspector/envelope';
import { mcpFactsOf } from '@/src/utils/analytics/hop-inspector/mcp';
import { protocolFactsOf } from '@/src/utils/analytics/hop-inspector/protocol';
import { paramsOf } from '@/src/utils/analytics/hop-inspector/params';
import { NO_FACTS, responseEnvelopeOf, rawBodyOf } from '@/src/utils/analytics/hop-inspector/response';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { DEFAULT_SESSIONS_SOURCE_SETTING } from '@/src/constants/analytics/sessions-source';
import {
  SessionsSource,
  SessionsSourceResolution,
  SessionsSourceSetting,
} from '@/src/models/analytics/sessions-source';
import { ratingEnrichmentOf, resolveSessionsSource, sourceFieldOf } from '@/src/utils/analytics/sessions-source';

const token = () => getUserToken(getIsEnableAuthToggle(), headers(), cookies());

type SessionsResponse = ServerActionResponse<SessionsPage>;

const toRange = ({ startMs, endMs }: SessionFilters): TimeRange => ({
  startDate: new Date(startMs),
  endDate: new Date(endMs),
});

interface CallerSource {
  resolution: SessionsSourceResolution;
  schema: ServerActionResponse<AnalyticsEntitySchema>;
}

const readBaseSchema = async (
  baseTable: string,
  authToken: Token,
): Promise<ServerActionResponse<AnalyticsEntitySchema>> => {
  try {
    return await withEntitySchemaCache(baseTable, authToken, () =>
      analyticsDataApi.getEntitySchema(baseTable, authToken),
    );
  } catch (error) {
    errorObjLog(error, 'Failed to fetch the sessions entity schema');
    return { success: false };
  }
};

const readSetting = async (): Promise<ServerActionResponse<SessionsSourceSetting>> => {
  try {
    return await sessionsSourceApi.getSetting();
  } catch (error) {
    errorObjLog(error, 'Failed to read the Sessions source setting; using the default binding');
    return { success: false };
  }
};

async function callerSource(authToken: Token): Promise<CallerSource> {
  const setting = await readSetting();
  const schema = await readBaseSchema(
    setting.response?.baseTable ?? DEFAULT_SESSIONS_SOURCE_SETTING.baseTable,
    authToken,
  );

  return { resolution: resolveSessionsSource(setting.response, schema.response?.fields), schema };
}

const sourceFailure = <T extends object>(resolution: SessionsSourceResolution): ServerActionResponse<T> => ({
  success: false,
  ...(resolution.failure ? { errorMessage: `${resolution.failure.role}: ${resolution.failure.field}` } : {}),
});

const arrayValueSource = (fieldName: string): SessionArrayValueSource | undefined =>
  SESSION_ARRAY_VALUE_SOURCE[fieldName as SessionsField];

/**
 * Every value the entered text matches, paged to exhaustion — a truncated set would narrow the listing to
 * fewer sessions than match, with an active filter in the header and nothing saying so, and no single
 * query can hold it (see `ARRAY_VALUE_PAGE_SIZE`).
 *
 * `undefined` on a failed read, never a partial set: half the values would narrow the result to a subset of
 * the matches, which is the outcome the paging exists to avoid.
 */
async function resolveArrayValues(
  source: SessionArrayValueSource,
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
  filter: SessionScalarFilter,
  source: SessionArrayValueSource,
  range: TimeRange,
  authToken: Token,
): Promise<SessionArrayFilter | undefined> {
  const carried = {
    field: filter.field,
    operator: filter.operator,
    ...(filter.valueType ? { valueType: filter.valueType } : {}),
  };

  if (!needsValueResolution(filter.operator)) {
    return { ...carried, values: [filter.value] };
  }

  const values = await resolveArrayValues(source, range, filter.value, authToken);

  // An empty result is an answer, not a failure: no value matched the text, so no session does. The
  // query builder states that as a predicate rather than dropping the filter.
  return values ? { ...carried, values } : undefined;
}

interface ResolvedColumnFilters {
  columnFilters: SessionColumnFilter[];
  arrayFilters: SessionArrayFilter[];
}

/**
 * Splits the grid's column filters into the ones the listing query can predicate on directly and the ones
 * over an array-valued column, whose text is resolved to whole values here.
 *
 * Returns `undefined` when a resolution query failed. Dropping the filter instead would widen the result
 * past what the column header states — the operator would read sessions their filter excludes as
 * matches — so the caller fails rather than answering a different question.
 *
 * A value-set (`in`) filter is never an array filter: the value picker binds only to a field the schema
 * types `enum`, and an array-typed field is never derived into a column at all.
 *
 * `resolved` carries the sets a previous call worked out, so a later page of one result reuses them instead
 * of resolving again — it only ever narrows the caller's own query.
 */
async function resolveColumnFilters(
  columnFilters: SessionColumnFilter[],
  range: TimeRange,
  authToken: Token,
  resolved?: SessionArrayFilter[],
): Promise<ResolvedColumnFilters | undefined> {
  const scalar: SessionColumnFilter[] = [];
  const arrays: SessionArrayFilter[] = [];

  for (const filter of columnFilters) {
    if (filter.operator === SessionFilterOperator.In) {
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

export async function getSessionsSchema(): Promise<ServerActionResponse<AnalyticsEntitySchema>> {
  const { schema } = await callerSource(await token());
  return schema;
}

export async function getSessionsSource(): Promise<SessionsSourceResolution> {
  const { resolution } = await callerSource(await token());
  return resolution;
}

export async function getSessions(request: SessionPageRequest): Promise<SessionsResponse> {
  const authToken = await token();
  const { resolution } = await callerSource(authToken);
  const source = resolution.source;

  if (!source) {
    return sourceFailure(resolution);
  }

  const range = toRange(request);
  const isFirstPage = request.offset === 0;
  const feedback = source.ratingEnrichment ? request.feedback : FeedbackFilter.All;
  const periodSummary = isFirstPage ? resolvePeriodSummary(range, source, authToken) : Promise.resolve(undefined);

  const resolvedFilters = await resolveColumnFilters(
    request.columnFilters ?? [],
    range,
    authToken,
    request.arrayFilters,
  );

  if (!resolvedFilters) {
    return {
      success: false,
      response: { rows: [], total: null, ...withPeriod(await periodSummary) },
    };
  }

  const query = buildSessionListQuery({
    range,
    source,
    search: request.search,
    feedback,
    columnFilters: resolvedFilters.columnFilters,
    arrayFilters: resolvedFilters.arrayFilters,
    sort: request.sort ?? [],
    sourceFields: request.sourceFields ?? [],
    visibleEnrichmentFields: request.visibleEnrichmentFields ?? [],
    offset: request.offset,
    limit: request.limit,
  });

  const [result, period] = await Promise.all([analyticsDataApi.executeAction(query, authToken), periodSummary]);

  // The grid's row total is the period count, which is the grid's own count only while nothing narrows the
  // period. Under a filter it is not, and must not be offered as one: the grid then finds the end of the
  // result by a page coming back short, which is the signal it already terminates on.
  const gridTotal = isNarrowed({ ...request, feedback }) ? null : toNumber(period?.totals?.sessions ?? null);

  const resolved = {
    total: gridTotal,
    ...withPeriod(period),
    ...(isFirstPage && resolvedFilters.arrayFilters.length ? { arrayFilters: resolvedFilters.arrayFilters } : {}),
  };

  if (!result.success) {
    return { ...result, response: { rows: [], ...resolved } };
  }

  const rows = ((result.response?.rows ?? []) as Record<string, unknown>[]).map((raw) => ratedSessionRow(source, raw));

  return { ...result, response: { rows, ...resolved } };
}

/**
 * The values a column holds, for the filter that lists them for selection.
 *
 * Faceted against the page's other narrowing — see `buildSessionFieldValuesQuery` for which predicates
 * carry and why the opened column's own does not.
 */
export async function getSessionFieldValues(
  request: SessionFieldValuesRequest,
): Promise<ServerActionResponse<SessionFieldValue[]>> {
  const authToken = await token();
  const range = toRange(request);
  const { resolution } = await callerSource(authToken);
  const source = resolution.source;

  if (!source) {
    return sourceFailure(resolution);
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
    buildSessionFieldValuesQuery({
      field: request.field,
      range,
      source,
      search: request.search,
      feedback: source.ratingEnrichment ? request.feedback : FeedbackFilter.All,
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
  // reached that session, which is a statement about coverage rather than something to select. The
  // grouped count reports it as a group all the same, so it is dropped here.
  const boundField = sourceFieldOf(source, request.field) ?? request.field;
  const values = (result.response?.rows ?? []).reduce<SessionFieldValue[]>((list, row) => {
    const name = row[boundField];
    if (typeof name === 'string' && name.length > 0) {
      list.push({
        value: name,
        count: toNumber((row[SESSION_FIELD_VALUE_COUNT_ALIAS] ?? null) as number | string | null),
      });
    }
    return list;
  }, []);

  return { success: true, response: values };
}

export async function getSessionDetail(chatId: string): Promise<ServerActionResponse<SessionDetailResult>> {
  const authToken = await token();
  const { resolution, schema } = await callerSource(authToken);
  const source = resolution.source;

  if (!source) {
    return sourceFailure(resolution);
  }

  const result = await analyticsDataApi.executeAction(
    buildSessionDetailQuery(chatId, schema.response?.fields, source),
    authToken,
  );

  if (!result.success) {
    return { ...result, response: undefined };
  }

  const raw = result.response?.rows?.[0] as Record<string, unknown> | undefined;
  const session = raw ? (ratedSessionRow(source, raw) as unknown as SessionDetailRow) : null;

  return { ...result, response: { session } };
}

const usageLogSchema = async (authToken: Token): Promise<ServerActionResponse<AnalyticsEntitySchema>> => {
  try {
    return await withEntitySchemaCache(USAGE_LOG_ENTITY, authToken, () =>
      analyticsDataApi.getEntitySchema(USAGE_LOG_ENTITY, authToken),
    );
  } catch (error) {
    errorObjLog(error, 'Failed to fetch the usage log schema');
    return { success: false };
  }
};

export async function getSessionFeedback(
  scope: SessionScope,
  firstRequestTime: number | string | null,
  lastRequestTime: number | string | null,
): Promise<ServerActionResponse<SessionFeedbackPage>> {
  const authToken = await token();
  const schema = await usageLogSchema(authToken);
  const fields = schema.response?.fields ?? [];
  const namespace = ratingEnrichmentOf(fields);
  const window = paddedUtcDayRange([firstRequestTime, lastRequestTime]);
  const isCommentTextReadable = Boolean(
    namespace && fields.some(({ name }) => name === `${namespace}.${ResponseRatingsField.CommentSample}`),
  );
  const empty: SessionFeedbackPage = { rows: [], total: 0, isCommentTextReadable, isAvailable: Boolean(namespace) };

  if (!namespace || !window) {
    return { success: true, response: empty };
  }

  const hasClientSessionId = fields.some(({ name }) => name === UsageLogField.ClientSessionId);
  const result = await analyticsDataApi.executeAction(
    buildSessionRatedResponsesQuery({
      scope,
      window,
      namespace,
      limit: SESSION_FEEDBACK_LIMIT,
      isCommentTextReadable,
      hasClientSessionId,
    }),
    authToken,
  );

  if (!result.success) {
    return { ...result, response: undefined };
  }

  const rows = (result.response?.rows ?? []) as unknown as SessionFeedbackRow[];

  return {
    ...result,
    response: {
      rows,
      total: rows.length < SESSION_FEEDBACK_LIMIT ? rows.length : null,
      isCommentTextReadable,
      isAvailable: true,
    },
  };
}

// A page's roots and figures are read for at most this many rows. Both bounds assume rows spread evenly
// across the page's traces, and neither is guaranteed: dev data holds traces with over a hundred roots, and a
// new event kind widens the figures read. So the bound alone is not the safeguard — a read that comes back
// exactly full is treated as clipped and reported, because a silently clipped roots read renders traces as
// "entry call not recorded" and a silently clipped figures read produces wrong totals.
const TRACE_ROOTS_LIMIT = SESSION_TRACE_PAGE_SIZE * SESSION_TRACE_ROOT_CAP;
const TRACE_FIGURES_LIMIT = SESSION_TRACE_PAGE_SIZE * 8;

// An unreadable schema answers yes: the reads that follow then fail and say why, where no would narrow them.
async function isUsageLogFieldServed(name: string, authToken: Token): Promise<boolean> {
  try {
    const read = await withEntitySchemaCache(USAGE_LOG_ENTITY, authToken, () =>
      analyticsDataApi.getEntitySchema(USAGE_LOG_ENTITY, authToken),
    );
    return read.response ? Boolean(read.response.fields?.some((schemaField) => schemaField.name === name)) : true;
  } catch (error) {
    errorObjLog(error, 'Failed to fetch the usage log schema');
    return true;
  }
}

/**
 * One page of the session's trace listing, resolved live over the hop log in three passes.
 *
 * The first pass pages the traces and yields nothing but their ids and their own time bounds. The other two
 * are then issued concurrently against **the page's** window rather than the session's: a page spans
 * minutes, so the read stays within a handful of daily partitions however long the session ran.
 *
 * The window is padded past whole UTC days at both ends. The bounds come from rows a chat-id-scoped read can
 * see, and they have to cover rows it cannot — a root recorded before its first child, and a Core-internal
 * root recorded after its parent's last child.
 */
export async function getSessionTracePage(
  scope: SessionScope,
  projectId: string | null,
  firstRequestTime: number | string | null,
  lastRequestTime: number | string | null,
  offset: number,
): Promise<ServerActionResponse<SessionTracePage>> {
  const authToken = await token();
  const sessionWindow = paddedUtcDayRange([firstRequestTime, lastRequestTime]);

  if (!sessionWindow) {
    return { success: true, response: { groups: [], hasMore: false } };
  }

  const hasClientSessionId = await isUsageLogFieldServed(UsageLogField.ClientSessionId, authToken);
  const pageResult = await analyticsDataApi.executeAction(
    buildSessionTracePageQuery(scope, projectId, sessionWindow, offset, SESSION_TRACE_PAGE_SIZE, hasClientSessionId),
    authToken,
  );

  if (!pageResult.success) {
    errorObjLog(pageResult, 'Failed to fetch the session trace page');
    return { ...pageResult, response: undefined };
  }

  const pageRows = (pageResult.response?.rows ?? []) as unknown as SessionTracePageRow[];
  if (!pageRows.length) {
    return { success: true, response: { groups: [], hasMore: false } };
  }

  // Aggregate mode never populates a total, so a full page is the only evidence that another may exist.
  const hasMore = pageRows.length === SESSION_TRACE_PAGE_SIZE;
  const traceIds = pageRows.map(({ trace_id }) => trace_id);
  const pageWindow = paddedUtcDayRange(
    pageRows.flatMap(({ first_request_time, last_request_time }) => [first_request_time, last_request_time]),
  );

  if (!pageWindow) {
    return { success: true, response: { groups: [], hasMore } };
  }

  const [rootsResult, figuresResult] = await Promise.all([
    analyticsDataApi.executeAction(
      buildSessionTraceRootsQuery(traceIds, pageWindow, TRACE_ROOTS_LIMIT, hasClientSessionId),
      authToken,
    ),
    analyticsDataApi.executeAction(buildSessionTraceFiguresQuery(traceIds, pageWindow, TRACE_FIGURES_LIMIT), authToken),
  ]);

  if (!rootsResult.success) {
    errorObjLog(rootsResult, 'Failed to fetch the session trace root spans');
  }

  // A failed *figures* read is not survivable: the figures are the trace-level totals, so rendering without
  // them states 0 spans, 0 tokens and no cost as though they were the trace's facts. That is the
  // silently-wrong-figure outcome this design removes, so the page fails instead of degrading.
  if (!figuresResult.success) {
    errorObjLog(figuresResult, 'Failed to fetch the session trace figures');
    return { ...figuresResult, response: undefined };
  }

  // A failed *roots* read costs the cards, not the page: a trace still renders from its figures, stating that
  // its entry call was not recorded — the same presentation a genuinely unrecorded root gets, and accurate
  // either way.
  const rootRows = (rootsResult.response?.rows ?? []) as unknown as SessionTraceRootRow[];
  const figureRows = (figuresResult.response?.rows ?? []) as unknown as SessionTraceFigureRow[];

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
  for (const violation of traceInvariantViolations(rootRows, projectId ?? '')) {
    errorObjLog(violation, `Session trace invariant violated: ${violation.invariant}`);
  }

  return {
    success: true,
    response: {
      groups: traceGroupsOf(pageRows, rootRows, figureRows, projectId ?? ''),
      hasMore,
    },
  };
}

const ENTITY_TRACE_PAGE_SIZE = 50;
const ENTITY_TRACE_FIGURES_LIMIT = ENTITY_TRACE_PAGE_SIZE * 8;

/**
 * One page of calls to an entity, newest first, with the figures of the traces they belong to.
 *
 * Two reads, where the session listing needs three: the page rows are the calls themselves, so they already
 * carry every card fact, and only the traces' own figures remain. Those are read by trace id over the page's
 * own window, padded past whole UTC days — a trace's other spans straddle the entity's call by up to tens of
 * seconds, more for a long call, and a figure computed without them would understate the trace.
 */
export async function getEntityTracePage(
  route: ApplicationRoute,
  entityName: string | null,
  fromMs: number,
  toMs: number,
  cursor: EntityTraceCursor | null,
): Promise<ServerActionResponse<EntityTracePage>> {
  const clauses = entityCallClauses(route, entityName);

  if (!clauses) {
    return { success: true, response: { groups: [], hasMore: false, cursor: null } };
  }

  const authToken = await token();
  const pageResult = await analyticsDataApi.executeAction(
    buildEntityCallPageQuery(clauses, { fromMs, toMs }, ENTITY_TRACE_PAGE_SIZE, cursor),
    authToken,
  );

  if (!pageResult.success) {
    errorObjLog(pageResult, 'Failed to fetch the entity call page');
    return { ...pageResult, response: undefined };
  }

  const callRows = (pageResult.response?.rows ?? []) as unknown as EntityCallRow[];
  const hasMore = callRows.length === ENTITY_TRACE_PAGE_SIZE;
  const nextCursor = entityTraceCursorOf(callRows);
  const pageWindow = paddedUtcDayRange(callRows.map(({ request_time }) => request_time));

  if (!callRows.length || !pageWindow) {
    return { success: true, response: { groups: [], hasMore: false, cursor: null } };
  }

  const traceIds = [...new Set(callRows.map(({ trace_id }) => trace_id))];
  const figuresResult = await analyticsDataApi.executeAction(
    buildSessionTraceFiguresQuery(traceIds, pageWindow, ENTITY_TRACE_FIGURES_LIMIT),
    authToken,
  );

  // As on the session listing: without its figures a trace would state 0 spans and no cost as its facts.
  if (!figuresResult.success) {
    errorObjLog(figuresResult, 'Failed to fetch the entity trace figures');
    return { ...figuresResult, response: undefined };
  }

  const figureRows = (figuresResult.response?.rows ?? []) as unknown as SessionTraceFigureRow[];

  if (figureRows.length >= ENTITY_TRACE_FIGURES_LIMIT) {
    errorObjLog(
      { traceCount: traceIds.length, limit: ENTITY_TRACE_FIGURES_LIMIT },
      'The entity trace figures read came back full and may be clipped: some trace totals will be understated',
    );
  }

  return {
    success: true,
    response: { groups: entityTraceGroupsOf(callRows, figureRows), hasMore, cursor: nextCursor },
  };
}

// One hop's body row, read the way the retained payload requirement demands: filtered by session, trace and
// hop, and bounded by that hop's own instant — a single instant is a single partition, measured at 71-337 ms.
// Every tier below re-reads it rather than holding a parsed body between calls: server actions here are
// stateless and the app runs no server cache, and introducing one for a debugging panel is more new surface
// than a re-read of one partition costs.
interface HopBodyRead {
  row?: SessionEntryBodyRow;
  state: HopReadState;
  fields: HopBodyFields;
  // Present only for `LoadFailed`.
  failure?: ReadFailure;
}

// The body columns live in an enrichment, so the service reports them qualified by it — `<enrichment>.<column>`
// — while this row is keyed by the column itself. Stripping the namespace once, here, is what keeps the move
// out of every reader below: a projection alias is not honoured on a row read, so the qualified key arrives
// whatever the query asked for, and a row keyed by it reads as a hop that recorded nothing.
const bodyRowOf = (raw: Record<string, unknown>): SessionEntryBodyRow => {
  const { [UsageLogField.RequestBodyFull]: rebuilt, ...row } = Object.fromEntries(
    Object.entries(raw).map(([key, cell]) => [unqualified(key), cell]),
  );

  return (rebuilt === undefined
    ? row
    : { ...row, [UsageLogField.RequestBody]: rebuilt }) as unknown as SessionEntryBodyRow;
};

// The names the grant resolved against this instance's schema, not the constants: the read has to select a
// column under the name the service answered with.
const bodyFieldsFor = (side: HopInspectorSide, fields: HopBodyFields): string[] => {
  if (side === HopInspectorSide.Request) {
    return [fields.requestField, fields.requestStatusField].filter((name): name is string => name !== null);
  }

  return fields.responseFields;
};

const isSideReadable = (side: HopInspectorSide, fields: HopBodyFields): boolean =>
  side === HopInspectorSide.Request ? fields.isRequestReadable : fields.isResponseReadable;

// Takes no session — see `buildSessionHopBodyQuery` for why a session predicate here left a Core-internal
// hop reporting that it had recorded nothing. Neither do the actions that call it: a hop is located by its
// trace and its span alone, so the same read serves a trace opened from a session and from an entity.
async function readHopBody(
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
  sides: HopInspectorSide[],
): Promise<HopBodyRead> {
  const authToken = await token();
  const schemaRead = await withEntitySchemaCache(USAGE_LOG_ENTITY, authToken, () =>
    analyticsDataApi.getEntitySchema(USAGE_LOG_ENTITY, authToken),
  );

  const fields = hopBodyFields(schemaRead.response?.fields?.map(({ name }) => name) ?? []);

  if (!schemaRead.response) {
    return { state: HopReadState.LoadFailed, fields, failure: toReadFailure(schemaRead) };
  }

  const readable = sides.filter((side) => isSideReadable(side, fields));
  if (!readable.length) {
    return { state: HopReadState.ColumnWithheld, fields };
  }

  const bodyFields = [...new Set(readable.flatMap((side) => bodyFieldsFor(side, fields)))];
  const result = await analyticsDataApi.executeAction(
    buildSessionHopBodyQuery(traceId, coreSpanId, requestTime, bodyFields),
    authToken,
  );

  if (!result.success) {
    errorObjLog(result, 'Failed to fetch the session hop bodies');
    return { state: HopReadState.LoadFailed, fields, failure: toReadFailure(result) };
  }

  const [raw] = result.response?.rows ?? [];

  return raw
    ? { row: bodyRowOf(raw as Record<string, unknown>), state: HopReadState.Available, fields }
    : { state: HopReadState.NoBody, fields };
}

// Only `LoadFailed` is a failure this console suffered; every other state is the record speaking.
const hopReadEnvelope = <T extends object>({ state, failure }: HopBodyRead, response: T): ServerActionResponse<T> =>
  state === HopReadState.LoadFailed ? { success: false, ...failure, response } : { success: true, response };

const EMPTY_PARAMS: HopParams = { stated: [], rest: [] };

const emptyRequestEnvelope = (state: HopReadState): HopRequestEnvelope => ({
  state,
  dialect: HopDialect.Unknown,
  params: EMPTY_PARAMS,
  messages: [],
  roleCounts: [],
  recordedBytes: null,
  isClamped: false,
  isPartial: false,
});

// Tier 1. What crosses to the browser is an envelope — roles, positions, sizes, property names and sizes, and
// each text clamped — never a body. A dialect no parser claims resolves to `Unstructured`, which the panel
// answers with the raw view rather than with an empty result.
export async function getSessionHopRequest(
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
): Promise<ServerActionResponse<HopRequestEnvelope>> {
  const read = await readHopBody(traceId, coreSpanId, requestTime, [HopInspectorSide.Request]);
  const { row, state } = read;

  if (!row) {
    return hopReadEnvelope(read, emptyRequestEnvelope(state));
  }

  const dialect = dialectOf(row.request_uri ?? null);
  const isPartial = isRebuildPartial(row.request_body_rebuild);
  const parsed = parseJson(row.request_body);
  const params = paramsOf(parsed);
  const recordedBytes = row.request_body === null ? null : textByteLength(row.request_body);

  if (dialect === HopDialect.Unknown) {
    return {
      success: true,
      response: { ...emptyRequestEnvelope(HopReadState.Unstructured), params, recordedBytes, isPartial },
    };
  }

  const messages = messagesForDialect(dialect, parsed);

  if (!messages.length) {
    return {
      success: true,
      response: { ...emptyRequestEnvelope(HopReadState.NoBody), dialect, params, recordedBytes, isPartial },
    };
  }

  return { success: true, response: buildRequestEnvelope({ dialect, params, messages, recordedBytes, isPartial }) };
}

const emptyResponseEnvelope = (state: HopReadState): HopResponseEnvelope => ({
  state,
  text: null,
  textClamp: NO_CLAMP,
  reasoningText: null,
  finishReason: null,
  toolCalls: [],
  errorText: null,
  facts: NO_FACTS,
  recordedBytes: null,
});

export async function getSessionHopResponse(
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
): Promise<ServerActionResponse<HopResponseEnvelope>> {
  const read = await readHopBody(traceId, coreSpanId, requestTime, [HopInspectorSide.Response]);
  const { row, state } = read;

  if (!row) {
    return hopReadEnvelope(read, emptyResponseEnvelope(state));
  }

  return { success: true, response: responseEnvelopeOf(row, dialectOf(row.request_uri ?? null)) };
}

// Tier 2. One message, in full — its text and the arguments of anything it called. A reader who opens five
// messages issues five reads of the same row; that is the deliberate trade against paying for the whole body
// on every hop selection. The dialect parsers already yield the unclamped message, so this needs no decoder of
// its own: it parses, picks the index the envelope numbered, and returns that message.
export async function getSessionHopMessage(
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
  messageIndex: number,
): Promise<ServerActionResponse<HopMessageValue>> {
  const read = await readHopBody(traceId, coreSpanId, requestTime, [HopInspectorSide.Request]);
  const { row, state } = read;

  if (!row) {
    return hopReadEnvelope(read, { state, text: null, toolCalls: [] });
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
export async function getSessionHopRawBody(
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
  side: HopInspectorSide,
): Promise<ServerActionResponse<HopRawBody>> {
  const read = await readHopBody(traceId, coreSpanId, requestTime, [side]);
  const { row, state } = read;

  if (!row) {
    return hopReadEnvelope(read, { state, text: null, clamp: NO_CLAMP, isPartial: false });
  }

  return {
    success: true,
    response:
      side === HopInspectorSide.Request
        ? rawBodyOf(row.request_body, isRebuildPartial(row.request_body_rebuild))
        : rawBodyOf(row.response_body),
  };
}

export async function getSessionHopMcp(
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
  method: string | null,
  toolName: string | null,
  toolset: string | null,
): Promise<ServerActionResponse<HopMcpFacts>> {
  const read = await readHopBody(traceId, coreSpanId, requestTime, [
    HopInspectorSide.Request,
    HopInspectorSide.Response,
  ]);
  const { row, state, fields } = read;

  if (!row) {
    return hopReadEnvelope(read, {
      state,
      method,
      toolName,
      toolset,
      argumentsText: null,
      resultText: null,
      resultClamp: NO_CLAMP,
      argumentsState: state,
      resultState: state,
    });
  }

  // Both sides are asked for and either may be denied: the read proceeds when *one* is granted, so the facts
  // are built with the grants rather than left to infer a denial from an absent column.
  return { success: true, response: mcpFactsOf({ row, method, toolName, toolset, grants: fields }) };
}

export async function getSessionHopProtocol(
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
  method: string | null,
): Promise<ServerActionResponse<HopProtocolFacts>> {
  const read = await readHopBody(traceId, coreSpanId, requestTime, [
    HopInspectorSide.Request,
    HopInspectorSide.Response,
  ]);
  const { row, state, fields } = read;

  if (!row) {
    return hopReadEnvelope(read, {
      state,
      method,
      requestText: null,
      requestState: state,
      resultText: null,
      resultClamp: NO_CLAMP,
      responseState: state,
    });
  }

  return { success: true, response: protocolFactsOf({ row, method, grants: fields }) };
}

export async function getSessionHopEmbedding(
  traceId: string,
  coreSpanId: string,
  requestTime: number | string | null,
): Promise<ServerActionResponse<HopEmbeddingFacts>> {
  const read = await readHopBody(traceId, coreSpanId, requestTime, [
    HopInspectorSide.Request,
    HopInspectorSide.Response,
  ]);
  const { row, state, fields } = read;

  if (!row) {
    return hopReadEnvelope(read, {
      state,
      model: null,
      inputCount: null,
      dimensions: null,
      inputText: null,
      inputClamp: NO_CLAMP,
      isDimensionsWithheld: false,
    });
  }

  return { success: true, response: embeddingFactsOf(row, fields) };
}

export async function getSessionSpans(traceId: string): Promise<ServerActionResponse<SessionSpansPage>> {
  const authToken = await token();
  // A failed schema read is logged and then survivable: the projection falls back to the columns the tree is
  // built from, so the reader still gets the hop chain without the field groups.
  const schemaRead = await withEntitySchemaCache(USAGE_LOG_ENTITY, authToken, () =>
    analyticsDataApi.getEntitySchema(USAGE_LOG_ENTITY, authToken),
  );

  if (!schemaRead.response) {
    errorObjLog(schemaRead, 'Failed to fetch the hop log schema for the span field set');
  }

  const { names, groups } = spanFields(schemaRead.response?.fields ?? []);
  const query = buildSessionSpansQuery(traceId, SESSION_SPAN_LIMIT, names);
  const result = await analyticsDataApi.executeAction(query, authToken);

  if (!result.success) {
    return { ...result, response: undefined };
  }

  const spans = (result.response?.rows ?? []) as unknown as SpanFieldRow[];

  return {
    ...result,
    response: {
      spans,
      total: result.response?.totalCount ?? null,
      fieldGroups: groups,
    },
  };
}

const isNarrowed = ({ search, columnFilters, feedback }: SessionPageRequest): boolean =>
  Boolean(search) || Boolean(columnFilters?.length) || feedback !== FeedbackFilter.All;

const withPeriod = (period?: SessionPeriodSummary) => (period ? { period } : {});

async function resolveSessionTotals(
  range: TimeRange,
  source: SessionsSource,
  authToken: Token,
): Promise<SessionTotals | undefined> {
  const result = await analyticsDataApi.executeAction(buildSessionTotalsQuery(range, source), authToken);

  if (!result.success) {
    errorObjLog(result, 'Failed to resolve the sessions summary');
    return undefined;
  }

  const row = result.response?.rows?.[0];

  return {
    sessions: (row?.[SessionTotalsField.Sessions] ?? null) as SessionTotals['sessions'],
    cost: (row?.[SessionTotalsField.Cost] ?? null) as SessionTotals['cost'],
  };
}

async function resolveRatingCount(
  range: TimeRange,
  feedback: FeedbackFilter,
  source: SessionsSource,
  authToken: Token,
): Promise<number | null | undefined> {
  const result = await analyticsDataApi.executeAction(
    buildSessionRatingTotalsQuery({ range, feedback, source }),
    authToken,
  );

  if (!result.success) {
    errorObjLog(result, 'Failed to resolve the session rating totals');
    return undefined;
  }

  const row = result.response?.rows?.[0];

  return toNumber((row?.[SessionRatingTotalsField.Sessions] ?? null) as number | string | null);
}

async function resolvePeriodSummary(
  range: TimeRange,
  source: SessionsSource,
  authToken: Token,
): Promise<SessionPeriodSummary> {
  const [totals, rated, negative] = await Promise.all([
    resolveSessionTotals(range, source, authToken),
    source.ratingEnrichment ? resolveRatingCount(range, FeedbackFilter.Rated, source, authToken) : undefined,
    source.ratingEnrichment ? resolveRatingCount(range, FeedbackFilter.Negative, source, authToken) : undefined,
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
  const schemaRead = await withEntitySchemaCache(USAGE_LOG_ENTITY, authToken, () =>
    analyticsDataApi.getEntitySchema(USAGE_LOG_ENTITY, authToken),
  );

  if (!schemaRead.response) {
    return { ...schemaRead, success: false, response: { isRequestReadable: false, isResponseReadable: false } };
  }

  const { isRequestReadable, isResponseReadable } = hopBodyFields(
    schemaRead.response.fields?.map(({ name }) => name) ?? [],
  );

  return { success: true, response: { isRequestReadable, isResponseReadable } };
}

export async function getEnrichmentTagOrders(namespaces: string[]): Promise<Record<string, string[]>> {
  const authToken = await token();
  const reads = await Promise.all(
    namespaces.map(async (namespace) => {
      try {
        const read = await analyticsDataApi.getTable(namespace, authToken);
        return [namespace, read.response?.tag_order ?? []] as const;
      } catch (error) {
        errorObjLog(error, `Failed to read the ${namespace} table definition`);
        return [namespace, []] as const;
      }
    }),
  );

  return Object.fromEntries(reads);
}
