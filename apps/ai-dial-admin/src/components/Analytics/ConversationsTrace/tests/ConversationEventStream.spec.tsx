import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ConversationEventStream from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationEventStream';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationSpanRow, HopTreeNode } from '@/src/models/analytics/conversations-trace';
import { buildHopTree } from '@/src/utils/analytics/conversation-span-tree';

const span = (overrides: Partial<ConversationSpanRow> = {}): ConversationSpanRow =>
  ({
    core_span_id: 's1',
    core_parent_span_id: null,
    event_kind: 'llm_call',
    deployment: 'a-model',
    request_uri: '/openai/deployments/a-model/chat/completions',
    response_status: 200,
    success: true,
    total_tokens: 18,
    number_request_messages: 3,
    deployment_price: '0.001',
    operation_duration_ms: 1200,
    request_time: 1000,
    response_body_bytes: 4096,
    ...overrides,
  }) as ConversationSpanRow;

// A model call, the MCP hop it made nested beneath, and an embedding alongside — the three shapes the
// drill-in has to read, in one turn.
const SPANS = [
  span({ core_span_id: 'model', deployment: 'a-model', request_time: 1000 }),
  span({
    core_span_id: 'mcp',
    core_parent_span_id: 'model',
    event_kind: 'mcp',
    deployment: 'a-toolset',
    mcp_method: 'tools/call',
    mcp_tool_call_name: 'a_search_tool',
    request_time: 2000,
  }),
  span({ core_span_id: 'embed', event_kind: 'embedding', deployment: 'an-embedding-model', request_time: 3000 }),
];

const TREE = buildHopTree(SPANS);

const renderStream = (tree: HopTreeNode[] = TREE, onSelectSpan = vi.fn()) =>
  render(<ConversationEventStream tree={tree} selectedSpanId={null} onSelectSpan={onSelectSpan} />);

const filters = () => within(screen.getByRole('group', { name: ConversationsTraceI18nKey.StreamFilterLabel }));
const filterFor = (key: string) => filters().getByRole('button', { name: new RegExp(key) });
const rows = () => within(screen.getByRole('group', { name: ConversationsTraceI18nKey.StreamLabel }));
const rowFor = (text: RegExp) => rows().getByRole('button', { name: text });
const expanders = () => rows().queryAllByRole('button', { name: ConversationsTraceI18nKey.TreeCollapse });

describe('ConversationEventStream', () => {
  test('renders one row per recorded hop', () => {
    renderStream();

    expect(rows().getAllByRole('button', { name: /a-model|a-toolset|an-embedding-model/ })).toHaveLength(3);
  });

  test('names each row by the deployment that did the work', () => {
    renderStream();

    expect(rowFor(/a-model/)).toBeInTheDocument();
    expect(rowFor(/a-toolset/)).toBeInTheDocument();
    expect(rowFor(/an-embedding-model/)).toBeInTheDocument();
  });

  test('states what an MCP hop did beside the server that did it', () => {
    renderStream();

    expect(rowFor(/a-toolset/)).toHaveAccessibleName(/a_search_tool/);
  });

  test('states no row for content decoded from a hop body', () => {
    renderStream();

    expect(rows().queryByRole('button', { name: /an answer/ })).toBeNull();
  });

  test('states each row kind in words', () => {
    renderStream();

    expect(rowFor(/a-model/)).toHaveAccessibleName(new RegExp(ConversationsTraceI18nKey.SpanLlm));
    expect(rowFor(/a-toolset/)).toHaveAccessibleName(new RegExp(ConversationsTraceI18nKey.SpanMcp));
    expect(rowFor(/an-embedding-model/)).toHaveAccessibleName(new RegExp(ConversationsTraceI18nKey.SpanEmbeddings));
  });

  test('opens fully expanded', () => {
    renderStream();

    expect(expanders()).toHaveLength(1);
    expect(expanders()[0]).toHaveAttribute('aria-expanded', 'true');
  });

  // Programmatic, not visual: the control names the rows it governs, so the relationship survives for a
  // reader who cannot see the indentation.
  test('the expand control names the rows it governs while they are shown', () => {
    renderStream();

    const controlled = expanders()[0].getAttribute('aria-controls');
    expect(controlled).toBeTruthy();
    expect(document.getElementById(controlled as string)).toBeTruthy();
  });

  test('collapsing a row hides its descendants and states the collapsed state', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(expanders()[0]);

    expect(rows().queryByRole('button', { name: /a-toolset/ })).toBeNull();
    expect(
      rows().getByRole('button', { name: ConversationsTraceI18nKey.TreeExpand }).getAttribute('aria-expanded'),
    ).toBe('false');
  });

  test('selecting a row reports the hop it stands for', async () => {
    const user = userEvent.setup();
    const onSelectSpan = vi.fn();
    renderStream(TREE, onSelectSpan);

    await user.click(rowFor(/an-embedding-model/));

    expect(onSelectSpan).toHaveBeenCalledOnce();
    expect(onSelectSpan).toHaveBeenCalledWith('embed');
  });

  test('marks the selected row as current', () => {
    render(<ConversationEventStream tree={TREE} selectedSpanId="embed" onSelectSpan={vi.fn()} />);

    expect(rowFor(/an-embedding-model/)).toHaveAttribute('aria-current', 'true');
  });

  test('states that nothing was recorded for a turn with no hops', () => {
    renderStream([]);

    expect(screen.getByText(ConversationsTraceI18nKey.TraceNoSpans)).toBeInTheDocument();
  });
});

describe('ConversationEventStream — figures', () => {
  test('states tokens and request messages for a hop that metered its own', () => {
    renderStream();

    expect(rowFor(/a-model/)).toHaveAccessibleName(new RegExp(ConversationsTraceI18nKey.SpanTokens));
    expect(rowFor(/a-model/)).toHaveAccessibleName(new RegExp(ConversationsTraceI18nKey.SpanRequestMessages));
  });

  // The failure this rule exists to prevent: an application hop leading with `0 tok` and a dash.
  test('states the chain cost for a hop that metered nothing of its own, and no token count', () => {
    const tree = buildHopTree([
      span({
        core_span_id: 'app',
        deployment: 'an-application',
        total_tokens: 0,
        deployment_price: null,
        total_price: '0.0375',
      }),
    ]);
    renderStream(tree);

    expect(rowFor(/an-application/)).toHaveAccessibleName(new RegExp(ConversationsTraceI18nKey.SpanChainCost));
    expect(rowFor(/an-application/)).not.toHaveAccessibleName(new RegExp(ConversationsTraceI18nKey.SpanTokens));
  });

  test('states a reported duration', () => {
    renderStream(buildHopTree([span({ core_span_id: 'm', deployment: 'a-model', operation_duration_ms: 2500 })]));

    expect(rowFor(/a-model/)).toHaveAccessibleName(/2\.5s/);
  });

  // Recorded hop durations start at single-digit milliseconds, which conversation-scale formatting rendered
  // as `0s` — the one reading the zero rule exists to prevent.
  test('states a sub-second duration in milliseconds rather than as zero seconds', () => {
    renderStream(buildHopTree([span({ core_span_id: 'm', deployment: 'a-model', operation_duration_ms: 15 })]));

    expect(rowFor(/a-model/)).toHaveAccessibleName(/15ms/);
    expect(rowFor(/a-model/)).not.toHaveAccessibleName(/0s/);
  });

  // A model call can record zero tokens, no price of its own and no chain price. The row then has its name,
  // its kind and its duration, and no second line at all.
  test('states no figures for a hop that metered nothing and spent nothing', () => {
    const tree = buildHopTree([
      span({ core_span_id: 'm', deployment: 'a-model', total_tokens: 0, deployment_price: null, total_price: null }),
    ]);
    renderStream(tree);

    expect(rowFor(/a-model/)).not.toHaveAccessibleName(new RegExp(ConversationsTraceI18nKey.SpanTokens));
    expect(rowFor(/a-model/)).not.toHaveAccessibleName(new RegExp(ConversationsTraceI18nKey.SpanChainCost));
  });

  // A producer predating the field stores zero for "not reported", so the two cannot be told apart. Matched
  // on the formatter's own shape — a number carrying a unit — because a bare `0` also appears in the cost.
  test('states no duration for a hop reporting zero', () => {
    renderStream(buildHopTree([span({ core_span_id: 'm', deployment: 'a-model', operation_duration_ms: 0 })]));

    expect(rowFor(/a-model/)).not.toHaveAccessibleName(/\d+(\.\d+)?(s|m|h)\b/);
  });
});

describe('ConversationEventStream — the kind axis', () => {
  test('offers a control for each kind the turn recorded and no other', () => {
    renderStream();

    expect(filterFor(ConversationsTraceI18nKey.SpanLlm)).toBeInTheDocument();
    expect(filterFor(ConversationsTraceI18nKey.SpanMcp)).toBeInTheDocument();
    expect(filterFor(ConversationsTraceI18nKey.SpanEmbeddings)).toBeInTheDocument();
    expect(filters().queryByRole('button', { name: new RegExp(ConversationsTraceI18nKey.SpanRoute) })).toBeNull();
    expect(filters().queryByRole('button', { name: new RegExp(ConversationsTraceI18nKey.SpanRating) })).toBeNull();
  });

  test('starts with no kind emphasised and no match count', () => {
    renderStream();

    expect(filterFor(ConversationsTraceI18nKey.StreamTabAll)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status').textContent).toBe('');
  });

  test('emphasising a kind marks its rows, keeps every row, and announces the count', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.SpanMcp));

    expect(filterFor(ConversationsTraceI18nKey.SpanMcp)).toHaveAttribute('aria-pressed', 'true');
    expect(rows().getAllByText(ConversationsTraceI18nKey.StreamMatch)).toHaveLength(1);
    expect(rows().getByRole('button', { name: /a-model/ })).toBeInTheDocument();
    expect(screen.getByRole('status').textContent).toBe(ConversationsTraceI18nKey.StreamMatchCount);
  });

  test('the separate control returns to no emphasis', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.SpanMcp));
    await user.click(filterFor(ConversationsTraceI18nKey.StreamTabAll));

    expect(filterFor(ConversationsTraceI18nKey.StreamTabAll)).toHaveAttribute('aria-pressed', 'true');
    expect(rows().queryAllByText(ConversationsTraceI18nKey.StreamMatch)).toHaveLength(0);
    expect(screen.getByRole('status').textContent).toBe('');
  });

  test('activating the emphasised control again returns to no emphasis', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.SpanMcp));
    await user.click(filterFor(ConversationsTraceI18nKey.SpanMcp));

    expect(rows().queryAllByText(ConversationsTraceI18nKey.StreamMatch)).toHaveLength(0);
    expect(screen.getByRole('status').textContent).toBe('');
  });

  test('a de-emphasised row can still be opened', async () => {
    const user = userEvent.setup();
    const onSelectSpan = vi.fn();
    renderStream(TREE, onSelectSpan);

    await user.click(filterFor(ConversationsTraceI18nKey.SpanMcp));
    await user.click(rowFor(/an-embedding-model/));

    expect(onSelectSpan).toHaveBeenCalledWith('embed');
  });

  test('no control is disabled, including the active one', () => {
    renderStream();

    for (const control of filters().getAllByRole('button')) {
      expect(control).not.toBeDisabled();
    }
  });

  test('offers a Route control for a turn that recorded a route hop', () => {
    const tree = buildHopTree([
      span({
        core_span_id: 'r',
        event_kind: 'route',
        deployment: 'a-retrieval-app',
        request_uri: '/v1/x/route/search',
      }),
    ]);
    renderStream(tree);

    expect(filterFor(ConversationsTraceI18nKey.SpanRoute)).toBeInTheDocument();
  });

  test('offers a Rating control for a rating trace', () => {
    const tree = buildHopTree([
      span({ core_span_id: 'rate', event_kind: '', deployment: 'a-model', request_uri: '/v1/a-model/rate' }),
    ]);
    renderStream(tree);

    expect(filterFor(ConversationsTraceI18nKey.SpanRating)).toBeInTheDocument();
  });
});

describe('ConversationEventStream — the outcome axis', () => {
  const FAILED_TURN = buildHopTree([
    span({ core_span_id: 'model', deployment: 'a-model', request_time: 1000, success: false }),
    span({ core_span_id: 'embed', event_kind: 'embedding', deployment: 'an-embedding-model', request_time: 2000 }),
  ]);

  test('offers a Failed control when the turn recorded a failure', () => {
    renderStream(FAILED_TURN);

    expect(filterFor(ConversationsTraceI18nKey.EventFailed)).toBeInTheDocument();
  });

  // A control the turn has nothing for would dim every row and mark none.
  test('offers none when nothing failed', () => {
    renderStream(TREE);

    expect(filters().queryByRole('button', { name: new RegExp(ConversationsTraceI18nKey.EventFailed) })).toBeNull();
  });

  test('a failed row keeps its kind and carries the failure marker', () => {
    renderStream(FAILED_TURN);

    expect(rowFor(/a-model/)).toHaveAccessibleName(new RegExp(ConversationsTraceI18nKey.SpanLlm));
    expect(rowFor(/a-model/)).toHaveAccessibleName(new RegExp(ConversationsTraceI18nKey.SpanFailedMarker));
  });

  test('the failure marker does not depend on emphasis', () => {
    renderStream(FAILED_TURN);

    expect(rows().getByText(ConversationsTraceI18nKey.SpanFailedMarker)).toBeInTheDocument();
  });

  test('emphasising Failed marks the failed row whatever its kind', async () => {
    const user = userEvent.setup();
    renderStream(FAILED_TURN);

    await user.click(filterFor(ConversationsTraceI18nKey.EventFailed));

    expect(rows().getAllByText(ConversationsTraceI18nKey.StreamMatch)).toHaveLength(1);
  });
});

describe('ConversationEventStream — an unrecorded root', () => {
  const ORPHANED = buildHopTree([
    span({
      core_span_id: 'child',
      core_parent_span_id: 'never-recorded',
      deployment: 'a-model',
      execution_path: ['an-entry-point', 'a-model'],
    }),
  ]);

  test('renders the placeholder and states that it was not recorded', () => {
    renderStream(ORPHANED);

    expect(rows().getByText(ConversationsTraceI18nKey.TraceRootNotRecorded)).toBeInTheDocument();
  });

  test('the placeholder cannot be opened', () => {
    renderStream(ORPHANED);

    expect(rows().queryByRole('button', { name: /an-entry-point/ })).toBeNull();
  });

  test('the turn real work renders beneath it', () => {
    renderStream(ORPHANED);

    expect(rows().getByRole('button', { name: /a-model/ })).toBeInTheDocument();
  });
});
