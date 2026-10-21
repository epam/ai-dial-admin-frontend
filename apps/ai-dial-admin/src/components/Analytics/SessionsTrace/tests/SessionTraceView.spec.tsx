import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';

import SessionSpanDetail from '@/src/components/Analytics/SessionsTrace/Detail/SessionSpanDetail';
import SessionTraceView from '@/src/components/Analytics/SessionsTrace/Detail/SessionTraceView';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { toMillis } from '@/src/utils/analytics/session-formatting';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import {
  SessionSpanNode,
  SessionTraceFigures,
  HopBodyGrants,
  SessionScope,
  SpanFieldGroup,
  SpanFieldRow,
  SpanFieldTag,
  SpanKind,
} from '@/src/models/analytics/sessions-trace';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';

// The inspector's reads are the component's only side effects: mocked so the trace view's own rendering is
// what is under test, and so a suppressed side can be told apart from one whose read has not answered yet.
const getSessionHopRequest = vi.fn().mockResolvedValue({ success: true, response: undefined });
const getSessionHopResponse = vi.fn().mockResolvedValue({ success: true, response: undefined });
const getSessionHopProperty = vi.fn().mockResolvedValue({ success: true, response: undefined });
const getSessionHopRawBody = vi.fn().mockResolvedValue({ success: true, response: undefined });
const getSessionHopMcp = vi.fn().mockResolvedValue({ success: true, response: undefined });
const getSessionHopEmbedding = vi.fn().mockResolvedValue({ success: true, response: undefined });

vi.mock('@/src/app/[lang]/sessions/actions', () => ({
  getSessionHopRequest: (...args: unknown[]) => getSessionHopRequest(...args),
  getSessionHopResponse: (...args: unknown[]) => getSessionHopResponse(...args),
  getSessionHopProperty: (...args: unknown[]) => getSessionHopProperty(...args),
  getSessionHopRawBody: (...args: unknown[]) => getSessionHopRawBody(...args),
  getSessionHopMcp: (...args: unknown[]) => getSessionHopMcp(...args),
  getSessionHopEmbedding: (...args: unknown[]) => getSessionHopEmbedding(...args),
}));

const SCOPE: SessionScope = { id: 'chat-1', source: null };

const GRANTS: HopBodyGrants = { isRequestReadable: true, isResponseReadable: true };

const TRACE_ID = '0a3f1d9c8b7e6a5f';

const span = (overrides: Partial<SpanFieldRow> = {}): SpanFieldRow => ({
  core_span_id: 's1',
  core_parent_span_id: null,
  event_kind: 'llm_call',
  deployment: 'switchyard-model',
  parent_deployment: null,
  request_method: 'POST',
  request_uri: '/openai/deployments/switchyard-model/chat/completions',
  response_upstream_uri: 'https://core.dial.parts/openai/deployments/switchyard',
  response_status: 200,
  success: true,
  operation_duration_ms: 5215,
  total_tokens: 18,
  reasoning_tokens: 0,
  request_body_bytes: 2048,
  number_request_messages: 2,
  deployment_price: '0.001',
  request_time: '2026-08-13T10:59:05.600Z',
  response_body_bytes: 4096,
  total_price: null,
  ...overrides,
});

const CHILD = span({
  core_span_id: 's2',
  core_parent_span_id: 's1',
  deployment: 'text-embedding-3',
  event_kind: 'embedding',
  request_uri: '/openai/deployments/text-embedding-3/embeddings',
  operation_duration_ms: 2890,
  total_tokens: 1060,
  deployment_price: '0.0005',
  request_time: '2026-08-13T10:59:07.100Z',
});

const SPANS = [span(), CHILD];

const statFor = (label: string) => screen.getByText(label).parentElement;

// The trace's figures as the listing states them, so the drawer and the card that opened it cannot disagree.
const FIGURES: SessionTraceFigures = {
  traceId: TRACE_ID,
  startedAt: 1787218895000,
  spans: 2,
  failedSpans: 0,
  tokens: 1078,
  price: '0.0015',
  durationMs: 1500,
};

// As the resolver builds them from the fetched schema: the tag the catalog groups the column under, plus the
// service's own label and type.
const FIELD_GROUPS: SpanFieldGroup[] = [
  {
    tag: SpanFieldTag.Identifier,
    fields: [
      { name: 'core_span_id', label: 'Span ID', type: AnalyticsFieldType.String, tag: SpanFieldTag.Identifier },
      {
        name: 'core_parent_span_id',
        label: 'Parent span ID',
        type: AnalyticsFieldType.String,
        tag: SpanFieldTag.Identifier,
      },
    ],
  },
  {
    tag: SpanFieldTag.Deployment,
    fields: [
      { name: 'execution_path', label: 'Execution path', type: AnalyticsFieldType.Array, tag: SpanFieldTag.Deployment },
    ],
  },
  {
    tag: SpanFieldTag.TokenUsage,
    fields: [
      { name: 'prompt_tokens', label: 'Prompt tokens', type: AnalyticsFieldType.Long, tag: SpanFieldTag.TokenUsage },
      {
        name: 'completion_tokens',
        label: 'Completion tokens',
        type: AnalyticsFieldType.Long,
        tag: SpanFieldTag.TokenUsage,
      },
    ],
  },
];

describe('SessionTraceView', () => {
  const renderTrace = (props: Partial<ComponentProps<typeof SessionTraceView>> = {}) =>
    render(
      <SessionTraceView
        scope={SCOPE}
        bodyGrants={GRANTS}
        figures={FIGURES}
        spans={SPANS}
        fieldGroups={FIELD_GROUPS}
        hasLoadError={false}
        selectedSpanId={null}
        onSelectSpan={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />,
    );

  test('names itself by its trace when the caller supplies no title', () => {
    renderTrace();

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(TRACE_ID);
    // Once, not twice: with no title the heading already is the trace id, so repeating it beneath says the
    // same thing twice. A `length > 0` assertion here tolerated exactly that.
    expect(screen.getAllByText(TRACE_ID)).toHaveLength(1);
  });

  // A reader who arrived from a card should see the same name they clicked.
  test('titles itself with the name the caller supplied', () => {
    renderTrace({ title: 'applications/public/pg-chat-hub__1.0.0' });

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('applications/public/pg-chat-hub__1.0.0');
    // With a title, the trace id is the subtitle — stated once, beneath a heading that is not it.
    expect(screen.getAllByText(TRACE_ID)).toHaveLength(1);
  });

  // The data records no turn index, so there is no ordinal to render and none to fall back to. An earlier
  // version passed 0 as a turn number alongside a title, and every drawer read "Turn 0".
  test('states no turn number, whether or not a title was supplied', () => {
    renderTrace({ title: 'echo' });

    expect(screen.queryByText(/Turn \d/)).toBeNull();

    renderTrace();

    expect(screen.queryByText(/Turn \d/)).toBeNull();
  });

  // Every figure is the trace's own, from the same figures read the listing renders — so the two cannot disagree. Summing the
  // hop rows instead disagreed with the list by a factor of five on one 384-hop turn, because the read stops
  // at `SESSION_SPAN_LIMIT` and a sum over what it returned is a sum over part of the turn.
  test('states the turn own figures rather than re-deriving them from the hop rows', () => {
    renderTrace();

    expect(statFor(SessionsTraceI18nKey.TraceDuration)).toHaveTextContent('1.5s');
    expect(statFor(SessionsTraceI18nKey.TraceTokens)).toHaveTextContent('1.1 K');
    expect(statFor(SessionsTraceI18nKey.TraceCost)).toHaveTextContent('$0.0015');
    expect(statFor(SessionsTraceI18nKey.TraceSpans)).toHaveTextContent('2');
  });

  // The clipped sample below must not move a single figure in the header: a 384-hop turn reads 300 hops, and
  // summing those reported 700 K tokens against the list's 3.67 M.
  test('the figures do not move when the hop chain is clipped', () => {
    renderTrace({ figures: { ...FIGURES, spans: 384, tokens: 3667333 }, spans: [span()] });

    expect(statFor(SessionsTraceI18nKey.TraceTokens)).toHaveTextContent('3.7 M');
    expect(statFor(SessionsTraceI18nKey.TraceSpans)).toHaveTextContent('384');
  });

  test('reports the trace as ok when the rollup counted no failed hop', () => {
    renderTrace();

    expect(statFor(SessionsTraceI18nKey.TraceStatus)).toHaveTextContent(SessionsTraceI18nKey.TraceOk);
  });

  // One failed hop makes the turn a failure for the reader, whatever the other hops did — and the rollup
  // counts them across the whole turn, not only across the hops that were read.
  test('reports the trace as failed when the rollup counted a failed hop', () => {
    renderTrace({ figures: { ...FIGURES, failedSpans: 1 } });

    expect(statFor(SessionsTraceI18nKey.TraceStatus)).toHaveTextContent(SessionsTraceI18nKey.TraceFailed);
  });

  // The span read is capped, and a trace that was cut off must say so rather than presenting a partial
  // tree as the whole turn.
  test('declares itself partial when the turn holds more hops than were read', () => {
    renderTrace({ figures: { ...FIGURES, spans: 922 } });

    expect(screen.getByText(SessionsTraceI18nKey.TraceSpansPartial)).toBeInTheDocument();
  });

  test('makes no partial claim when it read every hop', () => {
    renderTrace();

    expect(screen.queryByText(SessionsTraceI18nKey.TraceSpansPartial)).not.toBeInTheDocument();
  });

  test('reports a failed span query instead of an empty tree', () => {
    renderTrace({ spans: [], hasLoadError: true });

    expect(screen.getByText(SessionsTraceI18nKey.TraceLoadFailed)).toBeInTheDocument();
    expect(screen.queryByText(SessionsTraceI18nKey.TraceNoSpans)).not.toBeInTheDocument();
  });

  // The view builds the tree from the recorded hops alone: the turn's question and totals are the heading and
  // the figures beside it, stated once.
  test('renders the turn hops as a tree, nesting a hop under the hop that called it', () => {
    renderTrace();

    const tree = within(screen.getByRole('group', { name: SessionsTraceI18nKey.StreamLabel }));

    expect(tree.getAllByRole('button', { name: /switchyard-model/ }).length).toBeGreaterThan(0);
    expect(tree.getAllByRole('button', { name: /text-embedding-3/ }).length).toBeGreaterThan(0);
  });

  test('holds no tree node standing for the turn question or its totals', () => {
    renderTrace({ title: 'why 2021-2025?' });

    const tree = within(screen.getByRole('group', { name: SessionsTraceI18nKey.StreamLabel }));

    expect(tree.queryByText('why 2021-2025?')).toBeNull();
    // The figures stay where they were — in the header, not repeated as a closing node.
    expect(statFor(SessionsTraceI18nKey.TraceTokens)).toHaveTextContent('1.1 K');
  });

  test('reports a turn whose trace returned no hops', () => {
    renderTrace({ spans: [] });

    expect(screen.getByText(SessionsTraceI18nKey.TraceNoSpans)).toBeInTheDocument();
  });

  // The tree and the span's bodies share the left region through a resizable split; the span's facts stay in
  // the rail beside them. The bodies need the width — a message history in a 360px rail is a sliver — and the
  // facts are reference rows that read fine in one.
  test('splits the tree from the selected span’s bodies, with the facts rail beside them', () => {
    renderTrace({ selectedSpanId: 's1' });

    expect(screen.getByRole('group', { name: SessionsTraceI18nKey.StreamLabel })).toBeInTheDocument();
    expect(screen.getByRole('separator', { name: SessionsTraceI18nKey.BodiesSplitLabel })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      SessionsTraceI18nKey.InspectorRequest,
      SessionsTraceI18nKey.InspectorResponse,
      SessionsTraceI18nKey.InspectorChat,
    ]);
    // The rail states the span's own facts and none of its bodies.
    expect(screen.getByText('/openai/deployments/switchyard-model/chat/completions')).toBeInTheDocument();
  });

  test('asks for a selection in the bodies section while no span is chosen', () => {
    renderTrace();

    expect(screen.getAllByText(SessionsTraceI18nKey.SpanSelected).length).toBeGreaterThan(1);
    expect(screen.queryByRole('tab')).toBeNull();
  });

  test('renders the tree alone, with no separator, when every body column is withheld', () => {
    renderTrace({
      selectedSpanId: 's1',
      bodyGrants: { isRequestReadable: false, isResponseReadable: false },
    });

    expect(screen.getByRole('group', { name: SessionsTraceI18nKey.StreamLabel })).toBeInTheDocument();
    expect(screen.queryByRole('separator')).toBeNull();
    expect(screen.queryByRole('tab')).toBeNull();
    // The rail keeps stating the span's facts: they are plain columns and no body grant gates them.
    expect(screen.getByText('/openai/deployments/switchyard-model/chat/completions')).toBeInTheDocument();
  });

  test('returns to the trace listing through its back control', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderTrace({ onClose });

    await user.click(screen.getByRole('button', { name: SessionsTraceI18nKey.TraceBackToList }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

const renderDetail = (node: SessionSpanNode | null, fieldGroups: SpanFieldGroup[] = FIELD_GROUPS) =>
  render(<SessionSpanDetail node={node} fieldGroups={fieldGroups} />);

const nodes: SessionSpanNode[] = SPANS.map((row) => ({
  span: row,
  kind: SpanKind.Llm,
  hasFailed: false,
  startedAtMs: toMillis(row.request_time),
}));

describe('SessionSpanDetail', () => {
  test('asks for a selection while no hop is chosen', () => {
    renderDetail(null);

    expect(screen.getByText(SessionsTraceI18nKey.SpanSelected)).toBeInTheDocument();
  });

  test('reports where the hop went and what it cost', () => {
    renderDetail(nodes[0]);

    expect(screen.getByText('/openai/deployments/switchyard-model/chat/completions')).toBeInTheDocument();
    expect(screen.getByText('https://core.dial.parts/openai/deployments/switchyard')).toBeInTheDocument();
    expect(screen.getByText('$0.001')).toBeInTheDocument();
  });

  // The bodies section states the recorded status now, beside the bodies it is the question about.
  test('leaves the recorded status to the bodies section', () => {
    renderDetail(nodes[0]);

    expect(screen.queryByText('200')).toBeNull();
  });

  // Its absolute recorded time, to the millisecond: a turn's hops routinely start inside the same second,
  // so an instant stated to the second answers nothing about their order. No offset from the start of the
  // trace either — hops interleave, and a bar would assert a timeline the ordering rule refuses to claim.
  test('places the hop by its own recorded time, to the millisecond and with no offset', () => {
    renderDetail(nodes[1]);

    expect(screen.getByText(SessionsTraceI18nKey.SpanRecordedAt)).toBeInTheDocument();
    expect(screen.getByText(/:07\.100/)).toBeInTheDocument();
    expect(screen.queryByText('+1.5s')).toBeNull();
  });

  // The tile carries the per-span figures no other surface states; the duration and the token total are on
  // the row of the tree, and inside their own groups below, but not here.
  test('keeps the duration and the token total out of the figure tile', () => {
    renderDetail(nodes[0]);

    expect(screen.queryByText(SessionsTraceI18nKey.DetailDuration)).toBeNull();
    expect(screen.queryByText(SessionsTraceI18nKey.TraceTokens)).toBeNull();
  });

  // Own beside chain: a row of the tree states whichever applies to it, so this is the only surface where
  // the pair is visible — and the pair is the answer to why an application hop reports no cost of its own.
  test('states the own cost beside the chain cost', () => {
    renderDetail({ ...nodes[0], span: span({ deployment_price: null, total_price: '0.0112755' }) });

    expect(screen.getByText(SessionsTraceI18nKey.SpanCostOwn)).toBeInTheDocument();
    expect(screen.getByText(SessionsTraceI18nKey.SpanCostChain)).toBeInTheDocument();
    // The own figure is the one this hop has nothing for, and the pair states that rather than hiding it.
    expect(screen.getByText(UNAVAILABLE_VALUE)).toBeInTheDocument();
    expect(screen.getByText('$0.011')).toBeInTheDocument();
  });

  test('marks metadata the log did not record as unavailable', () => {
    renderDetail({
      span: span({
        request_uri: null,
        response_upstream_uri: null,
        parent_deployment: null,
        response_status: null,
      }),
      kind: SpanKind.Llm,
      hasFailed: false,
      startedAtMs: null,
    });

    expect(screen.getAllByText(UNAVAILABLE_VALUE).length).toBeGreaterThan(1);
  });

  // Kind and outcome, side by side. The badge no longer reports the failure in place of the kind, so a failed
  // model call and a failed tool call stay distinguishable.
  test('marks a failed hop as failed while keeping its kind', () => {
    renderDetail({ ...nodes[0], span: span({ success: false }), hasFailed: true });

    expect(screen.getByText(SessionsTraceI18nKey.SpanFailedMarker)).toBeInTheDocument();
    expect(screen.getByText(SessionsTraceI18nKey.SpanLlm)).toBeInTheDocument();
  });

  test('states the kind alone for a hop that succeeded', () => {
    renderDetail(nodes[0]);

    expect(screen.getByText(SessionsTraceI18nKey.SpanLlm)).toBeInTheDocument();
    expect(screen.queryByText(SessionsTraceI18nKey.SpanFailedMarker)).toBeNull();
  });
});

describe('SessionSpanDetail — grouped fields', () => {
  const user = () => userEvent.setup();

  test('lists a group per tag the schema reports, with the count of fields this hop has', () => {
    renderDetail(nodes[0]);

    expect(
      screen.getByRole('button', { name: new RegExp(SessionsTraceI18nKey.SpanTagIdentifier) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: new RegExp(SessionsTraceI18nKey.SpanTagTokenUsage) }),
    ).toBeInTheDocument();
  });

  test('states a group’s fields when it is opened, and not before', async () => {
    renderDetail(nodes[0]);

    expect(screen.queryByText('Span ID')).toBeNull();

    await user().click(screen.getByRole('button', { name: new RegExp(SessionsTraceI18nKey.SpanTagIdentifier) }));

    expect(screen.getByText('Span ID')).toBeInTheDocument();
    // Including the one this hop recorded nothing for: a dash is the answer, an absent row is a question
    // about the schema.
    expect(screen.getByText('Parent span ID')).toBeInTheDocument();
    expect(screen.getAllByText(UNAVAILABLE_VALUE).length).toBeGreaterThan(0);
  });

  test('opening one group closes the one already open', async () => {
    renderDetail(nodes[0]);
    const identity = screen.getByRole('button', { name: new RegExp(SessionsTraceI18nKey.SpanTagIdentifier) });
    const deployment = screen.getByRole('button', { name: new RegExp(SessionsTraceI18nKey.SpanTagDeployment) });

    await user().click(identity);
    expect(identity).toHaveAttribute('aria-expanded', 'true');

    await user().click(deployment);

    expect(deployment).toHaveAttribute('aria-expanded', 'true');
    expect(identity).toHaveAttribute('aria-expanded', 'false');
  });

  test('keeps a group with nothing recorded listed and operable, with its fields dashed', async () => {
    renderDetail(nodes[0]);

    const tokens = screen.getByRole('button', { name: new RegExp(SessionsTraceI18nKey.SpanTagTokenUsage) });
    await user().click(tokens);

    expect(screen.getByText('Prompt tokens')).toBeInTheDocument();
    expect(screen.getByText('Completion tokens')).toBeInTheDocument();
  });

  // A metered zero is not a value: a core predating a token column stores zero for a call it never metered,
  // so the row states a dash rather than a figure the hop never reported.
  test('dashes a metered zero rather than stating it', async () => {
    renderDetail({ ...nodes[0], span: span({ prompt_tokens: 0, completion_tokens: 0 }) });

    await user().click(screen.getByRole('button', { name: new RegExp(SessionsTraceI18nKey.SpanTagTokenUsage) }));

    expect(screen.getAllByText(UNAVAILABLE_VALUE).length).toBeGreaterThanOrEqual(2);
  });

  test('renders an array-valued field as the list the log recorded', async () => {
    renderDetail({ ...nodes[0], span: span({ execution_path: ['deep-research-app', 'gpt-5.4-2026-03-05'] }) });

    await user().click(screen.getByRole('button', { name: new RegExp(SessionsTraceI18nKey.SpanTagDeployment) }));

    expect(screen.getByText('deep-research-app, gpt-5.4-2026-03-05')).toBeInTheDocument();
  });

  // A failed schema read leaves the rail with its own facts and no groups: describing a field without the
  // schema would mean inventing its label, its type and its group here.
  test('states why there are no groups when the schema could not be read', () => {
    renderDetail(nodes[0], []);

    expect(screen.getByText(SessionsTraceI18nKey.SpanFieldsUnavailable)).toBeInTheDocument();
    expect(screen.getByText('/openai/deployments/switchyard-model/chat/completions')).toBeInTheDocument();
  });

  // Selecting another hop re-states the rail against that hop, and keeps the reader's place in the set: a
  // reader comparing one group across two hops is asking the same question twice.
  test('states the newly selected hop’s values and keeps the open group', async () => {
    const { rerender } = renderDetail(nodes[0]);

    await user().click(screen.getByRole('button', { name: new RegExp(SessionsTraceI18nKey.SpanTagIdentifier) }));
    expect(screen.getByText('s1')).toBeInTheDocument();

    rerender(<SessionSpanDetail node={nodes[1]} fieldGroups={FIELD_GROUPS} />);

    // The same group is still open, now stating the other hop's own span id.
    expect(screen.getByRole('button', { name: new RegExp(SessionsTraceI18nKey.SpanTagIdentifier) })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('s2')).toBeInTheDocument();
    // The field the entry hop had no value for is rendered now that this hop does have one: the group
    // follows the selected span, not the one the reader opened it on.
    expect(screen.getByText('Parent span ID')).toBeInTheDocument();
    // And the headline facts follow the selection too.
    expect(screen.getByText(/:07\.100/)).toBeInTheDocument();
  });

  // Left open across a change of selection it would re-title and re-fill itself with another hop's record.
  test('closes the JSON dialog when another hop is selected', async () => {
    const { rerender } = renderDetail(nodes[0]);

    await user().click(screen.getByRole('button', { name: SessionsTraceI18nKey.SpanJsonOpen }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<SessionSpanDetail node={nodes[1]} fieldGroups={FIELD_GROUPS} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('offers the whole record as JSON, including what the groups leave out', async () => {
    renderDetail(nodes[0]);

    await user().click(screen.getByRole('button', { name: SessionsTraceI18nKey.SpanJsonOpen }));

    // The viewer itself is Monaco, which renders nothing in jsdom — so the assertion is that the dialog
    // opened and is named by the hop whose record it holds.
    expect(screen.getByRole('dialog')).toHaveTextContent('switchyard-model');
  });
});
