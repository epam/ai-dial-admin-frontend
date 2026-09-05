import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import HopInspector from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopInspector';
import { NO_CLAMP } from '@/src/utils/analytics/hop-inspector/envelope';
import { NO_FACTS } from '@/src/utils/analytics/hop-inspector/response';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationSpanRow,
  HopBodyGrants,
  HopDialect,
  HopReadState,
  HopRequestEnvelope,
  HopResponseEnvelope,
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
const getConversationHopProtocol = vi.fn();

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversationHopRequest: (...args: unknown[]) => getConversationHopRequest(...args),
  getConversationHopResponse: (...args: unknown[]) => getConversationHopResponse(...args),
  getConversationHopMessage: (...args: unknown[]) => getConversationHopMessage(...args),
  getConversationHopRawBody: (...args: unknown[]) => getConversationHopRawBody(...args),
  getConversationHopMcp: (...args: unknown[]) => getConversationHopMcp(...args),
  getConversationHopEmbedding: (...args: unknown[]) => getConversationHopEmbedding(...args),
  getConversationHopProtocol: (...args: unknown[]) => getConversationHopProtocol(...args),
}));

const SCOPE: SessionScope = { id: 'chat-1', source: null };

const GRANTS: HopBodyGrants = { isRequestReadable: true, isResponseReadable: true };

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
  total_price: null,
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
  answers: [],
  isError: false,
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
      { name: 'model', value: 'gpt-4.1' },
    ],
    rest: ['vendor_knob'],
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

const response = (overrides: Partial<HopResponseEnvelope> = {}): HopResponseEnvelope => ({
  state: HopReadState.Available,
  text: 'the answer',
  textClamp: { isClamped: false, recordedBytes: 10, deliveredBytes: 10 },
  reasoningText: null,
  finishReason: 'stop',
  toolCalls: [],
  facts: NO_FACTS,
  recordedBytes: 50,
  ...overrides,
});

const protocolFacts = (overrides: Record<string, unknown> = {}) => ({
  success: true,
  response: {
    state: HopReadState.Available,
    method: 'tools/list',
    requestText: null,
    requestState: HopReadState.NoBody,
    resultText: '{\n  "tools": [\n    {\n      "name": "run_code"\n    }\n  ]\n}',
    resultClamp: NO_CLAMP,
    responseState: HopReadState.Available,
    ...overrides,
  },
});

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
  getConversationHopResponse.mockResolvedValue({ success: true, response: response() });
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
    expect(params).toHaveTextContent('gpt-4.1');
    expect(params).toHaveTextContent('+1');
    expect(params).not.toHaveTextContent('vendor_knob');
    // The i18n mock answers with the key rather than the interpolated string, so what is assertable here is
    // that the count carries the statement of names at all.
    expect(screen.getByText(ConversationsTraceI18nKey.InspectorParamsRest)).toBeInTheDocument();
  });

  // Tier 2 is a whole-message read: the history is what a reader opens a hop for, and a single property of a
  // message is not the unit they are asking about.
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
        messages: [
          message(0, MessageRole.Assistant, '', 229, [{ name: 'web_search', args: '{"q":"odesa"}', id: 'c9' }]),
        ],
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

    // Pretty-printed rather than dumped as recorded: a body arrives as one unwrapped line.
    await waitFor(() => expect(screen.getByText(/"raw": true/)).toBeInTheDocument());
    // The spec requires the inspector to state that it cannot structure the body, not just to show it.
    expect(screen.getByText(ConversationsTraceI18nKey.InspectorUnstructured)).toBeInTheDocument();
  });
});

describe('HopInspector — the recorded bytes', () => {
  // One question — "show me what was recorded" — so one control, in the same place on both sides, rather than
  // a two-mode control on the response alone that the reader has to notice.
  // The response read is enabled by every tab that shows a response, Chat included: the body is not fetched
  // while the reader is on Request, and is fetched once they reach a tab that shows it.
  test('defers the response read until a tab that shows it is open', async () => {
    const user = userEvent.setup();
    renderInspector();

    await screen.findByText('who are you?');
    expect(getConversationHopResponse).not.toHaveBeenCalled();

    await user.click(screen.getByRole('tab', { name: /InspectorChat/ }));

    await waitFor(() => expect(getConversationHopResponse).toHaveBeenCalledOnce());
  });

  test('offers the raw switch on the request side too', async () => {
    renderInspector();

    expect(await screen.findByRole('button', { name: ConversationsTraceI18nKey.InspectorRaw })).toBeInTheDocument();
  });

  test('reads the request body raw only once the switch is on', async () => {
    const user = userEvent.setup();
    getConversationHopRawBody.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        text: '{"messages":[]}',
        clamp: { isClamped: false, recordedBytes: 15, deliveredBytes: 15 },
      },
    });
    renderInspector();

    await screen.findByText('who are you?');
    expect(getConversationHopRawBody).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: ConversationsTraceI18nKey.InspectorRaw }));

    await waitFor(() => expect(screen.getByText(/"messages": \[\]/)).toBeInTheDocument());
  });

  test('the raw switch closes the facts line, at its end', async () => {
    renderInspector();

    const params = await screen.findByLabelText(ConversationsTraceI18nKey.InspectorParamsLabel);
    const raw = screen.getByRole('button', { name: ConversationsTraceI18nKey.InspectorRaw });
    const message = screen.getByText('who are you?');

    expect(params.compareDocumentPosition(raw) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(raw.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // The filter narrows a list, and the bytes are not a list.
  test('drops the role filter while the recorded bytes are shown', async () => {
    const user = userEvent.setup();
    getConversationHopRawBody.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        text: '{}',
        clamp: { isClamped: false, recordedBytes: 2, deliveredBytes: 2 },
      },
    });
    renderInspector();

    await screen.findByText('who are you?');
    await user.click(screen.getByRole('button', { name: ConversationsTraceI18nKey.InspectorRaw }));

    expect(screen.queryByRole('group', { name: ConversationsTraceI18nKey.InspectorRolesLabel })).toBeNull();
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
      response: response({
        finishReason: 'tool_calls',
        toolCalls: [{ name: 'an_internal_tool', args: '{}', id: 'call_1' }],
      }),
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
      response: response({
        finishReason: 'tool_calls',
        toolCalls: [{ name: 'a_recorded_tool', args: '{}', id: 'call_2' }],
      }),
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
      response: response({
        finishReason: 'tool_calls',
        toolCalls: [{ name: 'an_internal_tool', args: '{}', id: 'call_1' }],
      }),
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
    await user.click(screen.getByRole('button', { name: ConversationsTraceI18nKey.InspectorRaw }));

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
    await user.click(screen.getByRole('button', { name: ConversationsTraceI18nKey.InspectorRaw }));

    await waitFor(() => expect(screen.getByText(ConversationsTraceI18nKey.InspectorRawClamped)).toBeInTheDocument());
  });
});

// The spec requires a clamp to state itself and state by how much. Three places clamp, and two of them
// computed the flag and rendered nothing — which no test noticed, because none asked.
describe('HopInspector — the transport line', () => {
  // The section used to render nothing at all for such a hop, which says "nothing happened" rather than "you
  // are not being shown this".
  test('a hop whose body columns are withheld still states how the call went', async () => {
    renderInspector({ bodyGrants: { isRequestReadable: false, isResponseReadable: false } });

    const transport = await screen.findByRole('group', { name: ConversationsTraceI18nKey.InspectorTransportLabel });

    expect(transport).toHaveTextContent('200 OK');
    expect(transport).toHaveTextContent('2.0 KB');
    expect(transport).toHaveTextContent('4.0 KB');
    expect(screen.getByText(ConversationsTraceI18nKey.InspectorWithheldStats)).toBeInTheDocument();
  });

  test('a failed hop states the status it failed with', async () => {
    const user = userEvent.setup();
    renderInspector({ span: span({ response_status: 502, success: false }) });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByRole('group', { name: ConversationsTraceI18nKey.InspectorTransportLabel })).toHaveTextContent(
      '502 Bad Gateway',
    );
  });

  // Stated over the request, the outcome described something the request has not done yet.
  test('the request side states the verb, not how the call ended', async () => {
    renderInspector();

    const transport = await screen.findByRole('group', { name: ConversationsTraceI18nKey.InspectorTransportLabel });

    expect(transport).toHaveTextContent('POST');
    expect(transport).not.toHaveTextContent('200 OK');
    expect(transport).not.toHaveTextContent('2.0 KB');
  });

  test('the response side states the outcome, not the verb', async () => {
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));
    const transport = screen.getByRole('group', { name: ConversationsTraceI18nKey.InspectorTransportLabel });

    expect(transport).toHaveTextContent('200 OK');
    expect(transport).not.toHaveTextContent('POST');
  });

  // Chat states a conversation, not a call, so neither half of the transport belongs to it.
  test('the chat tab states no transport facts', async () => {
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorChat/ }));

    expect(screen.queryByRole('group', { name: ConversationsTraceI18nKey.InspectorTransportLabel })).toBeNull();
  });
});

describe('HopInspector — every clamp states itself', () => {
  test('the assembled response states its clamp', async () => {
    const user = userEvent.setup();
    getConversationHopResponse.mockResolvedValue({
      success: true,
      response: response({
        text: 'truncated answer',
        textClamp: { isClamped: true, recordedBytes: 900000, deliveredBytes: 524288 },
        recordedBytes: 900000,
      }),
    });
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(await screen.findByText(ConversationsTraceI18nKey.InspectorRawClamped)).toBeInTheDocument();
  });

  // A `tools/call` result averages 123 KB, so this one fires in practice. It states itself on the response
  // tab, which is where the result it clamped is stated.
  test('an MCP result states its clamp', async () => {
    const user = userEvent.setup();
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
        argumentsState: HopReadState.Available,
        resultState: HopReadState.Available,
      },
    });
    renderInspector({
      span: span({ event_kind: 'mcp', mcp_method: 'tools/call', mcp_tool_call_name: 'get_page' }),
      kind: SpanKind.Mcp,
    });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByText(ConversationsTraceI18nKey.InspectorRawClamped)).toBeInTheDocument();
  });

  test('an unclamped response states nothing', async () => {
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));
    await screen.findByText('the answer');

    expect(screen.queryByText(ConversationsTraceI18nKey.InspectorRawClamped)).toBeNull();
  });
});

describe('HopInspector — the recorded bytes keep the facts about the hop', () => {
  // Withdrawing the response facts over the bytes made raw mode read as a different hop.
  test('the response facts stay stated with the raw switch on', async () => {
    const user = userEvent.setup();
    getConversationHopRawBody.mockResolvedValue({
      success: true,
      response: { state: HopReadState.Available, text: '{}', clamp: NO_CLAMP },
    });
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));
    await user.click(screen.getByRole('button', { name: ConversationsTraceI18nKey.InspectorRaw }));

    expect(
      screen.getByRole('group', { name: ConversationsTraceI18nKey.InspectorResponseFactsLabel }),
    ).toBeInTheDocument();
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

  test('a notification states that the protocol defines no response body', async () => {
    const user = userEvent.setup();
    getConversationHopProtocol.mockResolvedValue(protocolFacts({ requestText: null, names: [], stated: [] }));
    renderInspector({
      span: span({ event_kind: 'mcp', mcp_method: 'notifications/initialized', response_body_bytes: 0 }),
      kind: SpanKind.Mcp,
    });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByText(ConversationsTraceI18nKey.InspectorProtocolNoBody)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.InspectorNoResponse)).toBeNull();
  });

  test('a caller entitled to one side is offered only that side', async () => {
    renderInspector({ bodyGrants: { isRequestReadable: true, isResponseReadable: false } });

    expect(await screen.findByRole('tab', { name: /InspectorRequest/ })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /InspectorResponse/ })).toBeNull();
  });

  // A caller granted the response column and not the request one never gets to choose a side, so the read has
  // to be gated on the side actually on screen. Gating it on the reader's last choice — which defaults to
  // Request and can never change here — left this caller on a spinner forever.
  test('a caller entitled only to the response side gets the response read without choosing it', async () => {
    renderInspector({ bodyGrants: { isRequestReadable: false, isResponseReadable: true } });

    expect(await screen.findByText('the answer')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /InspectorRequest/ })).toBeNull();
    expect(getConversationHopResponse).toHaveBeenCalledOnce();
  });

  test('a failed read is stated as a failure, not as an empty hop', async () => {
    getConversationHopRequest.mockResolvedValue({ success: false, response: undefined });
    renderInspector();

    await waitFor(() => expect(screen.getByText(ConversationsTraceI18nKey.InspectorLoadFailed)).toBeInTheDocument());
  });

  // The facts line renders above the response panel's own state check, deliberately, so it is handed the
  // envelope of a failed read too and reading a fact off one has to be safe. No other response path reaches
  // it that way: the zero-byte case is settled before the read is issued, and the failure case above fails
  // the *request*.
  test('a failed response read is stated as a failure on the response tab', async () => {
    getConversationHopResponse.mockResolvedValue({ success: false, response: undefined });
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(await screen.findByText(ConversationsTraceI18nKey.InspectorLoadFailed)).toBeInTheDocument();
  });

  // A granted response the log no longer holds — a row dropped by retention — is a read that succeeds and
  // returns no body. Stated as an absent body rather than as the zero-byte response above it: the row said
  // nothing about this one, so "recorded no response" would be a claim the hop never made.
  test('a granted response the log no longer holds states its absence, and states no facts about it', async () => {
    getConversationHopResponse.mockResolvedValue({
      success: true,
      response: response({ state: HopReadState.NoBody, text: null, finishReason: null, recordedBytes: null }),
    });
    const user = userEvent.setup();
    renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(await screen.findByText(ConversationsTraceI18nKey.InspectorNoBody)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: ConversationsTraceI18nKey.InspectorResponseFactsLabel })).toBeNull();
  });
});

describe('HopInspector — MCP and embedding hops', () => {
  const mcpSpan = span({ event_kind: 'mcp', mcp_method: 'tools/call', mcp_tool_call_name: 'get_page' });
  const embeddingSpan = span({ event_kind: 'embedding' });

  const mcpFacts = (overrides: Record<string, unknown> = {}) => ({
    success: true,
    response: {
      state: HopReadState.Available,
      method: 'tools/call',
      toolName: 'get_page',
      toolset: 'docs-mcp',
      argumentsText: '{ "page": "home" }',
      resultText: 'the page',
      resultClamp: { isClamped: false, recordedBytes: 8, deliveredBytes: 8 },
      argumentsState: HopReadState.Available,
      resultState: HopReadState.Available,
      ...overrides,
    },
  });

  const embeddingFacts = (overrides: Record<string, unknown> = {}) => ({
    success: true,
    response: {
      state: HopReadState.Available,
      model: 'ada',
      inputCount: 1,
      dimensions: 1536,
      inputText: 'the probe',
      inputClamp: NO_CLAMP,
      isDimensionsWithheld: false,
      ...overrides,
    },
  });

  // The two halves are separate columns of one row, so they are stated on separate tabs — the same layout
  // every other kind of hop uses, rather than a merged panel a reader has to learn.
  test('an MCP hop states its arguments on the request tab and its result on the response tab', async () => {
    const user = userEvent.setup();
    getConversationHopMcp.mockResolvedValue(mcpFacts());
    renderInspector({ span: mcpSpan, kind: SpanKind.Mcp });

    expect(await screen.findByText('{ "page": "home" }')).toBeInTheDocument();
    expect(screen.queryByText('the page')).toBeNull();

    await user.click(screen.getByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByText('the page')).toBeInTheDocument();
    expect(screen.queryByText('{ "page": "home" }')).toBeNull();
  });

  test('the tab strip heads the section, with the hop-row facts below it', async () => {
    getConversationHopMcp.mockResolvedValue(mcpFacts());
    renderInspector({ span: mcpSpan, kind: SpanKind.Mcp });

    const facts = await screen.findByRole('group', { name: ConversationsTraceI18nKey.InspectorMcpFactsLabel });
    const requestTab = screen.getByRole('tab', { name: /InspectorRequest/ });

    expect(requestTab.compareDocumentPosition(facts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // Method, tool and toolset are plain hop-row columns belonging to neither side, so they sit below the strip
  // rather than being duplicated onto both tabs.
  test('an MCP hop keeps its method, tool and toolset visible on both tabs', async () => {
    const user = userEvent.setup();
    getConversationHopMcp.mockResolvedValue(mcpFacts());
    renderInspector({ span: mcpSpan, kind: SpanKind.Mcp });

    const facts = await screen.findByRole('group', { name: ConversationsTraceI18nKey.InspectorMcpFactsLabel });
    expect(facts).toHaveTextContent('docs-mcp');
    expect(facts).toHaveTextContent('tools/call');

    await user.click(screen.getByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByRole('group', { name: ConversationsTraceI18nKey.InspectorMcpFactsLabel })).toHaveTextContent(
      'docs-mcp',
    );
  });

  // Formatted server-side; what this asserts is that the panel renders it without collapsing the line breaks.
  test('an MCP hop renders its formatted result with its line breaks intact', async () => {
    const user = userEvent.setup();
    const formatted = '{\n  "stdout": "one",\n  "exit_code": 0\n}';
    getConversationHopMcp.mockResolvedValue(
      mcpFacts({
        resultText: formatted,
        resultClamp: { isClamped: false, recordedBytes: 30, deliveredBytes: formatted.length },
      }),
    );
    renderInspector({ span: mcpSpan, kind: SpanKind.Mcp });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByText(formatted, { collapseWhitespace: false, trim: false })).toBeInTheDocument();
  });

  test('an MCP hop offers no chat tab, because a protocol message is not a conversation', async () => {
    getConversationHopMcp.mockResolvedValue(mcpFacts());
    renderInspector({ span: mcpSpan, kind: SpanKind.Mcp });

    await screen.findByText('{ "page": "home" }');
    expect(screen.queryByRole('tab', { name: /InspectorChat/ })).toBeNull();
  });

  // The MCP hop's two halves come from two columns, so a caller granted one of them sees one available half.
  // Rendering the withheld half as "this hop recorded nothing" states the caller's entitlement as a fact
  // about the hop.
  test('an MCP result the caller may not read is stated as withheld, not as empty', async () => {
    const user = userEvent.setup();
    getConversationHopMcp.mockResolvedValue(
      mcpFacts({ resultText: null, resultClamp: NO_CLAMP, resultState: HopReadState.ColumnWithheld }),
    );
    renderInspector({ span: mcpSpan, kind: SpanKind.Mcp });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByText(ConversationsTraceI18nKey.InspectorWithheldStats)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.InspectorNoBody)).toBeNull();
  });

  // These methods used to render blank on both tabs, on the claim that they carry no content.
  test('a protocol hop states the result the server answered with', async () => {
    const user = userEvent.setup();
    getConversationHopProtocol.mockResolvedValue(protocolFacts());
    renderInspector({ span: span({ event_kind: 'mcp', mcp_method: 'tools/list' }), kind: SpanKind.Mcp });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(
      screen.getByText('{\n  "tools": [\n    {\n      "name": "run_code"\n    }\n  ]\n}', {
        collapseWhitespace: false,
        trim: false,
      }),
    ).toBeInTheDocument();
  });

  test('an initialize hop states what the server answered with, not a summary of it', async () => {
    const user = userEvent.setup();
    const negotiated = '{\n  "protocolVersion": "2025-11-25"\n}';
    getConversationHopProtocol.mockResolvedValue(protocolFacts({ method: 'initialize', resultText: negotiated }));
    renderInspector({ span: span({ event_kind: 'mcp', mcp_method: 'initialize' }), kind: SpanKind.Mcp });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByText(negotiated, { collapseWhitespace: false, trim: false })).toBeInTheDocument();
  });

  test('a protocol request carrying no parameters says so', async () => {
    getConversationHopProtocol.mockResolvedValue(protocolFacts());
    renderInspector({ span: span({ event_kind: 'mcp', mcp_method: 'tools/list' }), kind: SpanKind.Mcp });

    expect(await screen.findByText(ConversationsTraceI18nKey.InspectorProtocolNoParams)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.InspectorNoBody)).toBeNull();
  });

  test('an embedding hop states its probe text on the request tab', async () => {
    getConversationHopEmbedding.mockResolvedValue(embeddingFacts());
    renderInspector({ span: embeddingSpan, kind: SpanKind.Embeddings });

    expect(await screen.findByText('the probe')).toBeInTheDocument();
    expect(screen.getByText('ada')).toBeInTheDocument();
  });

  // The dimension count is the one field read from the response column, so it is stated on the tab that reads
  // that column.
  test('an embedding hop states its dimension count on the response tab, and never the vector', async () => {
    const user = userEvent.setup();
    getConversationHopEmbedding.mockResolvedValue(embeddingFacts());
    renderInspector({ span: embeddingSpan, kind: SpanKind.Embeddings });

    await screen.findByText('the probe');
    expect(screen.queryByText('1536')).toBeNull();

    await user.click(screen.getByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByText('1536')).toBeInTheDocument();
    // The vector's absence is stated beside the count, not in place of it.
    expect(screen.getByText(ConversationsTraceI18nKey.InspectorVector)).toBeInTheDocument();
  });

  test('an embedding dimension count the caller may not read is stated as withheld', async () => {
    const user = userEvent.setup();
    getConversationHopEmbedding.mockResolvedValue(embeddingFacts({ dimensions: null, isDimensionsWithheld: true }));
    renderInspector({ span: embeddingSpan, kind: SpanKind.Embeddings });

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));

    expect(screen.getByText(ConversationsTraceI18nKey.InspectorWithheldValue)).toBeInTheDocument();
  });

  test('an embedding hop offers no chat tab', async () => {
    getConversationHopEmbedding.mockResolvedValue(embeddingFacts());
    renderInspector({ span: embeddingSpan, kind: SpanKind.Embeddings });

    await screen.findByText('the probe');
    expect(screen.queryByRole('tab', { name: /InspectorChat/ })).toBeNull();
  });
});

describe('HopInspector — the tab set', () => {
  const tabNames = () =>
    screen
      .getAllByRole('tab')
      .map((tab) => tab.textContent)
      .filter((label): label is string => label !== null);

  test('presents request, response and chat in that fixed order', async () => {
    renderInspector();

    await screen.findByText('who are you?');

    expect(tabNames()).toEqual([
      ConversationsTraceI18nKey.InspectorRequest,
      ConversationsTraceI18nKey.InspectorResponse,
      ConversationsTraceI18nKey.InspectorChat,
    ]);
  });

  // A missing tab does not reorder the rest: the strip must not rearrange itself as the reader moves down a
  // tree of hops with different entitlements.
  test('keeps the remaining tabs in order when the response column is withheld', async () => {
    renderInspector({ bodyGrants: { isRequestReadable: true, isResponseReadable: false } });

    await screen.findByText('who are you?');

    expect(tabNames()).toEqual([ConversationsTraceI18nKey.InspectorRequest, ConversationsTraceI18nKey.InspectorChat]);
  });

  // A reader comparing one side of two hops is asking the same question twice; being returned to the first
  // tab on every click answers a different one.
  test('keeps the chosen tab when another span that offers it is selected', async () => {
    const user = userEvent.setup();
    const { rerender } = renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorResponse/ }));
    expect(screen.getByRole('tab', { name: /InspectorResponse/ })).toHaveAttribute('aria-selected', 'true');

    rerender(
      <HopInspector
        scope={SCOPE}
        traceId="tr1"
        span={span({ core_span_id: 's2' })}
        kind={SpanKind.Llm}
        bodyGrants={GRANTS}
        mcpToolCalls={NO_TOOL_CALLS}
      />,
    );

    expect(screen.getByRole('tab', { name: /InspectorResponse/ })).toHaveAttribute('aria-selected', 'true');
  });

  test('falls back to the first tab a span offers when the chosen one is not among them', async () => {
    const user = userEvent.setup();
    getConversationHopMcp.mockResolvedValue({
      success: true,
      response: {
        state: HopReadState.Available,
        method: 'tools/call',
        toolName: 'get_page',
        toolset: 'docs-mcp',
        argumentsText: '{}',
        resultText: 'the page',
        resultClamp: NO_CLAMP,
        argumentsState: HopReadState.Available,
        resultState: HopReadState.Available,
      },
    });
    const { rerender } = renderInspector();

    await user.click(await screen.findByRole('tab', { name: /InspectorChat/ }));

    rerender(
      <HopInspector
        scope={SCOPE}
        traceId="tr1"
        span={span({ core_span_id: 's2', event_kind: 'mcp', mcp_method: 'tools/call', mcp_tool_call_name: 'get_page' })}
        kind={SpanKind.Mcp}
        bodyGrants={GRANTS}
        mcpToolCalls={NO_TOOL_CALLS}
      />,
    );

    expect(screen.queryByRole('tab', { name: /InspectorChat/ })).toBeNull();
    expect(screen.getByRole('tab', { name: /InspectorRequest/ })).toHaveAttribute('aria-selected', 'true');
  });
});
