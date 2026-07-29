import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationsTraceView from '@/src/components/Analytics/ConversationsTrace/ConversationsTraceView';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { ConversationRow, FeedbackFilter } from '@/src/models/analytics/conversations-trace';

const getConversations = vi.fn();

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversations: (...args: unknown[]) => getConversations(...args),
}));

const showNotificationSpy = vi.fn();

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationSpy }),
}));

let receivedConversations: ConversationRow[] | undefined;
let receivedLoadError: boolean | undefined;

vi.mock('@/src/components/Analytics/ConversationsTrace/List/ConversationsList', () => ({
  default: ({ conversations, hasLoadError }: { conversations: ConversationRow[]; hasLoadError?: boolean }) => {
    receivedConversations = conversations;
    receivedLoadError = hasLoadError;
    return <section aria-label="conversations" />;
  },
}));

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: '9f2c4b17-6d3a-4e58-b0c1-7ae95f83d204',
  project: 'data-team',
  turns: 3,
  tokens: 10240,
  cost: '0.090342871559',
  last_activity: '2026-07-28T09:41:12.318Z',
  first_activity: '2026-07-28T09:35:12.318Z',
  model: 'gpt-4o',
  model_count: 1,
  title: null,
  snippet: null,
  rating_up: 0,
  rating_down: 0,
  ...overrides,
});

const ROWS: ConversationRow[] = [row()];

const REFETCHED_ROWS: ConversationRow[] = [
  row({
    chat_id: 'c41e8a90-2f76-4bd3-9e05-18c7b6a4f2de',
    project: 'acme-support-bot',
    turns: 4,
    tokens: 8817,
    cost: '0.079318604227',
    last_activity: '2026-07-28T07:16:55.902Z',
  }),
];

const searchBox = () => screen.getByPlaceholderText(ConversationsTraceI18nKey.SearchPlaceholder);

const lastFilters = () => getConversations.mock.calls.at(-1)?.[0];

describe('ConversationsTraceView', () => {
  beforeEach(() => {
    receivedConversations = undefined;
    receivedLoadError = undefined;
    showNotificationSpy.mockReset();
    getConversations.mockReset();
    getConversations.mockResolvedValue({ success: true, response: { rows: REFETCHED_ROWS } });
  });

  test('renders the page heading', () => {
    render(<ConversationsTraceView initialConversations={ROWS} />);

    expect(screen.getByRole('heading', { name: ConversationsTraceI18nKey.Title })).toBeInTheDocument();
  });

  test('renders the filter toolbar', () => {
    render(<ConversationsTraceView initialConversations={ROWS} />);

    expect(searchBox()).toBeInTheDocument();
  });

  test('renders the summary pills from the rows it holds', () => {
    render(<ConversationsTraceView initialConversations={ROWS} />);

    expect(screen.getByText(ConversationsTraceI18nKey.SummaryConversations)).toBeInTheDocument();
    expect(screen.getByText(`${ROWS.length}`)).toBeInTheDocument();
  });

  test('renders the provenance line under the title', () => {
    render(<ConversationsTraceView initialConversations={ROWS} />);

    expect(screen.getByText(ConversationsTraceI18nKey.ComposedOver)).toBeInTheDocument();
  });

  test('hands the prefetched conversations to the list', () => {
    render(<ConversationsTraceView initialConversations={ROWS} />);

    expect(receivedConversations).toEqual(ROWS);
  });

  test('renders the list even with no conversations, so the empty state can show', () => {
    render(<ConversationsTraceView initialConversations={[]} />);

    expect(screen.getByLabelText('conversations')).toBeInTheDocument();
    expect(receivedConversations).toEqual([]);
  });

  test('issues no request on mount', () => {
    render(<ConversationsTraceView initialConversations={ROWS} />);

    expect(getConversations).not.toHaveBeenCalled();
  });
});

describe('ConversationsTraceView :: filters re-query the backend', () => {
  beforeEach(() => {
    receivedConversations = undefined;
    receivedLoadError = undefined;
    showNotificationSpy.mockReset();
    getConversations.mockReset();
    getConversations.mockResolvedValue({ success: true, response: { rows: REFETCHED_ROWS } });
  });

  test('sends a typed search term to the server action', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');

    await waitFor(() => expect(lastFilters()).toMatchObject({ search: 'acme' }));
  });

  test('collects keystrokes into a single request rather than one per character', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');
    await waitFor(() => expect(getConversations).toHaveBeenCalled());

    expect(getConversations).toHaveBeenCalledTimes(1);
  });

  test('replaces the rows with the response rather than narrowing the ones it holds', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');

    await waitFor(() => expect(receivedConversations).toEqual(REFETCHED_ROWS));
  });

  test('shows the typed term immediately, before the request it triggers', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'ac');

    expect(searchBox()).toHaveValue('ac');
  });

  test('sends the range as epoch millis, so no Date crosses the action boundary', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');
    await waitFor(() => expect(getConversations).toHaveBeenCalled());

    const { startMs, endMs } = lastFilters();
    expect(typeof startMs).toBe('number');
    expect(typeof endMs).toBe('number');
    expect(endMs).toBeGreaterThan(startMs);
  });

  test('re-queries with a narrower range when a time preset is chosen', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.click(screen.getByRole('button', { name: /7d/ }));
    await user.click(screen.getByRole('button', { name: 'Last 24h' }));

    await waitFor(() => expect(getConversations).toHaveBeenCalled());
    const { startMs, endMs } = lastFilters();
    const spanHours = (endMs - startMs) / (60 * 60 * 1000);
    expect(Math.round(spanHours)).toBe(24);
  });

  test('carries the applied search term into a later range change', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');
    await waitFor(() => expect(getConversations).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /7d/ }));
    await user.click(screen.getByRole('button', { name: 'Last 24h' }));

    await waitFor(() => expect(getConversations).toHaveBeenCalledTimes(2));
    expect(lastFilters()).toMatchObject({ search: 'acme' });
  });

  test('shows a loader instead of the grid while a filter change is in flight', async () => {
    const user = userEvent.setup();
    let resolveRequest: (value: unknown) => void = () => undefined;
    getConversations.mockReturnValue(new Promise((resolve) => (resolveRequest = resolve)));

    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');

    await waitFor(() => expect(screen.queryByLabelText('conversations')).not.toBeInTheDocument());

    resolveRequest({ success: true, response: { rows: REFETCHED_ROWS } });
    await waitFor(() => expect(screen.getByLabelText('conversations')).toBeInTheDocument());
  });

  test('sends the chosen feedback state to the server action', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.click(screen.getByRole('tab', { name: ConversationsTraceI18nKey.FeedbackPositive }));

    await waitFor(() => expect(lastFilters()).toMatchObject({ feedback: FeedbackFilter.Positive }));
  });

  test('does not debounce a feedback change', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.click(screen.getByRole('tab', { name: ConversationsTraceI18nKey.FeedbackRated }));

    expect(getConversations).toHaveBeenCalledTimes(1);
  });

  test('replaces the rows on a feedback change rather than narrowing the ones it holds', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.click(screen.getByRole('tab', { name: ConversationsTraceI18nKey.FeedbackNegative }));

    await waitFor(() => expect(receivedConversations).toEqual(REFETCHED_ROWS));
  });

  test('defaults to All so the prefetched rows are unfiltered', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');
    await waitFor(() => expect(getConversations).toHaveBeenCalled());

    expect(lastFilters()).toMatchObject({ feedback: FeedbackFilter.All });
  });

  test('carries the applied search term into a feedback change', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');
    await waitFor(() => expect(getConversations).toHaveBeenCalled());

    await user.click(screen.getByRole('tab', { name: ConversationsTraceI18nKey.FeedbackPositive }));

    await waitFor(() => expect(getConversations).toHaveBeenCalledTimes(2));
    expect(lastFilters()).toMatchObject({ search: 'acme', feedback: FeedbackFilter.Positive });
  });

  test('falls back to no rows when a filtered request fails', async () => {
    const user = userEvent.setup();
    getConversations.mockResolvedValue({ success: false, status: 400, errorMessage: 'unknown field' });

    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');

    await waitFor(() => expect(receivedConversations).toEqual([]));
  });

  test('notifies when a filtered request fails, so the empty grid is not read as no traffic', async () => {
    const user = userEvent.setup();
    getConversations.mockResolvedValue({ success: false, status: 400, errorMessage: 'unknown field' });

    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');

    await waitFor(() =>
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: ConversationsTraceI18nKey.ConversationsLoadFailed }),
      ),
    );
  });

  test('tells the list the rows are empty because the request failed', async () => {
    const user = userEvent.setup();
    getConversations.mockResolvedValue({ success: false, status: 400, errorMessage: 'unknown field' });

    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');

    await waitFor(() => expect(receivedLoadError).toBe(true));
  });

  test('does not notify when a request succeeds', async () => {
    const user = userEvent.setup();
    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');
    await waitFor(() => expect(receivedConversations).toEqual(REFETCHED_ROWS));

    expect(showNotificationSpy).not.toHaveBeenCalled();
    expect(receivedLoadError).toBe(false);
  });

  test('clears the failure once a later request succeeds', async () => {
    const user = userEvent.setup();
    getConversations.mockResolvedValueOnce({ success: false, status: 400, errorMessage: 'unknown field' });

    render(<ConversationsTraceView initialConversations={ROWS} />);

    await user.type(searchBox(), 'acme');
    await waitFor(() => expect(receivedLoadError).toBe(true));

    await user.click(screen.getByRole('tab', { name: ConversationsTraceI18nKey.FeedbackPositive }));

    await waitFor(() => expect(receivedLoadError).toBe(false));
    expect(receivedConversations).toEqual(REFETCHED_ROWS);
  });
});

describe('ConversationsTraceView :: a failed server prefetch', () => {
  beforeEach(() => {
    receivedConversations = undefined;
    receivedLoadError = undefined;
    showNotificationSpy.mockReset();
    getConversations.mockReset();
    getConversations.mockResolvedValue({ success: true, response: { rows: REFETCHED_ROWS } });
  });

  test('reports the failure to the list rather than showing an empty period', () => {
    render(<ConversationsTraceView initialConversations={[]} hasInitialLoadError />);

    expect(receivedLoadError).toBe(true);
    expect(receivedConversations).toEqual([]);
  });

  test('still issues no request on mount', () => {
    render(<ConversationsTraceView initialConversations={[]} hasInitialLoadError />);

    expect(getConversations).not.toHaveBeenCalled();
  });
});
