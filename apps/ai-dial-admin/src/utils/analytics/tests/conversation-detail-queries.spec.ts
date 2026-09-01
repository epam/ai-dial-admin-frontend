import { describe, expect, test } from 'vitest';

import {
  CHAT_ID_SESSION_SOURCE,
  CONVERSATIONS_ENTITY,
  CONVERSATION_FEEDBACK_LIMIT,
  CONVERSATION_SPAN_LIMIT,
  CONVERSATION_TRACE_PAGE_SIZE,
  FEEDBACK_ENTITY,
  OPTIONAL_DETAIL_SELECT_FIELDS,
  REQUIRED_DETAIL_SELECT_FIELDS,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationTraceFigureField,
  ConversationTracePageField,
  ConversationTraceWindow,
  ConversationsField,
  ResponseRatingsField,
  UsageLogField,
  SessionScope,
} from '@/src/models/analytics/conversations-trace';
import {
  QueryExprType,
  QueryFieldExpr,
  QueryGroup,
  QueryLogicalOperator,
  QueryMode,
  QueryOffsetPage,
  QueryOperator,
  QueryOutputColumn,
  QueryPredicate,
  QuerySortDirection,
  QueryValueExpr,
  QueryValueType,
} from '@/src/models/analytics/query';
import {
  buildConversationDetailQuery,
  buildConversationFeedbackQuery,
  buildConversationSpansQuery,
  buildConversationTraceFiguresQuery,
  buildConversationTracePageQuery,
  buildConversationTraceRootsQuery,
} from '@/src/utils/analytics/conversations-queries';
import { paddedUtcDayRange } from '@/src/utils/analytics/conversation-formatting';

const CHAT_ID = 'Lrr0e6L5bpTND3IY_dN0_';
const CHAT_SCOPE: SessionScope = { id: CHAT_ID, source: CHAT_ID_SESSION_SOURCE };
const ALL_FIELDS: string[] = Object.values(ConversationsField);
const detailQuery = (availableFields: string[] | undefined = ALL_FIELDS) =>
  buildConversationDetailQuery(CHAT_ID, availableFields);
const TRACE_ID = '0a3f1d9c8b7e6a5f';
const BODY_COLUMNS = ['request_body', 'response_body'];

const selectedNames = (select?: QueryOutputColumn[]): string[] =>
  (select ?? []).map((column) => (column.expr as QueryFieldExpr).name);

const asPredicate = (filter: unknown): QueryPredicate => filter as QueryPredicate;

// The turn query aliases the rollup's columns to the names the timeline reads, so a test asserts which
// rollup column ended up under a given alias.
const fieldOf = (select: QueryOutputColumn[] | undefined, alias: string): string | undefined =>
  ((select ?? []).find((column) => column.as === alias)?.expr as QueryFieldExpr | undefined)?.name;

describe('buildConversationDetailQuery', () => {
  test('reads the conversations entity in row mode', () => {
    const query = detailQuery();

    expect(query.entity).toBe(CONVERSATIONS_ENTITY);
    expect(query.mode).toBe(QueryMode.Row);
    expect(query.group_by).toBeUndefined();
  });

  test('filters to one conversation by equality and requests a single row', () => {
    const query = detailQuery();
    const predicate = asPredicate(query.filter);

    expect(predicate.op).toBe(QueryOperator.Eq);
    expect(predicate.args[0]).toEqual({ type: QueryExprType.Field, name: ConversationsField.ChatId });
    expect(predicate.args[1]).toEqual({
      type: QueryExprType.Value,
      value_type: QueryValueType.String,
      value: CHAT_ID,
    });

    const page = query.page as QueryOffsetPage;
    expect(page.offset).toBe(0);
    expect(page.limit).toBe(1);
    expect(page.include_total).toBe(true);
  });

  // The count is a canary: the enum is what the detail select enumerates, so a member added without a place
  // to render it silently widens every single-conversation query.
  test('selects every stored column of the rollup', () => {
    const names = selectedNames(detailQuery().select);

    expect(names).toEqual(Object.values(ConversationsField));
    expect(names).toHaveLength(24);
  });

  // `traces` is catalogued heavy, so a default projection returns no value for it and the metadata panel's
  // trace field would read empty against a row that carries it.
  test('names the heavy trace column explicitly', () => {
    const names = selectedNames(detailQuery().select);

    expect(names).toContain(ConversationsField.Traces);
    expect(detailQuery().select?.length).toBeGreaterThan(0);
  });

  test('names the insight columns by their qualified flat names', () => {
    const names = selectedNames(detailQuery().select);

    expect(names).toContain('session_insights.title');
    expect(names).toContain(ConversationsField.InsightTitle);
  });

  test('names every descriptive insight column, not a subset', () => {
    const names = selectedNames(detailQuery().select);

    expect(names).toEqual(
      expect.arrayContaining([
        ConversationsField.InsightSummary,
        ConversationsField.InsightSentiment,
        ConversationsField.InsightActivityType,
        ConversationsField.InsightActivitySubTaskType,
        ConversationsField.InsightTopic,
        ConversationsField.InsightTopics,
        ConversationsField.InsightLanguage,
        ConversationsField.InsightResolutionStatus,
      ]),
    );
  });

  test('omits one descriptive insight column the schema does not report', () => {
    const withoutResolution = ALL_FIELDS.filter((name) => name !== ConversationsField.InsightResolutionStatus);
    const names = selectedNames(detailQuery(withoutResolution).select);

    expect(names).not.toContain(ConversationsField.InsightResolutionStatus);
    expect(names).toContain(ConversationsField.InsightSentiment);
    expect(names).toContain(ConversationsField.InsightSummary);
  });

  test('names no insight column when the schema reports none', () => {
    const withoutInsights = ALL_FIELDS.filter((name) => !name.startsWith('session_insights.'));
    const names = selectedNames(detailQuery(withoutInsights).select);

    expect(names.some((name) => name.startsWith('session_insights.'))).toBe(false);
    expect(names).toContain(ConversationsField.ChatId);
  });

  test('treats every descriptive insight field as optional', () => {
    expect(OPTIONAL_DETAIL_SELECT_FIELDS).toEqual(
      expect.arrayContaining([
        ConversationsField.InsightSummary,
        ConversationsField.InsightSentiment,
        ConversationsField.InsightActivityType,
        ConversationsField.InsightActivitySubTaskType,
        ConversationsField.InsightTopic,
        ConversationsField.InsightLanguage,
        ConversationsField.InsightResolutionStatus,
      ]),
    );
    expect(REQUIRED_DETAIL_SELECT_FIELDS.some((name) => name.startsWith('session_insights.'))).toBe(false);
  });

  test('names no field twice', () => {
    const names = selectedNames(detailQuery().select);

    expect(new Set(names).size).toBe(names.length);
  });

  test('omits the columns an instance does not carry', () => {
    const withoutInsights = ALL_FIELDS.filter((name) => !name.startsWith('session_insights.'));
    const names = selectedNames(detailQuery(withoutInsights).select);

    expect(names).not.toContain(ConversationsField.InsightTitle);
    expect(names).toContain(ConversationsField.Traces);
    expect(names).toContain(ConversationsField.ChatId);
  });

  test('names the required core alone when no schema is available', () => {
    const names = selectedNames(buildConversationDetailQuery(CHAT_ID).select);

    expect([...names].sort()).toEqual([...REQUIRED_DETAIL_SELECT_FIELDS].sort());
    expect(names).not.toContain(ConversationsField.Traces);
    expect(names).not.toContain(ConversationsField.InsightTitle);
  });

  // The split is the contract the projection rests on: a field classified as neither would be named
  // unconditionally and take the whole query down on an instance that lacks it.
  test('classifies every field of the entity as required or optional', () => {
    expect([...REQUIRED_DETAIL_SELECT_FIELDS, ...OPTIONAL_DETAIL_SELECT_FIELDS].sort()).toEqual(
      [...Object.values(ConversationsField)].sort(),
    );
  });

  // The list query bounds last_request_time to the selected period; a detail view addressed by id must
  // resolve whatever period the log was showing, so a bookmark cannot break as a conversation ages out.
  test('carries no time bound', () => {
    const query = detailQuery();
    const serialized = JSON.stringify(query.filter);

    expect(serialized).not.toContain(ConversationsField.LastRequestTime);
    expect(serialized).not.toContain(ConversationsField.FirstRequestTime);
    expect(asPredicate(query.filter).op).toBe(QueryOperator.Eq);
  });

  test('requests no sensitive column', () => {
    const names = selectedNames(detailQuery().select);

    for (const sensitive of ['request_body', 'response_body', 'jwt_claims', 'request_tags']) {
      expect(names).not.toContain(sensitive);
    }
  });

  test('encodes an id containing path separators verbatim into the value', () => {
    const pathLike = 'conversations/eRxsos/chathub-claude4__E2EConversation';
    const predicate = asPredicate(buildConversationDetailQuery(pathLike).filter);

    expect((predicate.args[1] as QueryValueExpr).value).toBe(pathLike);
  });
});

describe('buildConversationFeedbackQuery', () => {
  const ALL_FEEDBACK_FIELDS: string[] = Object.values(ResponseRatingsField);
  const feedbackQuery = (
    limit = CONVERSATION_FEEDBACK_LIMIT,
    schemaFields: string[] | undefined = ALL_FEEDBACK_FIELDS,
  ) => buildConversationFeedbackQuery(CHAT_ID, limit, schemaFields);

  test('reads the rating rollup in row mode, filtered to one conversation', () => {
    const query = feedbackQuery();
    const predicate = asPredicate(query.filter);

    expect(query.entity).toBe(FEEDBACK_ENTITY);
    expect(FEEDBACK_ENTITY).toBe('response_ratings');
    expect(query.mode).toBe(QueryMode.Row);
    expect(predicate.op).toBe(QueryOperator.Eq);
    expect(predicate.args[0]).toEqual({ type: QueryExprType.Field, name: ResponseRatingsField.ChatId });
  });

  test('selects the response grain: both times, the direction counts, disagreement and comments', () => {
    const names = selectedNames(feedbackQuery().select);

    expect(names).toEqual([
      ResponseRatingsField.ResponseId,
      ResponseRatingsField.FirstRateTime,
      ResponseRatingsField.LastRateTime,
      ResponseRatingsField.RatePosCount,
      ResponseRatingsField.RateZeroCount,
      ResponseRatingsField.RateNegCount,
      ResponseRatingsField.RateDistinctCount,
      ResponseRatingsField.CommentCount,
      ResponseRatingsField.CommentSample,
    ]);
  });

  test('names the comment text only when the schema reports it', () => {
    const withoutText = ALL_FEEDBACK_FIELDS.filter((name) => name !== ResponseRatingsField.CommentSample);
    const names = selectedNames(feedbackQuery(CONVERSATION_FEEDBACK_LIMIT, withoutText).select);

    expect(names).not.toContain(ResponseRatingsField.CommentSample);
    expect(names).toContain(ResponseRatingsField.CommentCount);
  });

  test('always names the comment count, which the service does not gate', () => {
    const names = selectedNames(buildConversationFeedbackQuery(CHAT_ID, CONVERSATION_FEEDBACK_LIMIT).select);

    expect(names).toContain(ResponseRatingsField.CommentCount);
    expect(names).not.toContain(ResponseRatingsField.CommentSample);
  });

  test('never selects the full comment set, which is sensitive and an array', () => {
    expect(JSON.stringify(feedbackQuery())).not.toContain('"comments"');
  });

  test('sorts most recently rated first and requests a total', () => {
    const query = feedbackQuery(50);

    expect(query.sort).toEqual([{ field: ResponseRatingsField.LastRateTime, dir: QuerySortDirection.Desc }]);

    const page = query.page as QueryOffsetPage;
    expect(page.limit).toBe(50);
    expect(page.include_total).toBe(true);
  });

  test('carries no time bound', () => {
    expect(JSON.stringify(feedbackQuery().filter)).not.toContain(ResponseRatingsField.LastRateTime);
  });
});

describe('buildConversationSpansQuery', () => {
  const query = () => buildConversationSpansQuery(TRACE_ID, CONVERSATION_SPAN_LIMIT);

  test('reads the usage log in row mode, with no grouping', () => {
    const built = query();

    expect(built.entity).toBe(USAGE_LOG_ENTITY);
    expect(built.mode).toBe(QueryMode.Row);
    expect(built.group_by).toBeUndefined();
  });

  // Scoped by the trace alone. A chat-id predicate here excluded the rows the listing counts — a root
  // carrying no conversation header, and the Core-internal calls recorded under the trace — so the drawer
  // reported fewer hops than the card that opened it, and the root the card describes was missing from its
  // own span tree.
  test('narrows to one trace and does not require the conversation header', () => {
    const filter = query().filter as QueryPredicate;

    expect(filter.args[0]).toEqual({ type: QueryExprType.Field, name: UsageLogField.TraceId });
    expect((filter.args[1] as QueryValueExpr).value).toBe(TRACE_ID);
  });

  test('names no chat id anywhere in the query', () => {
    expect(JSON.stringify(query())).not.toContain(UsageLogField.ChatId);
  });

  test('selects the span hierarchy, its cost and what each hop did', () => {
    const names = selectedNames(query().select);

    expect(names).toEqual([
      UsageLogField.CoreSpanId,
      UsageLogField.CoreParentSpanId,
      UsageLogField.EventKind,
      UsageLogField.Deployment,
      UsageLogField.ParentDeployment,
      UsageLogField.RequestMethod,
      UsageLogField.RequestUri,
      UsageLogField.ResponseUpstreamUri,
      UsageLogField.ResponseStatus,
      UsageLogField.Success,
      UsageLogField.OperationDurationMs,
      UsageLogField.TotalTokens,
      UsageLogField.DeploymentPrice,
      UsageLogField.RequestTime,
      UsageLogField.ResponseBodyBytes,
      UsageLogField.RequestBodyBytes,
      UsageLogField.NumberRequestMessages,
      UsageLogField.ReasoningTokens,
      UsageLogField.McpMethod,
      UsageLogField.McpToolCallName,
      UsageLogField.ExecutionPath,
    ]);
  });

  // The inspector's only pre-body facts. Plain columns, so the Request tab's message count is known before
  // anything is fetched and stays right when a body read is clamped or withheld.
  test('names the request size and message count without naming a body column', () => {
    const names = selectedNames(query().select);

    expect(names).toContain(UsageLogField.NumberRequestMessages);
    expect(names).toContain(UsageLogField.RequestBodyBytes);
    expect(names).not.toContain(UsageLogField.RequestBody);
    expect(names).not.toContain(UsageLogField.ResponseBody);
  });

  // Ordinary non-heavy columns of the entity, so unlike the assembled response they need no schema gate.
  test('names the MCP columns unconditionally', () => {
    const names = selectedNames(query().select);

    expect(names).toContain(UsageLogField.McpMethod);
    expect(names).toContain(UsageLogField.McpToolCallName);
    expect(names).toContain(UsageLogField.ExecutionPath);
  });

  test('reads no body column', () => {
    const names = selectedNames(query().select);

    for (const column of BODY_COLUMNS) {
      expect(names).not.toContain(column);
    }
  });

  // Offsets in the trace are measured from the earliest hop, so the spans have to arrive in that order.
  test('orders hops by when they were made and asks how many there are', () => {
    const built = query();

    expect(built.sort).toEqual([{ field: UsageLogField.RequestTime, dir: QuerySortDirection.Asc }]);

    const page = built.page as QueryOffsetPage;
    expect(page.limit).toBe(CONVERSATION_SPAN_LIMIT);
    expect(page.include_total).toBe(true);
  });
});

const PROJECT_ID = 'statgpt';
const PAGE_TRACE_IDS = ['0a3f1d9c8b7e6a5f', 'bee062c1e8b0b4d9'];
// Noon UTC, so a containing-day bound and a padded one are unambiguously different.
const NOON_UTC = Date.UTC(2026, 7, 27, 12, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;

const window = () => paddedUtcDayRange([NOON_UTC]) as ConversationTraceWindow;

const predicatesOf = (filter: unknown): QueryPredicate[] =>
  ((filter as QueryGroup).args ?? []).map((node) => node as QueryPredicate);

const namesInFilter = (filter: unknown): string[] =>
  predicatesOf(filter).map((node) => (node.args?.[0] as QueryFieldExpr | undefined)?.name ?? '');

const boundsOf = (filter: unknown): { fromMs: number; toMs: number } => {
  const times = predicatesOf(filter).filter(
    (node) => (node.args?.[0] as QueryFieldExpr | undefined)?.name === UsageLogField.RequestTime,
  );
  const valueAt = (op: QueryOperator) =>
    Number((times.find((node) => node.op === op)?.args[1] as QueryValueExpr).value);

  return { fromMs: valueAt(QueryOperator.Ge), toMs: valueAt(QueryOperator.Le) };
};

describe('paddedUtcDayRange', () => {
  test('expands to whole UTC days and then pads a further day at each end', () => {
    const { fromMs, toMs } = window();

    expect(fromMs).toBe(Date.UTC(2026, 7, 27) - DAY_MS);
    expect(toMs).toBe(Date.UTC(2026, 7, 28) - 1 + DAY_MS);
  });

  // The bound has to cover rows the read it was derived from could not see: a root span starts before its
  // children, and a Core-internal root fires after its parent's last child. Rounding to the *containing*
  // day leaves no margin at exactly the boundary those offsets straddle.
  test('covers a root recorded just before midnight and its child just after', () => {
    const rootMs = Date.UTC(2026, 7, 27, 23, 59, 59, 700);
    const childMs = Date.UTC(2026, 7, 28, 0, 0, 0, 100);
    const { fromMs, toMs } = paddedUtcDayRange([childMs]) as ConversationTraceWindow;

    expect(rootMs).toBeGreaterThanOrEqual(fromMs);
    expect(rootMs).toBeLessThanOrEqual(toMs);
    expect(childMs).toBeLessThanOrEqual(toMs);
  });

  // Guards the regression the padding exists to prevent: an unpadded containing-day floor would sit above
  // the root's own timestamp, so asserting UTC-ness alone would pass a query that still clips.
  test('the padding, not just the day boundary, is what covers that root', () => {
    const childMs = Date.UTC(2026, 7, 28, 0, 0, 0, 100);
    const containingDayFloor = Date.UTC(2026, 7, 28);
    const rootMs = Date.UTC(2026, 7, 27, 23, 59, 59, 700);

    expect(rootMs).toBeLessThan(containingDayFloor);
    expect(rootMs).toBeGreaterThanOrEqual((paddedUtcDayRange([childMs]) as ConversationTraceWindow).fromMs);
  });

  test('returns nothing when no time was recorded', () => {
    expect(paddedUtcDayRange([null, 'not a time'])).toBeNull();
  });
});

describe('buildConversationTracePageQuery', () => {
  const query = () =>
    buildConversationTracePageQuery(CHAT_SCOPE, PROJECT_ID, window(), 0, CONVERSATION_TRACE_PAGE_SIZE);

  test('groups the hop log by trace', () => {
    const built = query();

    expect(built.entity).toBe(USAGE_LOG_ENTITY);
    expect(built.mode).toBe(QueryMode.Aggregate);
    expect(built.group_by).toEqual([UsageLogField.TraceId]);
  });

  // The one query of the three that may carry the project: it is already restricted to rows carrying the
  // chat id, and a trace's labelled rows are single-project. It is also the only prune available, since
  // chat_id is not in the table's sort key.
  test('filters by the conversation, its project and the padded window', () => {
    const names = namesInFilter(query().filter);

    expect(names).toContain(UsageLogField.ChatId);
    expect(names).toContain(UsageLogField.ProjectId);
    expect(names.filter((name) => name === UsageLogField.RequestTime)).toHaveLength(2);
  });

  test('yields the trace id and its own two bounds under their aliases', () => {
    const aliases = (query().select ?? []).map((column) => column.as);

    expect(aliases).toEqual([
      undefined,
      ConversationTracePageField.FirstRequestTime,
      ConversationTracePageField.LastRequestTime,
    ]);
    expect(selectedNames(query().select)[0]).toBe(UsageLogField.TraceId);
  });

  // Deliberately figure-free. A sum resolved under a chat-id filter is computed without the rows that
  // filter excludes, which is the defect this listing exists to fix — so the figures come from the pass
  // that carries no chat id, and this one returns only what scopes the other two.
  test('resolves no figures of its own', () => {
    const serialized = JSON.stringify(query().select);

    expect(serialized).not.toContain(UsageLogField.TotalTokens);
    expect(serialized).not.toContain(UsageLogField.DeploymentPrice);
    expect(serialized).not.toContain(UsageLogField.Success);
  });

  // Ascending is what makes offset paging sound against a live table: a newly recorded trace sorts past the
  // last page fetched, so consumed offsets do not shift. The trace id keeps a boundary from being arbitrary.
  test('orders ascending by the trace start, tie-broken by trace id', () => {
    expect(query().sort).toEqual([
      { field: ConversationTracePageField.FirstRequestTime, dir: QuerySortDirection.Asc },
      { field: UsageLogField.TraceId, dir: QuerySortDirection.Asc },
    ]);
  });

  test('pages by offset at the listing page size', () => {
    const page = buildConversationTracePageQuery(CHAT_SCOPE, PROJECT_ID, window(), 100, CONVERSATION_TRACE_PAGE_SIZE)
      .page as QueryOffsetPage;

    expect(page.offset).toBe(100);
    expect(page.limit).toBe(CONVERSATION_TRACE_PAGE_SIZE);
  });
});

describe('buildConversationTraceRootsQuery', () => {
  const query = () => buildConversationTraceRootsQuery(PAGE_TRACE_IDS, window(), CONVERSATION_TRACE_PAGE_SIZE);

  test('reads root spans of the page traces, located by trace id alone', () => {
    const names = namesInFilter(query().filter);

    expect(names).toContain(UsageLogField.CoreParentSpanId);
    expect(names).toContain(UsageLogField.TraceId);
    expect(names).not.toContain(UsageLogField.ChatId);
  });

  // Required in the projection, forbidden in the filter. The Core-internal marker compares the root's
  // project against the conversation's, so the value must be read; filtering on it would drop the
  // Core-internal roots the marker exists to identify.
  test('projects the project id but never filters on it', () => {
    expect(selectedNames(query().select)).toContain(UsageLogField.ProjectId);
    expect(namesInFilter(query().filter)).not.toContain(UsageLogField.ProjectId);
  });

  test('projects the card fields and no body column', () => {
    const names = selectedNames(query().select);

    for (const column of [
      UsageLogField.TraceId,
      UsageLogField.CoreSpanId,
      UsageLogField.RequestTime,
      UsageLogField.OperationDurationMs,
      UsageLogField.Success,
      UsageLogField.ResponseStatus,
      UsageLogField.TotalTokens,
      UsageLogField.TotalPrice,
      UsageLogField.DeploymentPrice,
      UsageLogField.ClientSessionId,
      UsageLogField.RequestUri,
      UsageLogField.EventKind,
      UsageLogField.NumberRequestMessages,
      UsageLogField.Deployment,
    ]) {
      expect(names).toContain(column);
    }
    for (const column of BODY_COLUMNS) {
      expect(names).not.toContain(column);
    }
  });
});

describe('buildConversationTraceFiguresQuery', () => {
  const query = () => buildConversationTraceFiguresQuery(PAGE_TRACE_IDS, window(), CONVERSATION_TRACE_PAGE_SIZE);

  test('groups the page traces by trace and event kind', () => {
    const built = query();

    expect(built.mode).toBe(QueryMode.Aggregate);
    expect(built.group_by).toEqual([UsageLogField.TraceId, UsageLogField.EventKind]);
  });

  // Dropping the chat id is what makes these figures right without correction: scoped by trace, the span
  // count, tokens and price are simply the trace's own, so there is no root to add back and no count to
  // increment.
  test('carries neither the chat id nor the project', () => {
    const names = namesInFilter(query().filter);

    expect(names).not.toContain(UsageLogField.ChatId);
    expect(names).not.toContain(UsageLogField.ProjectId);
  });

  test('counts failures with a conditional sum rather than a filter', () => {
    const serialized = JSON.stringify(query().select);

    expect(serialized).toContain('"name":"if"');
    expect(serialized).toContain(ConversationTraceFigureField.FailedSpans);
  });

  test('resolves the response ids that attribute ratings to a trace', () => {
    expect(JSON.stringify(query().select)).toContain(UsageLogField.ResponseId);
  });

  test('reads no body column', () => {
    for (const column of BODY_COLUMNS) {
      expect(JSON.stringify(query().select)).not.toContain(column);
    }
  });
});

// The two page-scoped passes must agree on scope, asserted as ONE property rather than as two filter lists
// compared by eye. Divergence between them is the mechanism that produced every arithmetic correction this
// design deleted: when the figures cover rows the roots do not, a trace's totals stop reconciling with its
// cards and the gap has to be patched field by field.
describe('the roots and figures passes are scoped identically', () => {
  const ROOT_ONLY = new Set<string>([UsageLogField.CoreParentSpanId]);

  const comparableFilter = (filter: unknown) =>
    predicatesOf(filter).filter((node) => !ROOT_ONLY.has((node.args?.[0] as QueryFieldExpr | undefined)?.name ?? ''));

  test('their filters are equal modulo the root-span predicate', () => {
    const roots = buildConversationTraceRootsQuery(PAGE_TRACE_IDS, window(), CONVERSATION_TRACE_PAGE_SIZE);
    const figures = buildConversationTraceFiguresQuery(PAGE_TRACE_IDS, window(), CONVERSATION_TRACE_PAGE_SIZE);

    expect(comparableFilter(roots.filter)).toEqual(comparableFilter(figures.filter));
  });

  test('and they agree on the window, so neither can silently read a narrower one', () => {
    const roots = buildConversationTraceRootsQuery(PAGE_TRACE_IDS, window(), CONVERSATION_TRACE_PAGE_SIZE);
    const figures = buildConversationTraceFiguresQuery(PAGE_TRACE_IDS, window(), CONVERSATION_TRACE_PAGE_SIZE);

    expect(boundsOf(roots.filter)).toEqual(boundsOf(figures.filter));
    expect(boundsOf(figures.filter)).toEqual({ fromMs: window().fromMs, toMs: window().toMs });
  });
});

// The figures pass has a second call site: the Chat view resolves figures for the traces its own transcript
// covers, so an answer's figures never depend on how far the listing has been paged. Same builder, same
// scoping rules — and the invariant is asserted here too, because a narrower filter at this call site would
// reintroduce every correction the design deleted, inside the Chat view instead of the listing.
describe('the figures pass is scoped the same way for the transcript traces', () => {
  const TRANSCRIPT_TRACE_IDS = ['t1', 't2', 't3'];

  test('carries neither the chat id nor the project', () => {
    const built = buildConversationTraceFiguresQuery(TRANSCRIPT_TRACE_IDS, window(), 24);
    const names = namesInFilter(built.filter);

    expect(names).not.toContain(UsageLogField.ChatId);
    expect(names).not.toContain(UsageLogField.ProjectId);
    expect(names).toContain(UsageLogField.TraceId);
  });

  test('is the same query shape the listing builds, differing only in which traces it names', () => {
    const forTranscript = buildConversationTraceFiguresQuery(TRANSCRIPT_TRACE_IDS, window(), 24);
    const forListing = buildConversationTraceFiguresQuery(PAGE_TRACE_IDS, window(), 24);

    expect(forTranscript.group_by).toEqual(forListing.group_by);
    expect(forTranscript.select).toEqual(forListing.select);
    expect(boundsOf(forTranscript.filter)).toEqual(boundsOf(forListing.filter));
  });

  test('reads no body column', () => {
    const built = buildConversationTraceFiguresQuery(TRANSCRIPT_TRACE_IDS, window(), 24);

    for (const column of BODY_COLUMNS) {
      expect(JSON.stringify(built)).not.toContain(column);
    }
  });
});
