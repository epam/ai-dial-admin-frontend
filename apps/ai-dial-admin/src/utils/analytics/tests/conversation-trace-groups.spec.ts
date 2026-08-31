import { describe, expect, test } from 'vitest';

import {
  ConversationFeedbackRow,
  ConversationTraceFigureRow,
  ConversationTracePageRow,
  ConversationTraceRootRow,
} from '@/src/models/analytics/conversations-trace';
import {
  TraceInvariant,
  attributeRatingsToTraces,
  isCoreInternalRoot,
  traceGroupsOf,
  traceInvariantViolations,
} from '@/src/utils/analytics/conversation-trace-groups';

const TRACE = 'ab6e92ac67d3503cf270ccc6d7ab4aa3';
const OTHER_TRACE = '7eb599a47fc6b1b05cf7c11521a332c0';
const CONVERSATION_PROJECT = '';
const CORE_PROJECT = 'dial';

const pageRow = (traceId: string, firstMs: number, lastMs = firstMs): ConversationTracePageRow => ({
  trace_id: traceId,
  first_request_time: firstMs,
  last_request_time: lastMs,
});

const root = (over: Partial<ConversationTraceRootRow> = {}): ConversationTraceRootRow => ({
  trace_id: TRACE,
  core_span_id: 'bee062c1e8b0b4d9',
  request_time: 1000,
  operation_duration_ms: 12341,
  success: true,
  response_status: 200,
  total_tokens: 0,
  total_price: 0.02895,
  deployment_price: null,
  'usage_client_identity.client_session_id': 'the-conversation',
  request_uri: '/openai/deployments/applications/public/pg-chat-hub__1.0.0/chat/completions',
  event_kind: 'llm_call',
  number_request_messages: 1,
  deployment: 'applications/public/pg-chat-hub__1.0.0',
  project_id: CONVERSATION_PROJECT,
  ...over,
});

const figure = (over: Partial<ConversationTraceFigureRow> = {}): ConversationTraceFigureRow => ({
  trace_id: TRACE,
  event_kind: 'llm_call',
  spans: 4,
  tokens: 11615,
  price: 0.02895,
  failed_spans: 0,
  response_ids: [],
  ...over,
});

const groupsOf = (
  pageRows: ConversationTracePageRow[],
  rootRows: ConversationTraceRootRow[],
  figureRows: ConversationTraceFigureRow[],
  rootCap?: number,
) => traceGroupsOf(pageRows, rootRows, figureRows, CONVERSATION_PROJECT, rootCap);

describe('isCoreInternalRoot', () => {
  test('marks a root recorded under a project other than the conversation own', () => {
    expect(isCoreInternalRoot(root({ project_id: CORE_PROJECT }), 'statgpt')).toBe(true);
  });

  test('does not mark a root sharing the conversation project', () => {
    expect(isCoreInternalRoot(root({ project_id: 'claude-eval-key1' }), 'claude-eval-key1')).toBe(false);
    expect(isCoreInternalRoot(root({ project_id: '' }), CONVERSATION_PROJECT)).toBe(false);
  });

  // The measured chat shape, and the one an earlier version of this predicate left unmarked: the conversation
  // carries no project at all while Core records its own service call under `dial`. Requiring the
  // conversation's project to be non-empty hid the marker on exactly the traces it exists for — caught in the
  // browser against trace 64a9c812, where the title-generation card rendered unmarked beside its client call.
  test('marks a Core service root even where the conversation carries no project', () => {
    expect(isCoreInternalRoot(root({ project_id: CORE_PROJECT }), CONVERSATION_PROJECT)).toBe(true);
  });

  // The blank handling is asymmetric on purpose. A blank on the root side is an absence — the row records no
  // project, which says nothing about who called it. A blank on the conversation side is still a difference
  // when the root names one.
  test('treats a blank on the root side as an absence rather than a difference', () => {
    expect(isCoreInternalRoot(root({ project_id: '' }), 'statgpt')).toBe(false);
    expect(isCoreInternalRoot(root({ project_id: null }), 'statgpt')).toBe(false);
  });
});

describe('traceGroupsOf', () => {
  test('renders one card per root, earliest first', () => {
    const [group] = groupsOf(
      [pageRow(TRACE, 1000)],
      [root({ core_span_id: 'later', request_time: 12760 }), root({ core_span_id: 'earlier', request_time: 404 })],
      [figure()],
    );

    expect(group.cards.map(({ coreSpanId }) => coreSpanId)).toEqual(['earlier', 'later']);
  });

  // The measured app-form shape: the client root is free itself and its chain price is the sum of its
  // children own prices, so the card reads as "free itself, spent downstream".
  test('reads a card own and chain price from its own row', () => {
    const [group] = groupsOf([pageRow(TRACE, 1000)], [root()], [figure()]);

    expect(group.cards[0].ownPrice).toBeNull();
    expect(group.cards[0].chainPrice).toBe(0.02895);
    expect(group.cards[0].ownTokens).toBe(0);
  });

  // The figures pass carries no chat id, so its sums are already the trace own. Nothing is added back for a
  // root the conversation own filter would have missed, and no count is incremented.
  test('sums the trace figures with no correction applied', () => {
    const [group] = groupsOf(
      [pageRow(TRACE, 1000)],
      [root({ 'usage_client_identity.client_session_id': '' })],
      [
        figure({ event_kind: 'llm_call', spans: 4, tokens: 11615, price: 0.02895 }),
        figure({ event_kind: 'mcp', spans: 2, tokens: 100, price: 0.001 }),
      ],
    );

    expect(group.spans).toBe(6);
    expect(group.tokens).toBe(11715);
    expect(group.price).toBeCloseTo(0.02995);
  });

  test('builds one chip per recorded event kind, carrying its count', () => {
    const [group] = groupsOf(
      [pageRow(TRACE, 1000)],
      [root()],
      [
        figure({ event_kind: 'mcp', spans: 2 }),
        figure({ event_kind: 'llm_call', spans: 5 }),
        figure({ event_kind: '', spans: 1 }),
      ],
    );

    expect(group.chips).toEqual([
      { eventKind: 'llm_call', spans: 5 },
      { eventKind: 'mcp', spans: 2 },
      { eventKind: '', spans: 1 },
    ]);
  });

  test('reports a trace whose root was not returned, rather than omitting it', () => {
    const [group] = groupsOf([pageRow(TRACE, 1000)], [], [figure()]);

    expect(group.isRootRecorded).toBe(false);
    expect(group.cards).toEqual([]);
    expect(group.spans).toBe(4);
  });

  test('flags the trace failure count without changing a card own status', () => {
    const [group] = groupsOf([pageRow(TRACE, 1000)], [root({ success: true })], [figure({ failed_spans: 2 })]);

    expect(group.failedSpans).toBe(2);
    expect(group.cards[0].isSuccess).toBe(true);
  });

  // Capped, but never in silence: the trace own figures are not capped with its cards, so the remainder has
  // to be stated or the totals stop reconciling with what is on screen.
  test('caps the cards and reports how many were held back', () => {
    const roots = Array.from({ length: 5 }, (_, index) =>
      root({ core_span_id: `span-${index}`, request_time: 1000 + index }),
    );
    const [group] = groupsOf([pageRow(TRACE, 1000)], roots, [figure({ spans: 5 })], 2);

    expect(group.cards).toHaveLength(2);
    expect(group.elidedCardCount).toBe(3);
    expect(group.spans).toBe(5);
  });

  test('reports nothing held back when the cards fit', () => {
    const [group] = groupsOf([pageRow(TRACE, 1000)], [root()], [figure()], 12);

    expect(group.elidedCardCount).toBe(0);
  });

  test('keeps the page ordering the paging pass resolved', () => {
    const groups = groupsOf(
      [pageRow(TRACE, 1000), pageRow(OTHER_TRACE, 2000)],
      [root(), root({ trace_id: OTHER_TRACE, core_span_id: 'other-root' })],
      [figure(), figure({ trace_id: OTHER_TRACE })],
    );

    expect(groups.map(({ traceId }) => traceId)).toEqual([TRACE, OTHER_TRACE]);
  });

  test('records whether a card own row carried the conversation header', () => {
    const [group] = groupsOf(
      [pageRow(TRACE, 1000)],
      [
        root({
          core_span_id: 'labelled',
          'usage_client_identity.client_session_id': 'the-conversation',
          request_time: 404,
        }),
        root({ core_span_id: 'bare', 'usage_client_identity.client_session_id': '', request_time: 12760 }),
      ],
      [figure()],
    );

    expect(group.cards.map(({ hasConversationLabel }) => hasConversationLabel)).toEqual([true, false]);
  });

  test('breaks a tie on recorded time by span id, so the order is stable', () => {
    const [group] = groupsOf(
      [pageRow(TRACE, 1000)],
      [root({ core_span_id: 'b', request_time: 1000 }), root({ core_span_id: 'a', request_time: 1000 })],
      [figure()],
    );

    expect(group.cards.map(({ coreSpanId }) => coreSpanId)).toEqual(['a', 'b']);
  });

  test('collects the response ids a trace recorded, without duplicates', () => {
    const [group] = groupsOf(
      [pageRow(TRACE, 1000)],
      [root()],
      [figure({ response_ids: ['r1', 'r2'] }), figure({ event_kind: 'mcp', response_ids: ['r2', 'r3'] })],
    );

    expect([...group.responseIds].sort()).toEqual(['r1', 'r2', 'r3']);
  });
});

describe('attributeRatingsToTraces', () => {
  const feedback = (over: Partial<ConversationFeedbackRow> = {}): ConversationFeedbackRow => ({
    response_id: 'r1',
    first_rate_time: 5000,
    last_rate_time: 5000,
    rate_pos_count: 1,
    rate_zero_count: 0,
    rate_neg_count: 0,
    rate_distinct_count: 1,
    comment_count: 0,
    ...over,
  });

  const groups = (responseIds: string[], traceId = TRACE) =>
    groupsOf(
      [pageRow(traceId, 1000)],
      [root({ trace_id: traceId })],
      [figure({ trace_id: traceId, response_ids: responseIds })],
    );

  test('attributes a rating to the trace that recorded its response', () => {
    const counts = attributeRatingsToTraces(groups(['r1']), [feedback()]);

    expect(counts.get(TRACE)).toEqual({ rating_up: 1, rating_down: 0 });
  });

  test('counts the zero and negative directions together as down', () => {
    const counts = attributeRatingsToTraces(groups(['r1']), [
      feedback({ rate_pos_count: 0, rate_zero_count: 1, rate_neg_count: 2 }),
    ]);

    expect(counts.get(TRACE)).toEqual({ rating_up: 0, rating_down: 3 });
  });

  test('sums several rated responses of one trace', () => {
    const counts = attributeRatingsToTraces(groups(['r1', 'r2']), [
      feedback({ response_id: 'r1' }),
      feedback({ response_id: 'r2', rate_pos_count: 2 }),
    ]);

    expect(counts.get(TRACE)).toEqual({ rating_up: 3, rating_down: 0 });
  });

  // Left unplaced rather than guessed. Placing it on the last loaded trace would move it once a further page
  // arrived, and a figure that changes because the reader scrolled is worse than an absent one. The rating is
  // still counted by the feedback panel, whose figures come from a conversation-scoped aggregate.
  test('leaves a rating unattributed when no loaded trace recorded its response', () => {
    const counts = attributeRatingsToTraces(groups(['r1']), [feedback({ response_id: 'r-unknown' })]);

    expect(counts.size).toBe(0);
  });

  test('ignores a rating carrying no response id', () => {
    expect(attributeRatingsToTraces(groups(['r1']), [feedback({ response_id: null })]).size).toBe(0);
  });

  test('does not move an attribution when a further page is appended', () => {
    const rows = [feedback({ response_id: 'r1' })];
    const firstPage = attributeRatingsToTraces(groups(['r1']), rows);

    const appended = attributeRatingsToTraces(
      [...groups(['r1']), ...groups(['r9'], OTHER_TRACE)],
      [...rows, feedback({ response_id: 'r9', rate_pos_count: 7 })],
    );

    expect(appended.get(TRACE)).toEqual(firstPage.get(TRACE));
    expect(appended.get(OTHER_TRACE)).toEqual({ rating_up: 7, rating_down: 0 });
  });
});

describe('traceInvariantViolations', () => {
  const violationsOf = (roots: ConversationTraceRootRow[], projectId = 'statgpt') =>
    traceInvariantViolations(roots, projectId).map(({ invariant }) => invariant);

  // The ordinary measured shapes: a single-root trace, and a client root beside one Core-internal root.
  test('reports nothing for the shapes the data actually records', () => {
    expect(violationsOf([root({ project_id: 'statgpt' })])).toEqual([]);
    expect(
      violationsOf([
        root({ core_span_id: 'client', 'usage_client_identity.client_session_id': 'c', project_id: 'statgpt' }),
        root({ core_span_id: 'service', 'usage_client_identity.client_session_id': '', project_id: 'dial' }),
      ]),
    ).toEqual([]);
  });

  test('reports nothing for the router shape, whose sole root carries no header', () => {
    expect(
      violationsOf(
        [root({ 'usage_client_identity.client_session_id': '', project_id: 'claude-eval-key1' })],
        'claude-eval-key1',
      ),
    ).toEqual([]);
  });

  test('reports a trace whose roots carry two conversations', () => {
    expect(
      violationsOf([
        root({ core_span_id: 'a', 'usage_client_identity.client_session_id': 'one', project_id: 'statgpt' }),
        root({ core_span_id: 'b', 'usage_client_identity.client_session_id': 'two', project_id: 'statgpt' }),
      ]),
    ).toContain(TraceInvariant.OneConversationPerTrace);
  });

  test('reports labelled roots spanning two projects', () => {
    expect(
      violationsOf([
        root({ core_span_id: 'a', 'usage_client_identity.client_session_id': 'one', project_id: 'statgpt' }),
        root({ core_span_id: 'b', 'usage_client_identity.client_session_id': 'one', project_id: 'other' }),
      ]),
    ).toContain(TraceInvariant.OneProjectAmongLabelledRoots);
  });

  test('reports more than one Core-internal root', () => {
    expect(
      violationsOf([
        root({ core_span_id: 'a', 'usage_client_identity.client_session_id': 'one', project_id: 'statgpt' }),
        root({ core_span_id: 'b', 'usage_client_identity.client_session_id': '', project_id: 'dial' }),
        root({ core_span_id: 'c', 'usage_client_identity.client_session_id': '', project_id: 'dial' }),
      ]),
    ).toContain(TraceInvariant.AtMostOneCoreInternalRoot);
  });

  test('reports several roots where none carries the conversation header', () => {
    expect(
      violationsOf([
        root({ core_span_id: 'a', 'usage_client_identity.client_session_id': '', project_id: 'statgpt' }),
        root({ core_span_id: 'b', 'usage_client_identity.client_session_id': '', project_id: 'statgpt' }),
      ]),
    ).toContain(TraceInvariant.OneRootWhenNoneIsLabelled);
  });

  // The shape that would split the labelling rule from the marker: neither rule can settle which card is the
  // conversation's own call. No such trace is recorded, so this guards rather than being relied upon.
  test('reports a labelled root beside an unmarked unlabelled one', () => {
    expect(
      violationsOf([
        root({ core_span_id: 'a', 'usage_client_identity.client_session_id': 'one', project_id: 'statgpt' }),
        root({ core_span_id: 'b', 'usage_client_identity.client_session_id': '', project_id: 'statgpt' }),
      ]),
    ).toContain(TraceInvariant.LabellingAgreesWithMarker);
  });

  test('names the trace and the property in each violation', () => {
    const [violation] = traceInvariantViolations(
      [
        root({ core_span_id: 'a', 'usage_client_identity.client_session_id': 'one', project_id: 'statgpt' }),
        root({ core_span_id: 'b', 'usage_client_identity.client_session_id': 'two', project_id: 'statgpt' }),
      ],
      'statgpt',
    );

    expect(violation.traceId).toBe(TRACE);
    expect(violation.detail).toContain('session ids');
  });
});
