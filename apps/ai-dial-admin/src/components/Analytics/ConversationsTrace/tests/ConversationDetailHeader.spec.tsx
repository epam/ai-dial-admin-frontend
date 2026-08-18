import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationDetailHeader from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailHeader';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationDetailRow } from '@/src/models/analytics/conversations-trace';

const CHAT_ID = 'Lrr0e6L5bpTND3IY_dN0_';
const NOW_MS = Date.parse('2026-07-22T12:12:52.157Z');

const CONVERSATION: ConversationDetailRow = {
  chat_id: CHAT_ID,
  project_id: 'internal-copilot',
  user_hash: 'db73',
  turn_count: 911,
  first_request_time: '2026-07-22T11:50:28.506Z',
  last_request_time: '2026-07-22T12:00:52.157Z',
  prompt_tokens: 1,
  completion_tokens: 2,
  total_tokens: 3,
  total_price: '0.1',
  success_count: 908,
  duration_ms: 0,
  avg_duration_ms: 0,
};

const renderHeader = (overrides: Partial<ConversationDetailRow> = {}) =>
  render(<ConversationDetailHeader conversation={{ ...CONVERSATION, ...overrides }} nowMs={NOW_MS} />);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ConversationDetailHeader', () => {
  test('leads with the conversation id as the heading', () => {
    renderHeader();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(CHAT_ID);
  });

  test('offers a copy control for the conversation id', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: 'copy' })).toBeTruthy();
  });

  test('renders the title field as unavailable, since nothing supplies one', () => {
    renderHeader();

    expect(screen.getByText(ConversationsTraceI18nKey.DetailTitleField).parentElement).toHaveTextContent(
      UNAVAILABLE_VALUE,
    );
  });

  test('renders the model field as unavailable, since the rollup carries no deployment', () => {
    renderHeader();

    expect(screen.getByText(ConversationsTraceI18nKey.DetailModel).parentElement).toHaveTextContent(UNAVAILABLE_VALUE);
  });

  // turn_count counts distinct traces, so turn, request and trace are one quantity — stating it twice
  // under two labels would present one fact as two.
  test('states the turn count once, read from the rollup', () => {
    renderHeader();

    expect(screen.getByText(ConversationsTraceI18nKey.DetailTurns).parentElement).toHaveTextContent('911');
    // The retired label, spelled out because the key no longer exists; the mocked t() renders keys verbatim.
    expect(screen.queryByText('ConversationsTrace.DetailRequests')).toBeNull();
  });

  // The header takes no turn-list prop, so the bounded list cannot reach it — 911 turns behind a list
  // bounded at 200 must still read 911.
  test('reports the whole conversation, not the turns the view loaded', () => {
    renderHeader();

    expect(screen.getByText(ConversationsTraceI18nKey.DetailTurns).parentElement).toHaveTextContent('911');
    expect(screen.queryByText('200')).toBeNull();
  });

  test('renders the turn count as unavailable when the rollup carries none', () => {
    renderHeader({ turn_count: null });

    expect(screen.getByText(ConversationsTraceI18nKey.DetailTurns).parentElement).toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('states the project when the conversation has one', () => {
    renderHeader();

    expect(screen.getByText('internal-copilot')).toBeTruthy();
  });

  test('marks an empty project distinctly from an unavailable field', () => {
    renderHeader({ project_id: '' });

    expect(screen.getByText(ConversationsTraceI18nKey.NoProject)).toBeTruthy();
  });

  test('renders the activity span and the time since last activity', () => {
    renderHeader();

    expect(screen.getByText('10 min')).toBeTruthy();
    expect(screen.getByText('12m ago')).toBeTruthy();
  });

  // Ratings sit with the feedback panel that lists them, and the log is reached through the app's own
  // navigation, so neither belongs in this header.
  test('carries no rating counts and no back control', () => {
    renderHeader();

    expect(screen.queryByText(ConversationsTraceI18nKey.RatingUp)).toBeNull();
    expect(screen.queryByText(ConversationsTraceI18nKey.RatingDown)).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
