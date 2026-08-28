import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ConversationEventStream from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationEventStream';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationSpanRow,
  HopEventType,
  HopTreeNode,
  ModelCallOutput,
} from '@/src/models/analytics/conversations-trace';
import { buildHopTree } from '@/src/utils/analytics/conversation-hop-stream';

const span = (overrides: Partial<ConversationSpanRow> = {}): ConversationSpanRow =>
  ({
    core_span_id: 's1',
    core_parent_span_id: null,
    event_kind: 'llm_call',
    deployment: 'gpt',
    request_uri: '/openai/deployments/gpt/chat/completions',
    response_status: 200,
    success: true,
    total_tokens: 18,
    reasoning_tokens: 0,
    deployment_price: '0.001',
    request_time: 1000,
    response_body_bytes: 4096,
    ...overrides,
  }) as ConversationSpanRow;

// A model call that answered and asked for a tool, the MCP hop answering it nested beneath, and an embedding
// alongside — the three shapes the drill-in has to read, in one turn.
const SPANS = [
  span({ core_span_id: 'model', request_time: 1000 }),
  span({
    core_span_id: 'mcp',
    core_parent_span_id: 'model',
    event_kind: 'mcp',
    mcp_method: 'tools/call',
    mcp_tool_call_name: 'rag_search',
    request_time: 2000,
  }),
  span({ core_span_id: 'embed', event_kind: 'embedding', deployment: 'text-embedding-3', request_time: 3000 }),
];

const OUTPUTS: ModelCallOutput[] = [
  {
    core_span_id: 'model',
    text: 'an answer',
    toolCalls: [{ name: 'rag_search', argumentsPreview: '{"q":"cyber"}' }],
    isUnread: false,
  },
];

const TREE = buildHopTree({ spans: SPANS, modelOutputs: OUTPUTS });

// A turn of nothing but one-event hops, so every node in it is a collapsed call.
const ONE_EVENT_TURN = buildHopTree({
  spans: [span({ core_span_id: 'embed', event_kind: 'embedding', deployment: 'text-embedding-3' })],
  modelOutputs: [],
});

const renderStream = (tree: HopTreeNode[] = TREE, onSelectSpan = vi.fn()) =>
  render(<ConversationEventStream tree={tree} selectedSpanId={null} onSelectSpan={onSelectSpan} />);

const filters = () => within(screen.getByRole('group', { name: ConversationsTraceI18nKey.StreamFilterLabel }));
const filterFor = (key: string) => filters().getByRole('button', { name: new RegExp(key) });
const rows = () => within(screen.getByRole('group', { name: ConversationsTraceI18nKey.StreamLabel }));
// A call that kept its own node and the events beneath it can carry the same label — the call is the first of
// them, since an event always renders beneath the hop that emitted it.
const rowFor = (text: RegExp) => rows().getAllByRole('button', { name: text })[0];
const expanders = () => rows().queryAllByRole('button', { name: ConversationsTraceI18nKey.TreeCollapse });

describe('ConversationEventStream', () => {
  // A hop that called another deployment is not a peer of the call it made, and an event is not a peer of the
  // hop that emitted it.
  test('renders the turn as a tree, with a hop events and the hops it called beneath it', () => {
    renderStream();

    expect(rows().getByText('an answer')).toBeInTheDocument();
    expect(rows().getAllByText('rag_search').length).toBeGreaterThan(1);
    // The answer and the tool request sit beneath the call that produced them, not beside it.
    expect(rowFor(/an answer/)).not.toBe(rowFor(/gpt/));
  });

  // The embedding hop emitted one event and nothing nests under it, so it is one row — not the call's name
  // twice, once on the hop and once on the event saying nothing the hop did not.
  test('renders a hop that emitted one event as a single row', () => {
    renderStream();

    expect(rows().getAllByText('text-embedding-3')).toHaveLength(1);
    expect(rowFor(/text-embedding-3/)).toHaveTextContent(ConversationsTraceI18nKey.EventEmbedding);
  });

  // An observability tool that opens by hiding what it recorded makes the reader's judgement for them.
  test('opens fully expanded', () => {
    renderStream();

    expect(rows().getByText('an answer')).toBeInTheDocument();
    expect(expanders().every((button) => button.getAttribute('aria-expanded') === 'true')).toBe(true);
  });

  test('collapses a node, hiding its descendants and stating that it is collapsed', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(expanders()[0]);

    expect(rows().queryByText('an answer')).toBeNull();
    expect(rows().queryAllByText('rag_search')).toHaveLength(0);
    // The embedding is a sibling of the collapsed hop, so it stays.
    expect(rows().getAllByText('text-embedding-3').length).toBeGreaterThan(0);
    expect(
      rows().getByRole('button', { name: ConversationsTraceI18nKey.TreeExpand }).getAttribute('aria-expanded'),
    ).toBe('false');
  });

  test('names the rows a collapsed control would reopen', () => {
    renderStream();

    expect(expanders()[0]).toHaveAttribute('aria-controls', expect.stringContaining('model:event:0'));
  });

  test('states each node place in the turn', () => {
    renderStream();

    expect(rowFor(/an answer/)).toHaveTextContent('2');
  });

  test('opens the hop a row stands for', async () => {
    const onSelectSpan = vi.fn();
    const user = userEvent.setup();
    renderStream(TREE, onSelectSpan);

    await user.click(rowFor(/an answer/));

    expect(onSelectSpan).toHaveBeenCalledWith('model');
  });

  test('states that a turn recorded no hops', () => {
    renderStream([]);

    expect(screen.getByText(ConversationsTraceI18nKey.TraceNoSpans)).toBeInTheDocument();
  });
});

describe('ConversationEventStream — filtering', () => {
  test('emphasises no category until the reader chooses one', () => {
    renderStream();

    expect(filterFor(ConversationsTraceI18nKey.StreamTabAll)).toHaveAttribute('aria-pressed', 'true');
    expect(filterFor(ConversationsTraceI18nKey.EventText)).toHaveAttribute('aria-pressed', 'false');
    expect(rows().queryAllByText(ConversationsTraceI18nKey.StreamMatch)).toHaveLength(0);
  });

  // The control names its category and nothing more.
  test('offers one control per category present, naming it without a count', () => {
    renderStream();

    expect(filterFor(ConversationsTraceI18nKey.EventEmbedding)).toHaveTextContent(
      ConversationsTraceI18nKey.EventEmbedding,
    );
    expect(filterFor(ConversationsTraceI18nKey.EventToolCall)).not.toHaveTextContent(/\d/);
  });

  // Under dimming a control for an absent category would dim every node and mark none, so its absence is the
  // answer to "were there any errors".
  test('offers no control for a category the turn recorded none of', () => {
    renderStream();

    expect(filters().queryByRole('button', { name: new RegExp(ConversationsTraceI18nKey.EventError) })).toBeNull();
    expect(filters().queryByRole('button', { name: new RegExp(ConversationsTraceI18nKey.EventSession) })).toBeNull();
  });

  // The tree is the answer to "what did this turn consist of": a filter that removed nodes would break the
  // structure it exists to show.
  test('marks the emphasised category and removes nothing', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.EventEmbedding));

    expect(rows().getAllByText(ConversationsTraceI18nKey.StreamMatch)).toHaveLength(1);
    expect(rows().getByText('an answer')).toBeInTheDocument();
    expect(rows().getAllByText('rag_search').length).toBeGreaterThan(1);
  });

  // Colour and opacity carry nothing to a reader who cannot perceive them, and here the dimming applies to
  // most of the screen at once.
  test('marks a match by more than the dimming of everything else', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.EventText));

    expect(rowFor(/an answer/)).toHaveTextContent(ConversationsTraceI18nKey.StreamMatch);
  });

  // Dimmed, not disabled: a reader who narrowed to errors still needs the call that came just before one.
  test('opens a de-emphasised hop as it would with no filter active', async () => {
    const onSelectSpan = vi.fn();
    const user = userEvent.setup();
    renderStream(TREE, onSelectSpan);

    await user.click(filterFor(ConversationsTraceI18nKey.EventEmbedding));
    const dimmed = rowFor(/an answer/);

    expect(dimmed).toBeEnabled();
    await user.click(dimmed);

    expect(onSelectSpan).toHaveBeenCalledWith('model');
  });

  test('releases the emphasis when the same control is activated again', async () => {
    const user = userEvent.setup();
    renderStream();
    const filter = filterFor(ConversationsTraceI18nKey.EventEmbedding);

    await user.click(filter);
    expect(filter).toHaveAttribute('aria-pressed', 'true');

    await user.click(filter);

    expect(filter).toHaveAttribute('aria-pressed', 'false');
    expect(rows().queryAllByText(ConversationsTraceI18nKey.StreamMatch)).toHaveLength(0);
  });

  test('returns to no emphasis through the separate control', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.EventEmbedding));
    await user.click(filterFor(ConversationsTraceI18nKey.StreamTabAll));

    expect(rows().queryAllByText(ConversationsTraceI18nKey.StreamMatch)).toHaveLength(0);
  });

  // The pressed state already says which filter is on, and disabling the active control drops it out of the
  // tab order — so the reader who narrowed by keyboard could not get back.
  test('disables no control, the active one included', async () => {
    const user = userEvent.setup();
    renderStream();

    const all = filterFor(ConversationsTraceI18nKey.StreamTabAll);
    expect(all).toBeEnabled();

    await user.click(filterFor(ConversationsTraceI18nKey.EventText));

    expect(filterFor(ConversationsTraceI18nKey.EventText)).toBeEnabled();
    expect(all).toBeEnabled();
  });

  // Dimming removes nothing, so a resting count could only read as the total against itself — and it is the
  // only signal assistive technology gets that the filter found anything.
  test('states the match count only while a category is emphasised', async () => {
    const user = userEvent.setup();
    renderStream();

    expect(screen.queryByText(ConversationsTraceI18nKey.StreamMatchCount)).toBeNull();

    await user.click(filterFor(ConversationsTraceI18nKey.EventText));

    expect(screen.getByRole('status')).toHaveTextContent(ConversationsTraceI18nKey.StreamMatchCount);
  });

  // A hop node with no category of its own would dim under every filter, so the call that produced the very
  // event being emphasised would fade while the event lit up.
  test('marks a collapsed call rather than dimming it when its own category is emphasised', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.EventEmbedding));

    expect(rowFor(/text-embedding-3/)).toHaveTextContent(ConversationsTraceI18nKey.StreamMatch);
  });

  test('marks the call that kept its own node when the model-call category is emphasised', async () => {
    const user = userEvent.setup();
    renderStream();

    await user.click(filterFor(ConversationsTraceI18nKey.EventModelCall));

    expect(rowFor(/gpt/)).toHaveTextContent(ConversationsTraceI18nKey.StreamMatch);
  });

  test('offers the model-call control where a call kept its own node', () => {
    renderStream();

    expect(filterFor(ConversationsTraceI18nKey.EventModelCall)).toBeEnabled();
  });

  // The category exists only because a call kept a node of its own, which a turn of one-event hops never does.
  test('offers no model-call control for a turn whose every hop collapsed', () => {
    renderStream(ONE_EVENT_TURN);

    expect(filters().queryByRole('button', { name: new RegExp(ConversationsTraceI18nKey.EventModelCall) })).toBeNull();
    expect(filterFor(ConversationsTraceI18nKey.EventEmbedding)).toBeEnabled();
  });

  // As a render-time counter this would be a standing bug waiting for the first filter.
  test('keeps every node place in the turn while a category is emphasised', async () => {
    const user = userEvent.setup();
    renderStream();
    const embeddingPosition = rowFor(/text-embedding-3/).textContent;

    await user.click(filterFor(ConversationsTraceI18nKey.EventToolCall));

    expect(rowFor(/text-embedding-3/).textContent).toBe(embeddingPosition);
  });
});

describe('ConversationEventStream — an unrecorded root', () => {
  const ORPHANED = buildHopTree({
    spans: [
      span({
        core_span_id: 'a',
        core_parent_span_id: 'never-recorded',
        event_kind: 'embedding',
        deployment: 'child-call',
        execution_path: ['deployment-name-stage', 'child-call'],
      }),
    ],
    modelOutputs: [],
  });

  test('renders the placeholder root, marked as standing for no recorded hop', () => {
    renderStream(ORPHANED);

    expect(rows().getByText('deployment-name-stage')).toBeInTheDocument();
    expect(rows().getByText(ConversationsTraceI18nKey.TraceRootNotRecorded)).toBeInTheDocument();
  });

  // There is no span to open, so it must not be offered as a control that happens to be unavailable.
  test('does not offer the placeholder as a control', () => {
    renderStream(ORPHANED);

    expect(rows().queryByRole('button', { name: /deployment-name-stage/ })).toBeNull();
    expect(rows().getAllByRole('button', { name: /child-call/ }).length).toBeGreaterThan(0);
  });
});
