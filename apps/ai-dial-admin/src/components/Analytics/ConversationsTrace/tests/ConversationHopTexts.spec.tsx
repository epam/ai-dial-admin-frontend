import { render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';
import { describe, expect, test } from 'vitest';

import ConversationHopTexts from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationHopTexts';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { HopTextSuppression, HopTextsState } from '@/src/models/analytics/conversations-trace';

const bodies = (overrides: Partial<ComponentProps<typeof ConversationHopTexts>['bodies']> = {}) => ({
  state: HopTextsState.Available,
  sent: 'the prompt',
  received: 'the answer',
  toolCalls: [],
  ...overrides,
});

const renderTexts = (props: Partial<ComponentProps<typeof ConversationHopTexts>> = {}) =>
  render(<ConversationHopTexts bodies={bodies()} isLoading={false} {...props} />);

describe('ConversationHopTexts', () => {
  test('states what the hop sent and what came back', () => {
    renderTexts();

    expect(screen.getByText(ConversationsTraceI18nKey.SpanSent)).toBeInTheDocument();
    expect(screen.getByText('the prompt')).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.SpanReceived)).toBeInTheDocument();
    expect(screen.getByText('the answer')).toBeInTheDocument();
  });

  // A response with no text put its output in tool calls, and those names exist only in a body.
  test('names the tools a hop requested', () => {
    renderTexts({ bodies: bodies({ received: '', toolCalls: ['get_page', 'rag_search'] }) });

    expect(screen.getByText(ConversationsTraceI18nKey.SpanToolCalls)).toBeInTheDocument();
    // One name per line, so RTL normalises the newline to a space.
    expect(screen.getByText('get_page rag_search')).toBeInTheDocument();
  });

  test('omits a side the hop did not record, rather than showing an empty block', () => {
    renderTexts({ bodies: bodies({ sent: null }) });

    expect(screen.queryByText(ConversationsTraceI18nKey.SpanSent)).toBeNull();
    expect(screen.getByText(ConversationsTraceI18nKey.SpanReceived)).toBeInTheDocument();
  });

  test('says it is reading while the hop is in flight', () => {
    renderTexts({ bodies: null, isLoading: true });

    expect(screen.getByLabelText(ConversationsTraceI18nKey.SpanTextsLoading)).toBeInTheDocument();
  });

  // Loading outranks a stale answer: the previous hop's texts must never sit under a new hop's heading.
  test('shows the loading state rather than an earlier hop texts', () => {
    renderTexts({ bodies: bodies({ sent: 'an earlier hop prompt' }), isLoading: true });

    expect(screen.getByLabelText(ConversationsTraceI18nKey.SpanTextsLoading)).toBeInTheDocument();
    expect(screen.queryByText('an earlier hop prompt')).toBeNull();
  });

  // Nothing to say about a column that was never offered, and a notice on every hop would be noise on the
  // expected non-administrator path.
  test('renders nothing at all when the schema withheld the body columns', () => {
    const { container } = renderTexts({ bodies: bodies({ state: HopTextsState.ColumnsUnavailable }) });

    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing when no hop is open', () => {
    const { container } = renderTexts({ bodies: null });

    expect(container).toBeEmptyDOMElement();
  });

  // A hop that recorded nothing readable and a hop whose read failed are different facts.
  test('distinguishes a hop with nothing readable from one whose read failed', () => {
    renderTexts({ bodies: bodies({ state: HopTextsState.NoBodies }) });
    expect(screen.getByText(ConversationsTraceI18nKey.SpanTextsNone)).toBeInTheDocument();

    renderTexts({ bodies: bodies({ state: HopTextsState.LoadFailed }) });
    expect(screen.getByText(ConversationsTraceI18nKey.SpanTextsLoadFailed)).toBeInTheDocument();
  });

  // A hop with nothing worth opening says what it is, rather than showing an empty panel.
  test.each([
    [HopTextSuppression.NoResponse, ConversationsTraceI18nKey.SpanTextsNoResponse],
    [HopTextSuppression.SessionSetup, ConversationsTraceI18nKey.SpanTextsSessionSetup],
    [HopTextSuppression.Embedding, ConversationsTraceI18nKey.SpanTextsEmbedding],
  ])('states why a %s hop has no text', (suppression, key) => {
    renderTexts({ bodies: null, suppression });

    expect(screen.getByText(key)).toBeInTheDocument();
  });

  // The verdict comes from the hop row before any read, so there is nothing in flight to report.
  test('states the reason rather than a loading state for a suppressed hop', () => {
    renderTexts({ bodies: null, isLoading: true, suppression: HopTextSuppression.Embedding });

    expect(screen.getByText(ConversationsTraceI18nKey.SpanTextsEmbedding)).toBeInTheDocument();
    expect(screen.queryByText(ConversationsTraceI18nKey.SpanTextsLoading)).toBeNull();
  });
});
