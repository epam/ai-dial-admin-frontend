import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IDatasource, IGetRowsParams } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationsTraceView from '@/src/components/Analytics/ConversationsTrace/ConversationsTraceView';
import { PAGE_SIZE } from '@/src/constants/ag-grid';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationPageRequest,
  ConversationRow,
  ConversationTotals,
  FeedbackFilter,
} from '@/src/models/analytics/conversations-trace';

const getConversations = vi.fn();
const getConversationTotals = vi.fn();
const getRatedChatIds = vi.fn();

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversations: (...args: unknown[]) => getConversations(...args),
  getConversationTotals: (...args: unknown[]) => getConversationTotals(...args),
  getRatedChatIds: (...args: unknown[]) => getRatedChatIds(...args),
}));

const showNotificationSpy = vi.fn();

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationSpy }),
}));

let datasource: IDatasource | undefined;

vi.mock('@/src/components/Analytics/ConversationsTrace/List/ConversationsList', () => ({
  default: (props: { datasource: IDatasource }) => {
    datasource = props.datasource;
    return <section aria-label="conversations" />;
  },
}));

const row = (overrides: Partial<ConversationRow> = {}): ConversationRow => ({
  chat_id: '9f2c4b17-6d3a-4e58-b0c1-7ae95f83d204',
  project_id: 'data-team',
  user_hash: 'db7327ba3decd351',
  turn_count: 3,
  total_tokens: 10240,
  total_price: '0.090342871559',
  last_request_time: '2026-07-28T09:41:12.318Z',
  first_request_time: '2026-07-28T09:35:12.318Z',
  rating_up: 0,
  rating_down: 0,
  ...overrides,
});

const FIRST_PAGE = [row()];
const SECOND_PAGE = [row({ chat_id: 'c41e8a90-2f76-4bd3-9e05-18c7b6a4f2de', project_id: 'acme-support-bot' })];

const TOTALS: ConversationTotals = { conversations: 212, cost: '654.07' };

const searchBox = () => screen.getByPlaceholderText(ConversationsTraceI18nKey.SearchPlaceholder);

const lastRequest = (): ConversationPageRequest => getConversations.mock.calls.at(-1)?.[0];

const okPage = (rows: ConversationRow[], total: number | null) => ({ success: true, response: { rows, total } });

// Drives the block the grid would have requested, and reports back what the grid would have been told.
const fetchBlock = async (startRow = 0, endRow = PAGE_SIZE) => {
  const params = {
    startRow,
    endRow,
    successCallback: vi.fn(),
    failCallback: vi.fn(),
    sortModel: [],
    filterModel: {},
    context: undefined,
  } as unknown as IGetRowsParams;

  await datasource?.getRows(params);
  return params;
};

const awaitFilterApplied = async () => {
  const previous = datasource;
  await waitFor(() => expect(datasource).not.toBe(previous));
};

const renderView = (totals: ConversationTotals | null = TOTALS, hasInitialLoadError = false) =>
  render(<ConversationsTraceView initialTotals={totals} hasInitialLoadError={hasInitialLoadError} />);

beforeEach(() => {
  datasource = undefined;
  showNotificationSpy.mockReset();
  getRatedChatIds.mockReset();
  getConversationTotals.mockReset();
  getConversationTotals.mockResolvedValue({ success: true, response: TOTALS });
  getConversations.mockReset();
  getConversations.mockResolvedValue(okPage(FIRST_PAGE, 212));
});

describe('ConversationsTraceView :: header', () => {
  test('renders the page heading and the provenance line', () => {
    renderView();

    expect(screen.getByRole('heading', { name: ConversationsTraceI18nKey.Title })).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.ComposedOver)).toBeInTheDocument();
  });

  // The prefetched totals cover the whole filtered result, so the count is exact from first paint.
  test('shows the prefetched whole-result count with no approximation marker', () => {
    renderView();

    expect(screen.getByText('212')).toBeInTheDocument();
    expect(screen.queryByText('212+')).not.toBeInTheDocument();
  });

  test('reports the totals as unavailable when the prefetch failed', () => {
    renderView(null, true);

    expect(screen.getAllByText('—')).toHaveLength(2);
  });
});

describe('ConversationsTraceView :: paging', () => {
  test('requests the first block with a zero offset and the shared page size', async () => {
    renderView();

    await fetchBlock();

    expect(lastRequest()).toMatchObject({ offset: 0, limit: PAGE_SIZE, search: '', feedback: FeedbackFilter.All });
  });

  test('tells the grid the total so it stops at the end of the result', async () => {
    renderView();

    const params = await fetchBlock();

    expect(params.successCallback).toHaveBeenCalledWith(FIRST_PAGE, 212);
  });

  test('requests a later block with a larger offset, changing nothing else', async () => {
    renderView();

    await fetchBlock();
    const first = lastRequest();

    getConversations.mockResolvedValue(okPage(SECOND_PAGE, 212));
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);
    const second = lastRequest();

    expect(second.offset).toBe(PAGE_SIZE);
    expect({ ...second, offset: 0 }).toEqual({ ...first, offset: 0 });
  });

  test('a filter change restarts paging from the first block', async () => {
    const user = userEvent.setup();
    renderView();

    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);
    await user.type(searchBox(), 'acme');
    await awaitFilterApplied();

    getConversations.mockClear();
    await fetchBlock();

    expect(lastRequest()).toMatchObject({ offset: 0, search: 'acme' });
  });

  test('resolves the feedback candidates once and reuses them across blocks', async () => {
    const user = userEvent.setup();
    getRatedChatIds.mockResolvedValue({ success: true, response: { ids: ['a', 'b'] } });
    renderView();

    await user.click(screen.getByText(ConversationsTraceI18nKey.FeedbackNegative));

    await fetchBlock();
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);

    expect(getRatedChatIds).toHaveBeenCalledTimes(1);
    expect(lastRequest().chatIds).toEqual(['a', 'b']);
  });
});

describe('ConversationsTraceView :: filters', () => {
  test('a search term is debounced into one request carrying the term', async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(searchBox(), 'acme');
    expect(searchBox()).toHaveValue('acme');
    await awaitFilterApplied();

    await fetchBlock();

    expect(lastRequest()).toMatchObject({ search: 'acme' });
    const terms = getConversations.mock.calls.map((call) => (call[0] as ConversationPageRequest).search);
    expect(Array.from(new Set(terms.filter(Boolean)))).toEqual(['acme']);
  });

  test('a feedback change requeries immediately without waiting out the search debounce', async () => {
    const user = userEvent.setup();
    getRatedChatIds.mockResolvedValue({ success: true, response: { ids: ['a'] } });
    renderView();

    await user.click(screen.getByText(ConversationsTraceI18nKey.FeedbackPositive));
    await fetchBlock();

    expect(lastRequest()).toMatchObject({ feedback: FeedbackFilter.Positive });
  });
});

describe('ConversationsTraceView :: summary figures', () => {
  test('re-resolves the whole-result figures when the first block is fetched', async () => {
    renderView();

    expect(getConversationTotals).not.toHaveBeenCalled();

    await fetchBlock();

    expect(getConversationTotals).toHaveBeenCalledOnce();
    expect(getConversationTotals.mock.calls.at(-1)?.[0]).toMatchObject({ search: '', feedback: FeedbackFilter.All });
  });

  test('does not re-resolve them for a later block', async () => {
    renderView();

    await fetchBlock();
    getConversationTotals.mockClear();
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);

    expect(getConversationTotals).not.toHaveBeenCalled();
  });

  test('carries the feedback candidates the first block resolved into the figures', async () => {
    const user = userEvent.setup();
    getRatedChatIds.mockResolvedValue({ success: true, response: { ids: ['a', 'b'] } });
    renderView();

    await user.click(screen.getByText(ConversationsTraceI18nKey.FeedbackNegative));
    await fetchBlock();

    expect(getRatedChatIds).toHaveBeenCalledOnce();
    expect(getConversationTotals.mock.calls.at(-1)?.[1]).toEqual(['a', 'b']);
  });

  test('counts a conversation delivered in two blocks only once', async () => {
    renderView();

    await fetchBlock();
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);

    await waitFor(() => expect(screen.getByText('0/1')).toBeInTheDocument());
  });

  test('counts distinct conversations across blocks', async () => {
    renderView();

    await fetchBlock();
    getConversations.mockResolvedValue(okPage(SECOND_PAGE, 212));
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);

    await waitFor(() => expect(screen.getByText('0/2')).toBeInTheDocument());
  });

  test('keeps the conversations loaded after block 0 when block 0 is re-fetched', async () => {
    renderView();

    await fetchBlock();
    getConversations.mockResolvedValue(okPage(SECOND_PAGE, 212));
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);
    getConversations.mockResolvedValue(okPage(FIRST_PAGE, 212));
    await fetchBlock();

    await waitFor(() => expect(screen.getByText('0/2')).toBeInTheDocument());
  });

  test('starts the count over when the filter state changes', async () => {
    const user = userEvent.setup();
    renderView();

    await fetchBlock();
    getConversations.mockResolvedValue(okPage(SECOND_PAGE, 212));
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);

    await user.type(searchBox(), 'acme');
    await awaitFilterApplied();
    await fetchBlock();

    await waitFor(() => expect(screen.getByText('0/1')).toBeInTheDocument());
  });
});

describe('ConversationsTraceView :: empty and failed states', () => {
  test('renders the no-data state when the result holds no conversations', async () => {
    getConversations.mockResolvedValue(okPage([], 0));
    renderView();

    await fetchBlock();

    await waitFor(() => expect(screen.getByText(ConversationsTraceI18nKey.NoConversations)).toBeInTheDocument());
  });

  // An emptied grid alone cannot be told apart from a period that genuinely held no conversations.
  test('a failed block raises a notification and says so in the empty state', async () => {
    getConversations.mockResolvedValue({ success: false, status: 500 });
    renderView();

    const params = await fetchBlock();

    expect(params.failCallback).toHaveBeenCalled();
    expect(showNotificationSpy).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByText(ConversationsTraceI18nKey.ConversationsLoadFailed)).toBeInTheDocument(),
    );
  });

  test('a failed later block keeps the rows already loaded', async () => {
    renderView();

    await fetchBlock();
    await waitFor(() => expect(screen.getByText('0/1')).toBeInTheDocument());

    getConversations.mockResolvedValue({ success: false, status: 500 });
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);

    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  test('a successful block clears an earlier failure', async () => {
    getConversations.mockResolvedValue({ success: false, status: 500 });
    renderView();
    await fetchBlock();

    getConversations.mockResolvedValue(okPage(FIRST_PAGE, 212));
    await fetchBlock();

    await waitFor(() =>
      expect(screen.queryByText(ConversationsTraceI18nKey.ConversationsLoadFailed)).not.toBeInTheDocument(),
    );
  });

  test('reports the totals as unavailable when the totals request fails', async () => {
    getConversationTotals.mockResolvedValue({ success: false, status: 500 });
    renderView();

    await fetchBlock();

    await waitFor(() => expect(screen.getAllByText('—')).toHaveLength(2));
  });

  test('keeps the figures when the rows fail but the totals query succeeded', async () => {
    getConversations.mockResolvedValue({ success: false, status: 500 });
    renderView();

    await fetchBlock();

    await waitFor(() => expect(screen.getByText('212')).toBeInTheDocument());
  });

  test('reports the figures as unavailable when the feedback candidates fail to resolve', async () => {
    const user = userEvent.setup();
    getRatedChatIds.mockResolvedValue({ success: false, status: 500 });
    renderView();

    await user.click(screen.getByText(ConversationsTraceI18nKey.FeedbackNegative));
    await fetchBlock();

    await waitFor(() => expect(screen.getAllByText('—')).toHaveLength(2));
    expect(getConversationTotals).not.toHaveBeenCalled();
  });
});
