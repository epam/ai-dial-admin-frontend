import { describe, expect, test } from 'vitest';

import {
  CONVERSATIONS_ENTITY,
  CONVERSATION_FEEDBACK_LIMIT,
  CONVERSATION_SPAN_LIMIT,
  CONVERSATION_TURN_LIMIT,
  FEEDBACK_ENTITY,
  USAGE_LOG_ENTITY,
} from '@/src/constants/analytics/conversations-trace';
import {
  ConversationTurnField,
  ConversationsField,
  RateAnalyticsField,
  UsageLogField,
} from '@/src/models/analytics/conversations-trace';
import {
  QueryExprType,
  QueryFieldExpr,
  QueryFnExpr,
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
const TRACE_ID = '0a3f1d9c8b7e6a5f';
const BODY_COLUMNS = ['request_body', 'response_body'];

const selectedNames = (select?: QueryOutputColumn[]): string[] =>
  (select ?? []).map((column) => (column.expr as QueryFieldExpr).name);

const asPredicate = (filter: unknown): QueryPredicate => filter as QueryPredicate;

const measureOf = (select: QueryOutputColumn[] | undefined, alias: string): QueryFnExpr =>
  (select ?? []).find((column) => column.as === alias)?.expr as QueryFnExpr;

const measureArgNames = (measure: QueryFnExpr): string[] =>
  (measure.args ?? []).map((arg) => (arg as QueryFieldExpr).name);

describe('buildConversationDetailQuery', () => {
  test('reads the conversations entity in row mode', () => {
    const query = buildConversationDetailQuery(CHAT_ID);

    expect(query.entity).toBe(CONVERSATIONS_ENTITY);
    expect(query.mode).toBe(QueryMode.Row);
    expect(query.group_by).toBeUndefined();
  });

  test('filters to one conversation by equality and requests a single row', () => {
    const query = buildConversationDetailQuery(CHAT_ID);
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

  test('selects every stored column of the rollup', () => {
    const names = selectedNames(buildConversationDetailQuery(CHAT_ID).select);

    expect(names).toEqual(Object.values(ConversationsField));
    expect(names).toHaveLength(14);
  });

  // The list query bounds last_request_time to the selected period; a detail view addressed by id must
  // resolve whatever period the log was showing, so a bookmark cannot break as a conversation ages out.
  test('carries no time bound', () => {
    const query = buildConversationDetailQuery(CHAT_ID);
    const serialized = JSON.stringify(query.filter);

    expect(serialized).not.toContain(ConversationsField.LastRequestTime);
    expect(serialized).not.toContain(ConversationsField.FirstRequestTime);
    expect(asPredicate(query.filter).op).toBe(QueryOperator.Eq);
  });

  test('requests no sensitive column', () => {
    const names = selectedNames(buildConversationDetailQuery(CHAT_ID).select);

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

  // turn_count on the rollup counts every proxy hop, so turns are grouped out of the usage log by
  // trace_id instead — the grain a user's turn actually maps to.
  test('groups the usage log by trace id in aggregate mode', () => {
    const built = query();

    expect(built.entity).toBe(USAGE_LOG_ENTITY);
    expect(built.mode).toBe(QueryMode.Aggregate);
    expect(built.group_by).toEqual([UsageLogField.TraceId]);
  });

  test('filters to one conversation by equality', () => {
    const predicate = asPredicate(query().filter);

    expect(predicate.op).toBe(QueryOperator.Eq);
    expect(predicate.args[0]).toEqual({ type: QueryExprType.Field, name: UsageLogField.ChatId });
    expect((predicate.args[1] as QueryValueExpr).value).toBe(CHAT_ID);
  });

  // total_price is hierarchical — it already includes what a hop's children cost — so summing it across
  // the hops of one trace counts the same spend repeatedly. deployment_price is each hop's own cost.
  test('sums each hop own cost and never the hierarchical total price', () => {
    const cost = measureOf(query().select, ConversationTurnField.Cost);

    expect(cost.name).toBe('sum');
    expect(measureArgNames(cost)).toEqual([UsageLogField.DeploymentPrice]);
    expect(JSON.stringify(query().select)).not.toContain('total_price');
  });

  // Hops of one trace overlap in time, so their durations do not add up to the turn's latency.
  test('takes the longest hop as the turn duration rather than summing', () => {
    const duration = measureOf(query().select, ConversationTurnField.DurationMs);

    expect(duration.name).toBe('max');
    expect(measureArgNames(duration)).toEqual([UsageLogField.OperationDurationMs]);
  });

  test('reports when each turn started and how many hops it took', () => {
    const started = measureOf(query().select, ConversationTurnField.Started);
    const hops = measureOf(query().select, ConversationTurnField.Hops);

    expect(started.name).toBe('min');
    expect(measureArgNames(started)).toEqual([UsageLogField.RequestTime]);
    expect(hops.name).toBe('count');
    expect(hops.args ?? []).toEqual([]);
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

  test('selects the span hierarchy, its timings and its cost', () => {
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
    ]);
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
