import { describe, expect, test } from 'vitest';

import {
  CONVERSATIONS_ENTITY,
  CONVERSATION_FEEDBACK_LIMIT,
  CONVERSATION_SPAN_LIMIT,
  CONVERSATION_TURN_LIMIT,
  FEEDBACK_ENTITY,
  OPTIONAL_DETAIL_SELECT_FIELDS,
  REQUIRED_DETAIL_SELECT_FIELDS,
  TURNS_ENTITY,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationTurnField,
  ConversationsField,
  RateAnalyticsField,
  TurnsField,
  UsageLogField,
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
  buildConversationTurnsQuery,
} from '@/src/utils/analytics/conversations-queries';

const CHAT_ID = 'Lrr0e6L5bpTND3IY_dN0_';
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
    expect(names).toHaveLength(18);
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

    expect(names).toContain('conversation_insights.title');
    expect(names).toContain(ConversationsField.InsightTitle);
  });

  test('omits the columns an instance does not carry', () => {
    const withoutInsights = ALL_FIELDS.filter((name) => !name.startsWith('conversation_insights.'));
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
  test('reads the feedback entity in row mode, filtered to one conversation', () => {
    const query = buildConversationFeedbackQuery(CHAT_ID, CONVERSATION_FEEDBACK_LIMIT);
    const predicate = asPredicate(query.filter);

    expect(query.entity).toBe(FEEDBACK_ENTITY);
    expect(query.mode).toBe(QueryMode.Row);
    expect(predicate.op).toBe(QueryOperator.Eq);
    expect(predicate.args[0]).toEqual({ type: QueryExprType.Field, name: RateAnalyticsField.ChatId });
  });

  test('selects direction, recorded time and response id', () => {
    const names = selectedNames(buildConversationFeedbackQuery(CHAT_ID, CONVERSATION_FEEDBACK_LIMIT).select);

    expect(names).toEqual([RateAnalyticsField.ResponseId, RateAnalyticsField.Rate, RateAnalyticsField.RequestTime]);
  });

  // `comment` is sensitive: requesting it strips the column from the query model and fails as an unknown
  // field for any caller without the elevated role, taking the whole panel down with it.
  test('never selects the sensitive comment column', () => {
    const names = selectedNames(buildConversationFeedbackQuery(CHAT_ID, CONVERSATION_FEEDBACK_LIMIT).select);

    expect(names).not.toContain('comment');
  });

  test('sorts most recent first and requests a total', () => {
    const query = buildConversationFeedbackQuery(CHAT_ID, 50);

    expect(query.sort).toEqual([{ field: RateAnalyticsField.RequestTime, dir: QuerySortDirection.Desc }]);

    const page = query.page as QueryOffsetPage;
    expect(page.limit).toBe(50);
    expect(page.include_total).toBe(true);
  });

  test('carries no time bound', () => {
    const query = buildConversationFeedbackQuery(CHAT_ID, CONVERSATION_FEEDBACK_LIMIT);

    expect(JSON.stringify(query.filter)).not.toContain(RateAnalyticsField.RequestTime);
  });
});

describe('buildConversationTurnsQuery', () => {
  const query = () => buildConversationTurnsQuery(CHAT_ID, CONVERSATION_TURN_LIMIT);

  test('reads the turns rollup in row mode', () => {
    const built = query();

    expect(built.entity).toBe(TURNS_ENTITY);
    expect(built.mode).toBe(QueryMode.Row);
    expect(built.group_by).toBeUndefined();
    expect(JSON.stringify(built.select)).not.toContain(QueryExprType.Fn);
  });

  test('does not read the hop-level usage log', () => {
    expect(query().entity).not.toBe(USAGE_LOG_ENTITY);
  });

  test('filters to one conversation by equality', () => {
    const predicate = asPredicate(query().filter);

    expect(predicate.op).toBe(QueryOperator.Eq);
    expect(predicate.args[0]).toEqual({ type: QueryExprType.Field, name: TurnsField.ChatId });
    expect((predicate.args[1] as QueryValueExpr).value).toBe(CHAT_ID);
  });

  // The rollup's cost is each hop's own cost added up, so only the billed hop of a chain contributes and
  // the figure does not double-count what a chain-inclusive total would.
  test('reads the rollup cost under the turn cost alias', () => {
    expect(fieldOf(query().select, ConversationTurnField.Cost)).toBe(TurnsField.TotalPrice);
  });

  // The rollup's duration_ms is the turn's elapsed time (its longest hop); hop_duration_total_ms is the
  // one that adds nested hops up, and this query must not read it.
  test('reads the elapsed duration rather than the hop total', () => {
    expect(fieldOf(query().select, ConversationTurnField.DurationMs)).toBe(TurnsField.DurationMs);
    expect(JSON.stringify(query())).not.toContain('hop_duration_total_ms');
  });

  test('reports when each turn started, its hop count and its token total', () => {
    const select = query().select;

    expect(fieldOf(select, ConversationTurnField.Started)).toBe(TurnsField.FirstRequestTime);
    expect(fieldOf(select, ConversationTurnField.Hops)).toBe(TurnsField.HopCount);
    expect(fieldOf(select, ConversationTurnField.Tokens)).toBe(TurnsField.TotalTokens);
  });

  // The span drawer looks a turn's tree up by its trace id, so the projection has to keep carrying it.
  test('keeps the trace id addressable', () => {
    expect(selectedNames(query().select)).toContain(TurnsField.TraceId);
  });

  test('orders turns oldest first, as a transcript reads', () => {
    expect(query().sort).toEqual([{ field: ConversationTurnField.Started, dir: QuerySortDirection.Asc }]);
  });

  // A single conversation reached 930 usage-log rows locally; an unbounded read would pull all of them.
  test('bounds the number of turns it will read', () => {
    const page = query().page as QueryOffsetPage;

    expect(page.offset).toBe(0);
    expect(page.limit).toBe(CONVERSATION_TURN_LIMIT);
  });

  // Bodies are both sensitive and heavy: selecting one strips the column for callers without the
  // elevated role and reads up to 1.2 MB per row.
  test('reads no body column', () => {
    const serialized = JSON.stringify(query());

    for (const column of BODY_COLUMNS) {
      expect(serialized).not.toContain(column);
    }
  });
});

describe('buildConversationSpansQuery', () => {
  const query = () => buildConversationSpansQuery(CHAT_ID, TRACE_ID, CONVERSATION_SPAN_LIMIT);

  test('reads the usage log in row mode, with no grouping', () => {
    const built = query();

    expect(built.entity).toBe(USAGE_LOG_ENTITY);
    expect(built.mode).toBe(QueryMode.Row);
    expect(built.group_by).toBeUndefined();
  });

  test('narrows to one trace of one conversation', () => {
    const group = query().filter as QueryGroup;

    expect(group.op).toBe(QueryLogicalOperator.And);

    const [chat, trace] = group.args.map((node) => node as QueryPredicate);

    expect(chat.args[0]).toEqual({ type: QueryExprType.Field, name: UsageLogField.ChatId });
    expect((chat.args[1] as QueryValueExpr).value).toBe(CHAT_ID);
    expect(trace.args[0]).toEqual({ type: QueryExprType.Field, name: UsageLogField.TraceId });
    expect((trace.args[1] as QueryValueExpr).value).toBe(TRACE_ID);
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
      UsageLogField.ReasoningTokens,
      UsageLogField.McpMethod,
      UsageLogField.McpToolCallName,
      UsageLogField.ExecutionPath,
    ]);
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
