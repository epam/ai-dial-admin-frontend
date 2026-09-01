import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import HopInspector from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopInspector';
import { NO_CLAMP } from '@/src/utils/analytics/hop-inspector/envelope';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationSpanRow,
  ConversationTranscriptAvailability,
  HopDialect,
  HopReadState,
  HopRequestEnvelope,
  MessageRole,
  HopToolCall,
  SessionScope,
  SpanKind,
} from '@/src/models/analytics/conversations-trace';

const getConversationHopRequest = vi.fn();
const getConversationHopResponse = vi.fn();
const getConversationHopMessage = vi.fn();
const getConversationHopRawBody = vi.fn();
const getConversationHopMcp = vi.fn();
const getConversationHopEmbedding = vi.fn();

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversationHopRequest: (...args: unknown[]) => getConversationHopRequest(...args),
  getConversationHopResponse: (...args: unknown[]) => getConversationHopResponse(...args),
  getConversationHopMessage: (...args: unknown[]) => getConversationHopMessage(...args),
  getConversationHopRawBody: (...args: unknown[]) => getConversationHopRawBody(...args),
  getConversationHopMcp: (...args: unknown[]) => getConversationHopMcp(...args),
  getConversationHopEmbedding: (...args: unknown[]) => getConversationHopEmbedding(...args),
}));

const SCOPE: SessionScope = { id: 'chat-1', source: null };

const GRANTS: ConversationTranscriptAvailability = {
  isReadable: true,
  isRequestReadable: true,
  isResponseReadable: true,
};

const span = (overrides: Partial<ConversationSpanRow> = {}): ConversationSpanRow => ({
  core_span_id: 's1',
  core_parent_span_id: null,
  event_kind: 'llm_call',
  deployment: 'gpt',
  parent_deployment: null,
  request_method: 'POST',
  request_uri: '/openai/deployments/gpt/chat/completions',
  response_upstream_uri: null,
  response_status: 200,
  success: true,
  operation_duration_ms: 100,
  total_tokens: 18,
  deployment_price: '0.001',
  request_time: 1000,
  response_body_bytes: 4096,
  request_body_bytes: 2048,
  number_request_messages: 2,
  reasoning_tokens: null,
  ...overrides,
});

const message = (
  index: number,
  role: MessageRole,
  text: string | null,
  bytes = 100,
  toolCalls: HopToolCall[] = [],
) => ({
  index,
  role,
  bytes,
  text,
  toolCalls,
  isTextClamped: false,
  isLarge: bytes >= 1024,
});

const envelope = (overrides: Partial<HopRequestEnvelope> = {}): HopRequestEnvelope => ({
  state: HopReadState.Available,
  dialect: HopDialect.ChatCompletions,
  params: {
    stated: [
      { name: 'temperature', value: '0' },
      { name: 'max_tokens', value: '1024' },
      { name: 'tools', value: null },
      { name: 'stream', value: 'true' },
    ],
    unrecognisedCount: 2,
  },
  messages: [message(0, MessageRole.System, 'Ye be Blackbeard.'), message(1, MessageRole.User, 'who are you?')],
  roleCounts: [
    { role: MessageRole.System, count: 1 },
    { role: MessageRole.User, count: 1 },
  ],
  recordedBytes: 200,
  isClamped: false,
  ...overrides,
});

const NO_TOOL_CALLS = { counts: {}, isComplete: true };

const renderInspector = (props: Partial<Parameters<typeof HopInspector>[0]> = {}) =>
  render(
    <HopInspector
      scope={SCOPE}
      traceId="tr1"
      span={span()}
      kind={SpanKind.Llm}
      bodyGrants={GRANTS}
      mcpToolCalls={NO_TOOL_CALLS}
      {...props}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  getConversationHopRequest.mockResolvedValue({ success: true, response: envelope() });
  getConversationHopResponse.mockResolvedValue({
    success: true,
    response: {
      state: HopReadState.Available,
      text: 'the answer',
      textClamp: { isClamped: false, recordedBytes: 10, deliveredBytes: 10 },
      reasoningText: null,
      finishReason: 'stop',
      toolCalls: [],
      recordedBytes: 50,
    },
  });
});

describe('HopInspector — the request side', () => {
  // The count states itself in the parameter line rather than in the tab's accent badge, which ui-kit styles
  // as a link and which no prop can recolour.
  test('states the recorded message count in the parameter line, not on the tab', async () => {
    renderInspector();

    const params = await screen.findByLabelText(ConversationsTraceI18nKey.InspectorParamsLabel);

    expect(params).toHaveTextContent('2');
    expect(await screen.findByRole('tab', { name: /InspectorRequest/ })).not.toHaveTextContent('2');
  });

  // The rule this change reverses. Every message is labelled with its own role, so a system prompt can never
  // read as something a person typed.
  test('states the system message under its own role', async () => {
    renderInspector();

    expect(await screen.findByText('Ye be Blackbeard.')).toBeInTheDocument();
    // The group carries its position as well as its role: labelled by role alone, every user message
    // announced identically.
    expect(
      screen.getByRole('group', { name: `${ConversationsTraceI18nKey.InspectorRoleSystem} #1` }),
    ).toBeInTheDocument();
  });

  test('states the whole message list, not only the last message', async () => {
    renderInspector();

    expect(await screen.findByText('Ye be Blackbeard.')).toBeInTheDocument();
    expect(screen.getByText('who are you?')).toBeInTheDocument();
  });

  test('offers a role control per role present, and none for a role absent', async () => {
    renderInspector();

    const roles = await screen.findByRole('group', { name: ConversationsTraceI18nKey.InspectorRolesLabel });

    expect(within(roles).getByRole('button', { name: /InspectorRoleSystem/ })).toBeInTheDocument();
    expect(within(roles).queryByRole('button', { name: /InspectorRoleTool/ })).toBeNull();
  });

  test('narrowing to one role states how many of how many messages match', async () => {
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByRole('button', { name: /InspectorRoleUser/ }));

    expect(screen.queryByText('Ye be Blackbeard.')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(ConversationsTraceI18nKey.InspectorRoleMatches);
  });

  // Absence is a debugging answer: the call ran at the deployment's default.
  test('states a zero temperature and an absent tool catalogue', async () => {
    renderInspector();

    const params = await screen.findByLabelText(ConversationsTraceI18nKey.InspectorParamsLabel);

    expect(params).toHaveTextContent('0');
    expect(params).toHaveTextContent(ConversationsTraceI18nKey.InspectorParamTools);
    expect(params).toHaveTextContent(ConversationsTraceI18nKey.InspectorParamsMore);
  });

  // Tier 2 is a whole-message read now: the history is what a reader opens a hop for, and a property was
  // never the unit they were asking about.
  test('opens one message in full on demand rather than shipping it with the list', async () => {
    const user = userEvent.setup();
    getConversationHopMessage.mockResolvedValue({
      success: true,
      response: { state: HopReadState.Available, text: 'the whole prompt', toolCalls: [] },
    });
    getConversationHopRequest.mockResolvedValue({
      success: true,
      response: envelope({
        messages: [{ ...message(0, MessageRole.User, 'clamped…', 4096), isTextClamped: true }],
        roleCounts: [{ role: MessageRole.User, count: 1 }],
      }),
    });
    renderInspector();

    await user.click(await screen.findByRole('button', { name: ConversationsTraceI18nKey.InspectorShowFullMessage }));

    await waitFor(() => expect(screen.getByText('the whole prompt')).toBeInTheDocument());
    expect(getConversationHopMessage).toHaveBeenCalledOnce();
  });

  // 10.3: an assistant message that only called a tool records `content` as `""`, so the call is the whole of
  // what it said and belongs in the history rather than in a size pill beside a blank card.
  test('renders an assistant tool call as the message content', async () => {
    getConversationHopRequest.mockResolvedValue({
      success: true,
      response: envelope({
        messages: [message(0, MessageRole.Assistant, '', 229, [{ name: 'web_search', args: '{"q":"odesa"}' }])],
        roleCounts: [{ role: MessageRole.Assistant, count: 1 }],
      }),
    });
    renderInspector();

    expect(await screen.findByText('web_search')).toBeInTheDocument();
    expect(screen.getByText('{"q":"odesa"}')).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.InspectorNoText)).toBeNull();
  });

  test('states a message that recorded neither text nor a call', async () => {
    getConversationHopRequest.mockResolvedValue({
      success: true,
      response: envelope({
        messages: [message(0, MessageRole.Assistant, '', 20)],
        roleCounts: [{ role: MessageRole.Assistant, count: 1 }],
      }),
    });
    renderInspector();

    expect(await screen.findByText(ConversationsTraceI18nKey.InspectorNoText)).toBeInTheDocument();
  });

  // 10.6: the size pills are gone, so nothing states a per-property byte count any more.
  test('renders no per-property size pill', async () => {
    renderInspector();

    await screen.findByText('who are you?');
    expect(screen.queryByRole('button', { name: /content/ })).toBeNull();
  });

  test('states that the envelope clamped rather than dropping messages silently', async () => {
    getConversationHopRequest.mockResolvedValue({ success: true, response: envelope({ isClamped: true }) });
    renderInspector();

    await waitFor(() =>
      expect(screen.getByText(ConversationsTraceI18nKey.InspectorEnvelopeClamped)).toBeInTheDocument(),
    );
  });

  // An unrecognised dialect is answered with the body rather than with a dead end.
  test('falls back to the raw view for a dialect no parser claims', async () => {
    getConversationHopRequest.mockResolvedValue({
      success: true,
      response: envelope({ state: HopReadState.Unstructured, messages: [], roleCounts: [] }),
    });
    getConversationHopRawBody.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        text: '{"raw":true}',
        clamp: { isClamped: false, recordedBytes: 12, deliveredBytes: 12 },
      },
    });
    renderInspector();

    await waitFor(() => expect(screen.getByText('{"raw":true}')).toBeInTheDocument());
    // The spec requires the inspector to state that it cannot structure the body, not just to dump it.
    expect(screen.getByText(ConversationsTraceI18nKey.InspectorUnstructured)).toBeInTheDocument();
  });
});

describe('HopInspector — the response side', () => {
  test('opens on the assembled response without reading the raw body', async () => {
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(await screen.findByText('the answer')).toBeInTheDocument();
    expect(getConversationHopRawBody).not.toHaveBeenCalled();
  });

  // The change's only new user-facing string, and the reason it exists: a requested tool with no recorded MCP
  // call is the application running it itself, not a lost record.
  test('states why a requested tool has no recorded result', async () => {
    const user = userEvent.setup();
    getConversationHopResponse.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        text: 'the answer',
        textClamp: { isClamped: false, recordedBytes: 10, deliveredBytes: 10 },
        reasoningText: null,
        finishReason: 'tool_calls',
        toolCalls: ['an_internal_tool'],
        recordedBytes: 50,
      },
    });
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(await screen.findByText(ConversationsTraceI18nKey.InspectorToolNotRecorded)).toBeInTheDocument();
    // Twice: once in the list of tools the response requested, once named by the note that explains it.
    expect(screen.getAllByText('an_internal_tool')).toHaveLength(2);
  });

  test('makes no such claim when the turn did record a call of that tool', async () => {
    const user = userEvent.setup();
    getConversationHopResponse.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        text: 'the answer',
        textClamp: { isClamped: false, recordedBytes: 10, deliveredBytes: 10 },
        reasoningText: null,
        finishReason: 'tool_calls',
        toolCalls: ['a_recorded_tool'],
        recordedBytes: 50,
      },
    });
    renderInspector({ mcpToolCalls: { counts: { a_recorded_tool: 1 }, isComplete: true } });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    await screen.findByText('the answer');
    expect(screen.queryByText(ConversationsTraceI18nKey.InspectorToolNotRecorded)).toBeNull();
  });

  // On a capped read an absent call may simply be unread, so the cause is withheld rather than asserted.
  test('makes no such claim when the span read was bounded', async () => {
    const user = userEvent.setup();
    getConversationHopResponse.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        text: 'the answer',
        textClamp: { isClamped: false, recordedBytes: 10, deliveredBytes: 10 },
        reasoningText: null,
        finishReason: 'tool_calls',
        toolCalls: ['an_internal_tool'],
        recordedBytes: 50,
      },
    });
    renderInspector({ mcpToolCalls: { counts: {}, isComplete: false } });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    await screen.findByText('the answer');
    expect(screen.queryByText(ConversationsTraceI18nKey.InspectorToolNotRecorded)).toBeNull();
  });

  test('reads the raw body only when the raw mode is selected', async () => {
    const user = userEvent.setup();
    getConversationHopRawBody.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        text: 'data: {}',
        clamp: { isClamped: false, recordedBytes: 8, deliveredBytes: 8 },
      },
    });
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));
    await user.click(screen.getByRole('tab', { name: ConversationsTraceI18nKey.InspectorModeRaw }));

    await waitFor(() => expect(getConversationHopRawBody).toHaveBeenCalled());
  });

  test('states what a clamped raw body withheld', async () => {
    const user = userEvent.setup();
    getConversationHopRawBody.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        text: 'x',
        clamp: { isClamped: true, recordedBytes: 4000, deliveredBytes: 1 },
      },
    });
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));
    await user.click(screen.getByRole('tab', { name: ConversationsTraceI18nKey.InspectorModeRaw }));

    await waitFor(() => expect(screen.getByText(ConversationsTraceI18nKey.InspectorRawClamped)).toBeInTheDocument());
  });
});

// The spec requires a clamp to state itself and state by how much. Three places clamp, and two of them
// computed the flag and rendered nothing — which no test noticed, because none asked.
describe('HopInspector — every clamp states itself', () => {
  test('the assembled response states its clamp', async () => {
    const user = userEvent.setup();
    getConversationHopResponse.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        text: 'truncated answer',
        textClamp: { isClamped: true, recordedBytes: 900000, deliveredBytes: 524288 },
        reasoningText: null,
        finishReason: 'stop',
        toolCalls: [],
        recordedBytes: 900000,
      },
    });
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(await screen.findByText(ConversationsTraceI18nKey.InspectorRawClamped)).toBeInTheDocument();
  });

  // A `tools/call` result averages 123 KB, so this one fires in practice.
  test('an MCP result states its clamp', async () => {
    getConversationHopMcp.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        method: 'tools/call',
        toolName: 'get_page',
        toolset: 'docs-mcp',
        argumentsText: '{}',
        resultText: 'the beginning of a very long page',
        resultClamp: { isClamped: true, recordedBytes: 126000, deliveredBytes: 524288 },
        resultState: HopReadState.Available,
      },
    });
    renderInspector({
      span: span({ event_kind: 'mcp', mcp_method: 'tools/call', mcp_tool_call_name: 'get_page' }),
      kind: SpanKind.Mcp,
    });

    expect(await screen.findByText(ConversationsTraceI18nKey.InspectorRawClamped)).toBeInTheDocument();
  });

  test('an unclamped response states nothing', async () => {
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));
    await screen.findByText('the answer');

    expect(screen.queryByText(ConversationsTraceI18nKey.InspectorRawClamped)).toBeNull();
  });
});

describe('HopInspector — absence and entitlement', () => {
  // The case most worth opening: a call that returned nothing still sent something.
  test('a hop that returned nothing still shows its request', async () => {
    renderInspector({ span: span({ response_body_bytes: 0 }) });

    expect(await screen.findByText('who are you?')).toBeInTheDocument();
  });

  test('and states the absence on the response side alone', async () => {
    const user = userEvent.setup();
    renderInspector({ span: span({ response_body_bytes: 0 }) });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByText(ConversationsTraceI18nKey.InspectorNoResponse)).toBeInTheDocument();
    expect(getConversationHopResponse).not.toHaveBeenCalled();
  });

  test('a protocol-envelope hop is settled without any read', async () => {
    renderInspector({ span: span({ event_kind: 'mcp', mcp_method: 'tools/list' }), kind: SpanKind.Mcp });

    expect(await screen.findByText(ConversationsTraceI18nKey.InspectorSessionSetup)).toBeInTheDocument();
    expect(getConversationHopMcp).not.toHaveBeenCalled();
  });

  test('a caller entitled to one side is offered only that side', async () => {
    renderInspector({ bodyGrants: { isReadable: false, isRequestReadable: true, isResponseReadable: false } });

    expect(await screen.findByRole('tab', { name: /InspectorRequest/ })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /InspectorResponse/ })).toBeNull();
  });

  // A caller granted the response column and not the request one never gets to choose a side, so the read has
  // to be gated on the side actually on screen. Gating it on the reader's last choice — which defaults to
  // Request and can never change here — left this caller on a spinner forever.
  test('a caller entitled only to the response side gets the response read without choosing it', async () => {
    renderInspector({ bodyGrants: { isReadable: false, isRequestReadable: false, isResponseReadable: true } });

    expect(await screen.findByText('the answer')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /InspectorRequest/ })).toBeNull();
    expect(getConversationHopResponse).toHaveBeenCalledOnce();
  });

  test('a failed read is stated as a failure, not as an empty hop', async () => {
    getConversationHopRequest.mockResolvedValue({ success: false, response: undefined });
    renderInspector();

    await waitFor(() => expect(screen.getByText(ConversationsTraceI18nKey.InspectorLoadFailed)).toBeInTheDocument());
  });
});

describe('HopInspector — MCP and embedding hops', () => {
  test('an MCP hop states its arguments, result and toolset instead of tabs', async () => {
    getConversationHopMcp.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        method: 'tools/call',
        toolName: 'get_page',
        toolset: 'docs-mcp',
        argumentsText: '{ "page": "home" }',
        resultText: 'the page',
        resultClamp: { isClamped: false, recordedBytes: 8, deliveredBytes: 8 },
        resultState: HopReadState.Available,
      },
    });
    renderInspector({
      span: span({ event_kind: 'mcp', mcp_method: 'tools/call', mcp_tool_call_name: 'get_page' }),
      kind: SpanKind.Mcp,
    });

    expect(await screen.findByText('docs-mcp')).toBeInTheDocument();
    expect(screen.getByText('the page')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  // The MCP panel is built from both body columns, so a caller granted one of them sees a panel that is half
  // available. Rendering the withheld half as "this hop recorded nothing" states the caller's entitlement as a
  // fact about the hop.
  test('an MCP result the caller may not read is stated as withheld, not as empty', async () => {
    getConversationHopMcp.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        method: 'tools/call',
        toolName: 'get_page',
        toolset: 'docs-mcp',
        argumentsText: '{ "page": "home" }',
        resultText: null,
        resultClamp: NO_CLAMP,
        resultState: HopReadState.ColumnWithheld,
      },
    });
    renderInspector({
      span: span({ event_kind: 'mcp', mcp_method: 'tools/call', mcp_tool_call_name: 'get_page' }),
      kind: SpanKind.Mcp,
    });

    expect(await screen.findByText(ConversationsTraceI18nKey.InspectorWithheldStats)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.InspectorNoBody)).toBeNull();
  });

  test('an embedding dimension count the caller may not read is stated as withheld', async () => {
    getConversationHopEmbedding.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        model: 'ada',
        inputCount: 1,
        dimensions: null,
        inputText: 'the probe',
        inputClamp: NO_CLAMP,
        isDimensionsWithheld: true,
      },
    });
    renderInspector({ span: span({ event_kind: 'embedding' }), kind: SpanKind.Embeddings });

    expect(await screen.findByText(ConversationsTraceI18nKey.InspectorWithheldValue)).toBeInTheDocument();
  });

  test('an embedding hop states its probe text and never depicts the vector', async () => {
    getConversationHopEmbedding.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        model: 'ada',
        inputCount: 1,
        dimensions: 1536,
        inputText: 'the probe',
        inputClamp: NO_CLAMP,
        isDimensionsWithheld: false,
      },
    });
    renderInspector({ span: span({ event_kind: 'embedding' }), kind: SpanKind.Embeddings });

    expect(await screen.findByText('the probe')).toBeInTheDocument();
    expect(screen.getByText('1536')).toBeInTheDocument();
  });

  test('an embedding response states that it is a vector', async () => {
    const user = userEvent.setup();
    getConversationHopEmbedding.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        model: 'ada',
        inputCount: 1,
        dimensions: 4,
        inputText: 'the probe',
        inputClamp: NO_CLAMP,
        isDimensionsWithheld: false,
      },
    });
    renderInspector({ span: span({ event_kind: 'embedding' }), kind: SpanKind.Embeddings });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByText(ConversationsTraceI18nKey.InspectorVector)).toBeInTheDocument();
  });
});
