import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Column, ColumnVisibleEvent, GridApi, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ConversationsTraceView from '@/src/components/Analytics/ConversationsTrace/ConversationsTraceView';
import { PAGE_SIZE } from '@/src/constants/ag-grid';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import {
  CONVERSATIONS_HEADER_STACK_HEIGHT,
  CONVERSATIONS_TIME_PERIOD,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import {
  ConversationCandidateIds,
  ConversationColumn,
  ConversationFilterOperator,
  ConversationPageRequest,
  ConversationRow,
  ConversationPeriodSummary,
  ConversationsField,
  FeedbackFilter,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QuerySortDirection, QueryValueType } from '@/src/models/analytics/query';

const getConversations = vi.fn();

vi.mock('@/src/app/[lang]/conversations-trace/actions', () => ({
  getConversations: (...args: unknown[]) => getConversations(...args),
}));

const showNotificationSpy = vi.fn();

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationSpy }),
}));

let datasource: IDatasource | undefined;
let columnState: { colId: string; hide: boolean }[] = [];
let columnVisibleHandler: ((event: ColumnVisibleEvent) => void) | undefined;

vi.mock('@/src/components/Analytics/ConversationsTrace/List/ConversationsList', () => ({
  default: (props: { datasource: IDatasource; onGridReady: (event: GridReadyEvent) => void }) => {
    datasource = props.datasource;
    onReady = props.onGridReady;
    return <section aria-label="conversations" />;
  },
}));

let onReady: ((event: GridReadyEvent) => void) | undefined;

const purgeInfiniteCache = vi.fn();
const setFilterModel = vi.fn();
let filterModel: Record<string, unknown> = {};

const gridApi = {
  setGridOption: vi.fn(),
  getColumnState: () => columnState,
  getFilterModel: () => filterModel,
  setFilterModel,
  purgeInfiniteCache,
  addEventListener: (event: string, handler: (event: ColumnVisibleEvent) => void) => {
    if (event === 'columnVisible') {
      columnVisibleHandler = handler;
    }
  },
  removeEventListener: vi.fn(),
} as unknown as GridApi;

const revealColumn = (colId: string) =>
  columnVisibleHandler?.({
    visible: true,
    columns: [{ getColId: () => colId } as Column],
  } as ColumnVisibleEvent);

const hideColumn = (colId: string) =>
  columnVisibleHandler?.({
    visible: false,
    columns: [{ getColId: () => colId } as Column],
  } as ColumnVisibleEvent);

// `onGridReady` fires outside act(), so the grid-api state it sets — and the listener the hook registers
// from it — land on a later flush.
const awaitGridReady = () => waitFor(() => expect(columnVisibleHandler).toBeDefined());

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

const PERIOD: ConversationPeriodSummary = {
  totals: { conversations: 212, cost: '654.07' },
  ratings: { rated: 19, negative: 13 },
};

const searchBox = () => screen.getByPlaceholderText(ConversationsTraceI18nKey.SearchPlaceholder);

const lastRequest = (): ConversationPageRequest => getConversations.mock.calls.at(-1)?.[0];

interface PageExtras {
  period?: ConversationPeriodSummary;
  candidates?: ConversationCandidateIds;
}

// A first page carries the period figures and any candidate ids; a later page carries neither.
const okPage = (rows: ConversationRow[], extras: PageExtras = { period: PERIOD }) => ({
  success: true,
  response: {
    rows,
    total: extras.period?.totals ? Number(extras.period.totals.conversations) : null,
    ...extras,
  },
});

const laterPage = (rows: ConversationRow[]) => ({ success: true, response: { rows, total: null } });

// Drives the block the grid would have requested, and reports back what the grid would have been told.
interface BlockModels {
  sortModel?: unknown[];
  filterModel?: Record<string, unknown>;
}

const fetchBlock = async (startRow = 0, endRow = PAGE_SIZE, models: BlockModels = {}) => {
  const params = {
    startRow,
    endRow,
    successCallback: vi.fn(),
    failCallback: vi.fn(),
    sortModel: models.sortModel ?? [],
    filterModel: models.filterModel ?? {},
    context: undefined,
  } as unknown as IGetRowsParams;

  await datasource?.getRows(params);
  return params;
};

const awaitFilterApplied = async () => {
  const previous = datasource;
  await waitFor(() => expect(datasource).not.toBe(previous));
};

// Every field here gets a column, so every one reaches the projection, in the bucket its cost puts it in.
const SCHEMA_FIELDS = [
  { name: ConversationsField.ChatId, type: AnalyticsFieldType.String, source: ConversationsField.ChatId },
  { name: ConversationsField.TotalTokens, type: AnalyticsFieldType.Integer, source: ConversationsField.TotalTokens },
  { name: ConversationsField.InsightTopics, type: AnalyticsFieldType.String, source: 'topics' },
] as AnalyticsEntityField[];

const renderView = (schemaFields?: AnalyticsEntityField[]) => {
  const result = render(<ConversationsTraceView schemaFields={schemaFields} />);
  onReady?.({ api: gridApi } as GridReadyEvent);
  return result;
};

beforeEach(() => {
  datasource = undefined;
  onReady = undefined;
  columnState = [];
  columnVisibleHandler = undefined;
  filterModel = {};
  setFilterModel.mockReset();
  purgeInfiniteCache.mockReset();
  showNotificationSpy.mockReset();
  getConversations.mockReset();
  getConversations.mockResolvedValue(okPage(FIRST_PAGE));
});

describe('ConversationsTraceView :: header', () => {
  test('renders the page heading and the provenance line', () => {
    renderView();

    expect(screen.getByRole('heading', { name: ConversationsTraceI18nKey.Title })).toBeInTheDocument();
    expect(screen.getByText(ConversationsTraceI18nKey.ComposedOver)).toBeInTheDocument();
  });

  // Nothing is prefetched on the server, so the figures are pending until the client's first fetch — and
  // pending reads as unavailable rather than as zero, which would assert a result never established.
  test('reports the figures as pending before the first block is fetched', () => {
    renderView();

    expect(screen.getAllByText('—')).toHaveLength(4);
  });

  test('shows the period count with no approximation marker once the first block lands', async () => {
    renderView();

    await fetchBlock();

    await waitFor(() => expect(screen.getByText('212')).toBeInTheDocument());
    expect(screen.queryByText('212+')).not.toBeInTheDocument();
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

  // One request per fetch cycle: the candidates, the summary and the rows all come back from it.
  test('fetches a block with a single server call', async () => {
    renderView();

    await fetchBlock();

    expect(getConversations).toHaveBeenCalledOnce();
  });

  test('requests a later block with a larger offset, changing nothing else', async () => {
    renderView();

    await fetchBlock();
    const first = lastRequest();

    getConversations.mockResolvedValue(laterPage(SECOND_PAGE));
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);
    const second = lastRequest();

    expect(second.offset).toBe(PAGE_SIZE);
    expect({ ...second, offset: 0 }).toEqual({ ...first, offset: 0 });
  });

  // Without a total the end of the result is unknown until a block comes back short, which is the signal
  // the grid already terminates on.
  test('falls back to a short block when the summary is unavailable', async () => {
    getConversations.mockResolvedValue({ success: true, response: { rows: FIRST_PAGE, total: null } });
    renderView();

    const params = await fetchBlock();

    expect(params.successCallback).toHaveBeenCalledWith(FIRST_PAGE, FIRST_PAGE.length);
  });

  test('leaves the end of the result unknown when a full block arrives without a total', async () => {
    const fullBlock = Array.from({ length: PAGE_SIZE }, (_unused, index) => row({ chat_id: `c${index}` }));
    getConversations.mockResolvedValue({ success: true, response: { rows: fullBlock, total: null } });
    renderView();

    const params = await fetchBlock();

    expect(params.successCallback).toHaveBeenCalledWith(fullBlock, undefined);
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
});

describe('ConversationsTraceView :: feedback candidates', () => {
  const CANDIDATES: ConversationCandidateIds = { ids: ['a', 'b'], isCapped: false };

  const selectNegative = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByText(ConversationsTraceI18nKey.FeedbackNegative));
  };

  test('sends no ids on the first block, letting the request resolve them', async () => {
    getConversations.mockResolvedValue(okPage(FIRST_PAGE, { period: PERIOD, candidates: CANDIDATES }));
    renderView();

    await selectNegative();
    await fetchBlock();

    expect(lastRequest().chatIds).toBeUndefined();
  });

  test('carries the ids the first block returned into a later block', async () => {
    getConversations.mockResolvedValue(okPage(FIRST_PAGE, { period: PERIOD, candidates: CANDIDATES }));
    renderView();

    await selectNegative();
    await fetchBlock();

    getConversations.mockResolvedValue(laterPage(SECOND_PAGE));
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);

    expect(lastRequest().chatIds).toEqual(['a', 'b']);
  });

  test('does not carry ids resolved under a previous filter state', async () => {
    const user = userEvent.setup();
    getConversations.mockResolvedValue(okPage(FIRST_PAGE, { period: PERIOD, candidates: CANDIDATES }));
    renderView();

    await selectNegative();
    await fetchBlock();

    await user.click(screen.getByText(ConversationsTraceI18nKey.FeedbackPositive));
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);

    expect(lastRequest().chatIds).toBeUndefined();
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
    renderView();

    await user.click(screen.getByText(ConversationsTraceI18nKey.FeedbackPositive));
    await fetchBlock();

    expect(lastRequest()).toMatchObject({ feedback: FeedbackFilter.Positive });
  });
});

describe('ConversationsTraceView :: sort and column filters', () => {
  const SORT_MODEL = [{ colId: ConversationsField.TotalPrice, sort: 'desc' }];
  const FILTER_MODEL = { [ConversationsField.ProjectId]: { type: 'contains', filter: 'acme' } };

  test('a sort model reaches the server action as sort keys', async () => {
    renderView();

    await fetchBlock(0, PAGE_SIZE, { sortModel: SORT_MODEL });

    expect(lastRequest().sort).toEqual([{ field: ConversationsField.TotalPrice, direction: QuerySortDirection.Desc }]);
  });

  test('a filter model reaches the server action as column filters', async () => {
    renderView();

    await fetchBlock(0, PAGE_SIZE, { filterModel: FILTER_MODEL });

    expect(lastRequest().columnFilters).toEqual([
      {
        field: ConversationsField.ProjectId,
        operator: ConversationFilterOperator.Contains,
        value: 'acme',
        valueType: QueryValueType.String,
      },
    ]);
  });

  // Narrowing the fetched blocks client-side would report a slice as the whole answer.
  test('changing the filter model re-requests the first block under the new filter', async () => {
    renderView();

    await fetchBlock();
    getConversations.mockResolvedValue(laterPage(SECOND_PAGE));
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);

    getConversations.mockResolvedValue(okPage(SECOND_PAGE));
    await fetchBlock(0, PAGE_SIZE, { filterModel: FILTER_MODEL });

    expect(lastRequest()).toMatchObject({ offset: 0 });
    expect(lastRequest().columnFilters).toEqual([
      {
        field: ConversationsField.ProjectId,
        operator: ConversationFilterOperator.Contains,
        value: 'acme',
        valueType: QueryValueType.String,
      },
    ]);
  });
});

describe('ConversationsTraceView :: capped feedback result', () => {
  const cappedIds: ConversationCandidateIds = {
    ids: Array.from({ length: 1000 }, (_unused, index) => `c${index}`),
    isCapped: true,
  };

  const selectNegative = async () => {
    const user = userEvent.setup();
    await user.click(screen.getByText(ConversationsTraceI18nKey.FeedbackNegative));
  };

  test('discloses that a capped feedback result may be incomplete', async () => {
    getConversations.mockResolvedValue(okPage(FIRST_PAGE, { period: PERIOD, candidates: cappedIds }));
    renderView();

    await selectNegative();
    await fetchBlock();

    await waitFor(() => expect(screen.getByText(ConversationsTraceI18nKey.FeedbackCappedNotice)).toBeInTheDocument());
  });

  test('shows no disclosure when the candidate set is below the limit', async () => {
    getConversations.mockResolvedValue(
      okPage(FIRST_PAGE, { period: PERIOD, candidates: { ids: ['a'], isCapped: false } }),
    );
    renderView();

    await selectNegative();
    await fetchBlock();

    expect(screen.queryByText(ConversationsTraceI18nKey.FeedbackCappedNotice)).not.toBeInTheDocument();
  });

  test('drops the disclosure when the request fails', async () => {
    getConversations.mockResolvedValue({ success: false, status: 500 });
    renderView();

    await selectNegative();
    await fetchBlock();

    expect(screen.queryByText(ConversationsTraceI18nKey.FeedbackCappedNotice)).not.toBeInTheDocument();
  });

  test('clears the disclosure when the feedback filter returns to all', async () => {
    const user = userEvent.setup();
    getConversations.mockResolvedValue(okPage(FIRST_PAGE, { period: PERIOD, candidates: cappedIds }));
    renderView();

    await selectNegative();
    await fetchBlock();
    await waitFor(() => expect(screen.getByText(ConversationsTraceI18nKey.FeedbackCappedNotice)).toBeInTheDocument());

    await user.click(screen.getByText(ConversationsTraceI18nKey.FeedbackAll));
    getConversations.mockResolvedValue(okPage(FIRST_PAGE));
    await fetchBlock();

    await waitFor(() =>
      expect(screen.queryByText(ConversationsTraceI18nKey.FeedbackCappedNotice)).not.toBeInTheDocument(),
    );
  });
});

describe('ConversationsTraceView :: schema availability', () => {
  test('reports that the additional columns are unavailable when the schema could not be read', () => {
    render(<ConversationsTraceView schemaFields={null} hasSchemaError />);

    expect(screen.getByText(ConversationsTraceI18nKey.SchemaUnavailableNotice)).toBeInTheDocument();
  });

  test('says nothing about the schema when it was read', () => {
    renderView(SCHEMA_FIELDS);

    expect(screen.queryByText(ConversationsTraceI18nKey.SchemaUnavailableNotice)).not.toBeInTheDocument();
  });

  test('still renders the curated columns when the schema is unavailable', () => {
    render(<ConversationsTraceView schemaFields={null} hasSchemaError />);

    expect(screen.getByRole('heading', { name: ConversationsTraceI18nKey.Title })).toBeInTheDocument();
  });
});

describe('ConversationsTraceView :: projection', () => {
  // A cheap source field is projected whether or not its column is on screen, which makes revealing it free.
  test('sends every source-backed field even with its column hidden', async () => {
    columnState = [{ colId: ConversationsField.TotalTokens, hide: true }];
    renderView(SCHEMA_FIELDS);
    await waitFor(() => expect(datasource).toBeDefined());

    await fetchBlock();

    expect(lastRequest().sourceFields).toContain(ConversationsField.TotalTokens);
  });

  test('sends an enrichment-backed field only while its column is visible', async () => {
    columnState = [{ colId: ConversationsField.InsightTopics, hide: false }];
    renderView(SCHEMA_FIELDS);
    await waitFor(() => expect(datasource).toBeDefined());

    await fetchBlock();

    expect(lastRequest().visibleEnrichmentFields).toEqual([ConversationsField.InsightTopics]);
  });

  test('omits a hidden enrichment-backed column', async () => {
    columnState = [{ colId: ConversationsField.InsightTopics, hide: true }];
    renderView(SCHEMA_FIELDS);
    await waitFor(() => expect(datasource).toBeDefined());

    await fetchBlock();

    expect(lastRequest().visibleEnrichmentFields).toEqual([]);
  });

  // The identity column reads the insight title and cannot be hidden, so the field has to reach the query
  // without a column of its own to carry it — every other enrichment field is projected on visibility.
  test('projects the identity column title with no column of its own', async () => {
    columnState = [{ colId: ConversationsField.ChatId, hide: false }];
    renderView([
      ...SCHEMA_FIELDS,
      { name: ConversationsField.InsightTitle, type: AnalyticsFieldType.String, source: 'title' },
    ] as AnalyticsEntityField[]);
    await waitFor(() => expect(datasource).toBeDefined());

    await fetchBlock();

    expect(lastRequest().visibleEnrichmentFields).toContain(ConversationsField.InsightTitle);
  });

  test('never projects a grid-only column, even though it is visible', async () => {
    columnState = [
      { colId: ConversationColumn.Rating, hide: false },
      { colId: ConversationsField.ChatId, hide: false },
    ];
    renderView(SCHEMA_FIELDS);
    await waitFor(() => expect(datasource).toBeDefined());

    await fetchBlock();

    expect(lastRequest().visibleEnrichmentFields).toEqual([]);
  });

  test('sends no schema-driven fields at all when the schema is unavailable', async () => {
    columnState = [{ colId: ConversationsField.TotalTokens, hide: false }];
    renderView();

    await fetchBlock();

    expect(lastRequest().sourceFields).toEqual([]);
    expect(lastRequest().visibleEnrichmentFields).toEqual([]);
  });
});

// The service marks a field heavy when it is expensive to transfer, and omits it from a wildcard projection
// for that reason. Measured on the local rollup, the one heavy field cost 2.7× the other ten columns
// together — so unlike an ordinary source field it is worth gating, and worth a re-fetch when revealed.
const HEAVY_FIELD = 'big_payload';

const HEAVY_SCHEMA_FIELDS = [
  ...SCHEMA_FIELDS,
  { name: HEAVY_FIELD, type: AnalyticsFieldType.String, source: HEAVY_FIELD, heavy: true },
] as AnalyticsEntityField[];

describe('ConversationsTraceView :: projecting a heavy field', () => {
  test('omits a heavy source field while its column is hidden', async () => {
    columnState = [{ colId: HEAVY_FIELD, hide: true }];
    renderView(HEAVY_SCHEMA_FIELDS);
    await waitFor(() => expect(datasource).toBeDefined());

    await fetchBlock();

    expect(lastRequest().sourceFields).not.toContain(HEAVY_FIELD);
    expect(lastRequest().sourceFields).toContain(ConversationsField.TotalTokens);
  });

  test('sends a heavy source field once its column is visible, as a source field', async () => {
    columnState = [{ colId: HEAVY_FIELD, hide: false }];
    renderView(HEAVY_SCHEMA_FIELDS);
    await waitFor(() => expect(datasource).toBeDefined());

    await fetchBlock();

    expect(lastRequest().sourceFields).toContain(HEAVY_FIELD);
    expect(lastRequest().visibleEnrichmentFields).not.toContain(HEAVY_FIELD);
  });

  test('restarts paging when a heavy source column is revealed', async () => {
    renderView(HEAVY_SCHEMA_FIELDS);
    await awaitGridReady();
    await fetchBlock();

    revealColumn(HEAVY_FIELD);

    expect(purgeInfiniteCache).toHaveBeenCalledOnce();
  });
});

describe('ConversationsTraceView :: revealing a column', () => {
  // A source-backed field is already in every row fetched, so there is nothing to re-fetch.
  test('does not restart paging for a source-backed column', async () => {
    renderView(SCHEMA_FIELDS);
    await awaitGridReady();
    await fetchBlock();

    revealColumn(ConversationsField.TotalTokens);

    expect(purgeInfiniteCache).not.toHaveBeenCalled();
  });

  // An enrichment-backed field is absent from the pages already fetched, and a column rendered from an
  // absent value would read as empty data rather than as data not fetched.
  test('restarts paging for an enrichment-backed column', async () => {
    renderView(SCHEMA_FIELDS);
    await awaitGridReady();
    await fetchBlock();

    revealColumn(ConversationsField.InsightTopics);

    expect(purgeInfiniteCache).toHaveBeenCalledOnce();
  });

  test('does not restart paging for a curated column', async () => {
    renderView(SCHEMA_FIELDS);
    await awaitGridReady();
    await fetchBlock();

    revealColumn(ConversationsField.ChatId);

    expect(purgeInfiniteCache).not.toHaveBeenCalled();
  });
});

describe('ConversationsTraceView :: hiding a filtered column', () => {
  // A filter outliving its column keeps narrowing every later page with nothing on screen to explain it, and
  // on an enrichment field the narrowing is severe: only conversations the evaluation has reached can match.
  test('clears the filter the hidden column carried', async () => {
    filterModel = { [ConversationsField.InsightTopics]: { type: 'contains', filter: 'security' } };
    renderView(SCHEMA_FIELDS);
    await awaitGridReady();

    hideColumn(ConversationsField.InsightTopics);

    expect(setFilterModel).toHaveBeenCalledWith({});
  });

  test('leaves every other column filter standing', async () => {
    filterModel = {
      [ConversationsField.InsightTopics]: { type: 'contains', filter: 'security' },
      [ConversationsField.ProjectId]: { type: 'contains', filter: 'data-team' },
    };
    renderView(SCHEMA_FIELDS);
    await awaitGridReady();

    hideColumn(ConversationsField.InsightTopics);

    expect(setFilterModel).toHaveBeenCalledWith({
      [ConversationsField.ProjectId]: { type: 'contains', filter: 'data-team' },
    });
  });

  test('does not touch the filter model when the hidden column carried no filter', async () => {
    filterModel = { [ConversationsField.ProjectId]: { type: 'contains', filter: 'data-team' } };
    renderView(SCHEMA_FIELDS);
    await awaitGridReady();

    hideColumn(ConversationsField.InsightTopics);

    expect(setFilterModel).not.toHaveBeenCalled();
  });

  test('does not re-fetch rows on hide, beyond what clearing a filter costs', async () => {
    renderView(SCHEMA_FIELDS);
    await awaitGridReady();
    await fetchBlock();

    hideColumn(ConversationsField.InsightTopics);

    expect(purgeInfiniteCache).not.toHaveBeenCalled();
  });
});

describe('ConversationsTraceView :: period figures', () => {
  test('resolves the period figures with the first block', async () => {
    renderView();

    expect(getConversations).not.toHaveBeenCalled();

    await fetchBlock();

    await waitFor(() => expect(screen.getByText('212')).toBeInTheDocument());
  });

  test('shows the rating figures the first block resolved, not a count of its rows', async () => {
    renderView();

    await fetchBlock();

    await waitFor(() => expect(screen.getByText('19')).toBeInTheDocument());
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  test('a later block does not restate them', async () => {
    renderView();

    await fetchBlock();
    await waitFor(() => expect(screen.getByText('19')).toBeInTheDocument());

    getConversations.mockResolvedValue(laterPage(SECOND_PAGE));
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);

    expect(screen.getByText('212')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument();
  });

  test('the rating figures do not move as further blocks land', async () => {
    renderView();

    await fetchBlock();
    await waitFor(() => expect(screen.getByText('19')).toBeInTheDocument());

    getConversations.mockResolvedValue(laterPage(SECOND_PAGE));
    await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);
    await fetchBlock(PAGE_SIZE * 2, PAGE_SIZE * 3);

    expect(screen.getByText('19')).toBeInTheDocument();
  });

  // Revealing a source-backed column changes neither the result nor the rows already held.
  test('keeps the figures across a projection change', async () => {
    columnState = [{ colId: 'success_count', hide: true }];
    renderView(SCHEMA_FIELDS);

    await fetchBlock();
    await waitFor(() => expect(screen.getByText('19')).toBeInTheDocument());

    columnState = [{ colId: 'success_count', hide: false }];
    await fetchBlock();

    expect(screen.getByText('19')).toBeInTheDocument();
  });

  test('a search term re-queries without narrowing the figures', async () => {
    const user = userEvent.setup();
    renderView();

    await fetchBlock();
    await waitFor(() => expect(screen.getByText('19')).toBeInTheDocument());

    await user.type(searchBox(), 'acme');
    await awaitFilterApplied();
    await fetchBlock();

    await waitFor(() => expect(lastRequest().search).toBe('acme'));
    expect(screen.getByText('19')).toBeInTheDocument();
    expect(screen.getByText('212')).toBeInTheDocument();
  });

  test('names the selected period on every pill, spelled as the control spells it', async () => {
    renderView();

    await fetchBlock();

    const preset = timePeriodOptionsConfig.find((option) => option.value === CONVERSATIONS_TIME_PERIOD);

    await waitFor(() => expect(screen.getAllByText(preset?.label as string)).toHaveLength(4));
    expect(screen.queryByText(CONVERSATIONS_TIME_PERIOD)).not.toBeInTheDocument();
  });
});

describe('ConversationsTraceView :: empty and failed states', () => {
  test('renders the no-data state when the result holds no conversations', async () => {
    getConversations.mockResolvedValue(
      okPage([], { period: { totals: { conversations: 0, cost: null }, ratings: { rated: 0, negative: 0 } } }),
    );
    renderView();

    await fetchBlock();

    await waitFor(() => expect(screen.getByText(ConversationsTraceI18nKey.NoConversations)).toBeInTheDocument());
  });

  // The state a filter that matched nothing produces. Covering the header stack would hide the very filter
  // inputs the operator needs to undo it, leaving the grid with no way out.
  test('the empty state leaves the grid header and its filter row uncovered', async () => {
    getConversations.mockResolvedValue(
      okPage([], { period: { totals: { conversations: 0, cost: null }, ratings: { rated: 0, negative: 0 } } }),
    );
    renderView();

    await fetchBlock();

    const overlay = (await screen.findByText(ConversationsTraceI18nKey.NoConversations)).closest(
      '[style*="top"]',
    ) as HTMLElement;

    expect(overlay).toBeTruthy();
    expect(overlay.style.top).toBe(`${CONVERSATIONS_HEADER_STACK_HEIGHT}px`);
    expect(overlay.className).not.toContain('inset-0');
  });

  test('the failed state leaves the header uncovered too, so a filter can still be cleared', async () => {
    getConversations.mockResolvedValue({ success: false, status: 500 });
    renderView();

    await fetchBlock();

    const overlay = (await screen.findByText(ConversationsTraceI18nKey.ConversationsLoadFailed)).closest(
      '[style*="top"]',
    ) as HTMLElement;

    expect(overlay.style.top).toBe(`${CONVERSATIONS_HEADER_STACK_HEIGHT}px`);
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

  // A later failure is not an empty result, so the empty state must stay away too.
  test('a failed later block keeps the rows already loaded', async () => {
    renderView();

    const first = await fetchBlock();
    await waitFor(() => expect(screen.getByText('212')).toBeInTheDocument());

    getConversations.mockResolvedValue({ success: false, status: 500 });
    const later = await fetchBlock(PAGE_SIZE, PAGE_SIZE * 2);

    expect(first.successCallback).toHaveBeenCalledWith(FIRST_PAGE, expect.anything());
    expect(later.failCallback).toHaveBeenCalled();
    expect(screen.queryByText(ConversationsTraceI18nKey.NoConversations)).not.toBeInTheDocument();
  });

  test('a successful block clears an earlier failure', async () => {
    getConversations.mockResolvedValue({ success: false, status: 500 });
    renderView();
    await fetchBlock();

    getConversations.mockResolvedValue(okPage(FIRST_PAGE));
    await fetchBlock();

    await waitFor(() =>
      expect(screen.queryByText(ConversationsTraceI18nKey.ConversationsLoadFailed)).not.toBeInTheDocument(),
    );
  });

  test('reports the figures as unavailable when the summary query failed', async () => {
    getConversations.mockResolvedValue({ success: true, response: { rows: FIRST_PAGE, total: null } });
    renderView();

    await fetchBlock();

    await waitFor(() => expect(screen.getAllByText('—')).toHaveLength(4));
  });

  test('keeps the figures when the rows fail but the summary resolved', async () => {
    getConversations.mockResolvedValue({
      success: false,
      status: 500,
      response: { rows: [], total: 212, period: PERIOD },
    });
    renderView();

    await fetchBlock();

    await waitFor(() => expect(screen.getByText('212')).toBeInTheDocument());
  });

  test('reports the figures as unavailable when nothing could be resolved for the filter state', async () => {
    getConversations.mockResolvedValue({ success: false, status: 500 });
    renderView();

    await fetchBlock();

    await waitFor(() => expect(screen.getAllByText('—')).toHaveLength(4));
  });
});
