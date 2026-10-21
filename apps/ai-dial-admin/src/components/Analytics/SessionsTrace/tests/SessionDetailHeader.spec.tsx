import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import SessionDetailHeader from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailHeader';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { SessionDetailRow } from '@/src/models/analytics/sessions-trace';

const CHAT_ID = 'Lrr0e6L5bpTND3IY_dN0_';
const NOW_MS = Date.parse('2026-07-22T12:12:52.157Z');

const TITLE = 'Refund policy for EU orders';

const SESSION: SessionDetailRow = {
  client_session_id: CHAT_ID,
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
  deployments: ['applications/internal/assistant', 'anthropic_switchyard-model', 'anthropic.claude-opus-4-8'],
  'session_insights.title': TITLE,
};

const renderHeader = (overrides: Partial<SessionDetailRow> = {}) =>
  render(<SessionDetailHeader session={{ ...SESSION, ...overrides }} nowMs={NOW_MS} />);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SessionDetailHeader', () => {
  test('leads with the session name as the heading', () => {
    renderHeader();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Refund policy for EU orders');
  });

  // The id identifies the session everywhere else, so it stays on the page and stays copyable — it is
  // just no longer what the page calls the session.
  test('states the session id in the meta row rather than the heading', () => {
    renderHeader();

    expect(screen.getByText(SessionsTraceI18nKey.DetailId).parentElement).toHaveTextContent(CHAT_ID);
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveTextContent(CHAT_ID);
  });

  test('keeps the copy control beside the id', () => {
    renderHeader();

    const entry = screen.getByText(SessionsTraceI18nKey.DetailId).parentElement;

    expect(entry).toContainElement(screen.getByRole('button', { name: `copy ${SessionsTraceI18nKey.Session}` }));
  });

  test('offers a copy control for the session id', () => {
    renderHeader();

    expect(screen.getByRole('button', { name: `copy ${SessionsTraceI18nKey.Session}` })).toBeTruthy();
  });

  // The heading states it, so a labelled Title field beside it would say the same thing twice.
  test('states the title once, as the heading', () => {
    renderHeader();

    const heading = screen.getByRole('heading', { level: 1 });

    expect(heading).toHaveTextContent(TITLE);
    expect(screen.getAllByText(TITLE)).toHaveLength(1);
  });

  // Falling back to the id would name the session after its own hash, and the id is already on the
  // line below — so the heading says the name is missing instead.
  test('marks the heading unavailable when no insight title exists', () => {
    renderHeader({ 'session_insights.title': null });

    const heading = screen.getByRole('heading', { level: 1 });

    expect(heading).toHaveTextContent(UNAVAILABLE_VALUE);
    expect(heading).not.toHaveTextContent(CHAT_ID);
  });

  // A heading whose only text is a dash names nothing for a screen reader.
  test('gives an untitled session an accessible heading name', () => {
    renderHeader({ 'session_insights.title': null });

    expect(screen.getByLabelText(SessionsTraceI18nKey.NoTitle)).toBeInTheDocument();
  });

  test('does not restate the deployments the metadata panel carries', () => {
    renderHeader();

    expect(screen.queryByText(SessionsTraceI18nKey.Deployments)).toBeNull();
    expect(screen.queryByText(/anthropic\.claude-opus-4-8/)).toBeNull();
  });

  // turn_count counts distinct traces, so turn, request and trace are one quantity — stating it twice
  // under two labels would present one fact as two.
  test('states the turn count once, read from the rollup', () => {
    renderHeader();

    expect(screen.getByText(SessionsTraceI18nKey.DetailTurns).parentElement).toHaveTextContent('911');
    // The retired label, spelled out because the key no longer exists; the mocked t() renders keys verbatim.
    expect(screen.queryByText('SessionsTrace.DetailRequests')).toBeNull();
  });

  // The header takes no turn-list prop, so the bounded list cannot reach it — 911 turns behind a list
  // bounded at 200 must still read 911.
  test('reports the whole session, not the turns the view loaded', () => {
    renderHeader();

    expect(screen.getByText(SessionsTraceI18nKey.DetailTurns).parentElement).toHaveTextContent('911');
    expect(screen.queryByText('200')).toBeNull();
  });

  test('renders the turn count as unavailable when the rollup carries none', () => {
    renderHeader({ turn_count: null });

    expect(screen.getByText(SessionsTraceI18nKey.DetailTurns).parentElement).toHaveTextContent(UNAVAILABLE_VALUE);
  });

  test('states the project when the session has one', () => {
    renderHeader();

    expect(screen.getByText('internal-copilot')).toBeTruthy();
  });

  test('marks an empty project distinctly from an unavailable field', () => {
    renderHeader({ project_id: '' });

    expect(screen.getByText(SessionsTraceI18nKey.NoProject)).toBeTruthy();
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

    expect(screen.queryByText(SessionsTraceI18nKey.RatingUp)).toBeNull();
    expect(screen.queryByText(SessionsTraceI18nKey.RatingDown)).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
