import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import HopChatPanel from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopChatPanel';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationSpanRow,
  HopDialect,
  HopMessageEntry,
  HopReadState,
  HopRequestEnvelope,
  HopResponseEnvelope,
  HopToolCall,
  MessageRole,
  SessionScope,
} from '@/src/models/analytics/conversations-trace';
import { NO_CLAMP } from '@/src/utils/analytics/hop-inspector/envelope';
import { NO_FACTS } from '@/src/utils/analytics/hop-inspector/response';

const getConversationHopMessage = vi.fn();

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversationHopMessage: (...args: unknown[]) => getConversationHopMessage(...args),
}));

const SCOPE: SessionScope = { id: 'chat-1', source: null };

const SPAN: ConversationSpanRow = {
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
  number_request_messages: 3,
  reasoning_tokens: null,
  total_price: '0.001',
};

const message = (
  index: number,
  role: MessageRole,
  text: string | null,
  toolCalls: HopToolCall[] = [],
  isTextClamped = false,
): HopMessageEntry => ({
  index,
  role,
  bytes: 100,
  text,
  toolCalls,
  isTextClamped,
  answers: [],
  isError: false,
});

const request = (overrides: Partial<HopRequestEnvelope> = {}): HopRequestEnvelope => ({
  state: HopReadState.Available,
  dialect: HopDialect.ChatCompletions,
  params: { stated: [] },
  messages: [
    message(0, MessageRole.System, 'Ye be a helpful assistant.'),
    message(1, MessageRole.User, 'where is odesa?'),
    message(2, MessageRole.Assistant, 'on the black sea'),
    message(3, MessageRole.Tool, '{"found":true}'),
  ],
  roleCounts: [],
  recordedBytes: 400,
  isClamped: false,
  ...overrides,
});

const response = (overrides: Partial<HopResponseEnvelope> = {}): HopResponseEnvelope => ({
  state: HopReadState.Available,
  text: 'the final answer',
  textClamp: NO_CLAMP,
  reasoningText: null,
  finishReason: 'stop',
  toolCalls: [],
  facts: NO_FACTS,
  recordedBytes: 50,
  ...overrides,
});

const renderPanel = (props: Partial<Parameters<typeof HopChatPanel>[0]> = {}) =>
  render(
    <HopChatPanel
      scope={SCOPE}
      traceId="tr1"
      span={SPAN}
      request={request()}
      isRequestLoading={false}
      response={response()}
      isResponseLoading={false}
      isResponseGranted
      {...props}
    />,
  );

const turn = (role: string, position?: number) => (position === undefined ? role : `${role} #${position}`);

beforeEach(() => vi.clearAllMocks());

describe('HopChatPanel', () => {
  test('renders the history the span received, in recorded order', () => {
    renderPanel();

    const conversation = screen.getByRole('group', { name: ConversationsTraceI18nKey.InspectorChatLabel });
    const turns = conversation.textContent ?? '';

    expect(turns.indexOf('where is odesa?')).toBeGreaterThan(turns.indexOf('Ye be a helpful assistant.'));
    expect(turns.indexOf('on the black sea')).toBeGreaterThan(turns.indexOf('where is odesa?'));
  });

  // Every turn keeps its role and its place in the history, so a reader can point at one and find it on the
  // Request tab.
  test('labels every turn with its own role and position', () => {
    renderPanel();

    expect(screen.getByRole('group', { name: turn(ConversationsTraceI18nKey.InspectorRoleUser, 2) })).toBeTruthy();
    expect(screen.getByRole('group', { name: turn(ConversationsTraceI18nKey.InspectorRoleAssistant, 3) })).toBeTruthy();
    // The span's own answer has no place in the history it answered, so it states its role alone.
    expect(screen.getByRole('group', { name: ConversationsTraceI18nKey.InspectorRoleAssistant })).toBeTruthy();
  });

  // The tab states what was said. A system prompt, a tool result and an assistant turn that only called a
  // tool are machinery: the Request tab states all of them in full, and rendering them here would make this
  // tab the Request tab in different clothes.
  test('states the exchange only, leaving the machinery to the request tab', () => {
    renderPanel();

    expect(screen.queryByText('Ye be a helpful assistant.')).toBeNull();
    expect(screen.queryByText('{"found":true}')).toBeNull();
    expect(screen.getByText('where is odesa?')).toBeTruthy();
    expect(screen.getByText('on the black sea')).toBeTruthy();
  });

  // The messages dialect feeds a result back as a *user* message, so a filter by role alone would let
  // machinery through wearing the user's role — the one thing this tab must never do.
  test('leaves out a result that arrived under the user role', () => {
    renderPanel({
      request: request({
        messages: [
          { ...message(0, MessageRole.User, 'where is odesa?'), index: 0 },
          { ...message(1, MessageRole.User, 'app-wide.txt'), answers: [{ callId: 'c1', toolName: 'ls' }] },
        ],
      }),
    });

    expect(screen.getByText('where is odesa?')).toBeTruthy();
    expect(screen.queryByText('app-wide.txt')).toBeNull();
  });

  test('states that the span received no conversation when its history is all machinery', () => {
    renderPanel({
      request: request({
        messages: [
          message(0, MessageRole.System, 'Ye be a helpful assistant.'),
          { ...message(1, MessageRole.Tool, '{"found":true}'), answers: [{ callId: 'c1', toolName: 'ls' }] },
        ],
      }),
    });

    expect(screen.getByText(ConversationsTraceI18nKey.InspectorChatNoMessages)).toBeTruthy();
  });

  test('renders the span’s own answer as the trailing turn', () => {
    renderPanel();

    expect(screen.getByText('the final answer')).toBeTruthy();
  });

  // A response with no text put its output somewhere else, commonly in tool calls, and an empty trailing
  // bubble would read as an answer.
  test('adds no trailing turn when the response yielded no text', () => {
    renderPanel({ response: response({ text: null }) });

    expect(screen.queryByText('the final answer')).toBeNull();
    expect(screen.getByText('where is odesa?')).toBeTruthy();
  });

  // The tab's half of the contract: a blank answer adds no turn rather than an empty bubble.
  test('adds no trailing turn for an answer that is blank', () => {
    renderPanel({ response: response({ text: '   ' }) });

    expect(screen.queryByRole('group', { name: ConversationsTraceI18nKey.InspectorRoleAssistant })).toBeNull();
    expect(screen.getByText('where is odesa?')).toBeTruthy();
  });

  test('adds no trailing turn while the response read is still outstanding', () => {
    renderPanel({ response: null, isResponseLoading: true });

    expect(screen.queryByText('the final answer')).toBeNull();
    expect(screen.getByText('where is odesa?')).toBeTruthy();
  });

  // The history is gated by the request column and is the substance of the tab; the answer is gated by its
  // own, and its absence is a statement rather than a missing turn.
  test('states that the answer is withheld while still rendering the history', () => {
    renderPanel({ response: null, isResponseGranted: false });

    expect(screen.getByText(ConversationsTraceI18nKey.InspectorChatAnswerWithheld)).toBeTruthy();
    expect(screen.getByText('where is odesa?')).toBeTruthy();
  });

  // A conversation view that silently truncates is worse than a list that admits it, so a clamped turn keeps
  // the tier-2 read the request's own history offers.
  test('opens a clamped turn in full on demand', async () => {
    const user = userEvent.setup();
    getConversationHopMessage.mockResolvedValue({
      success: true,
      response: { state: HopReadState.Available, text: 'the whole prompt', toolCalls: [] },
    });
    renderPanel({ request: request({ messages: [message(0, MessageRole.User, 'clamped…', [], true)] }) });

    await user.click(screen.getByRole('button', { name: ConversationsTraceI18nKey.InspectorShowFullMessage }));

    await waitFor(() => expect(screen.getByText('the whole prompt')).toBeTruthy());
    expect(getConversationHopMessage).toHaveBeenCalledOnce();
  });

  test('offers no full-text control for a turn that was not clamped', () => {
    renderPanel();

    expect(screen.queryByRole('button', { name: ConversationsTraceI18nKey.InspectorShowFullMessage })).toBeNull();
  });

  test('states that the envelope clamped rather than dropping turns silently', () => {
    renderPanel({ request: request({ isClamped: true }) });

    expect(screen.getByText(ConversationsTraceI18nKey.InspectorEnvelopeClamped)).toBeTruthy();
  });

  test('states that the span received no conversation rather than rendering an empty one', () => {
    renderPanel({ request: request({ messages: [] }) });

    expect(screen.getByText(ConversationsTraceI18nKey.InspectorChatNoMessages)).toBeTruthy();
    expect(screen.queryByRole('group', { name: ConversationsTraceI18nKey.InspectorChatLabel })).toBeNull();
  });

  // A dialect no parser claims has no conversation to lay out; the raw body is the request tab's answer.
  test('states an unstructured body rather than laying out a conversation', () => {
    renderPanel({ request: request({ state: HopReadState.Unstructured, messages: [] }) });

    expect(screen.getByText(ConversationsTraceI18nKey.InspectorUnstructured)).toBeTruthy();
  });

  test('shows a loading state while the request read is outstanding', () => {
    renderPanel({ request: null, isRequestLoading: true });

    expect(screen.getByLabelText(ConversationsTraceI18nKey.InspectorLoading)).toBeTruthy();
  });

  test('issues no read of its own for the conversation it renders', () => {
    renderPanel();

    expect(getConversationHopMessage).not.toHaveBeenCalled();
  });
});
