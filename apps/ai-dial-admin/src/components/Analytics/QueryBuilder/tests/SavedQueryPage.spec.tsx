import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  createSavedQuery,
  deleteSavedQuery,
  translateSqlToQuery,
  updateSavedQuery,
} from '@/src/app/[lang]/queries/actions';
import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import QueryBuilderDraft from '@/src/components/Analytics/QueryBuilder/QueryBuilderDraft';
import { savedQueryPrimarySource } from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import { formatSql } from '@/src/components/Analytics/QueryBuilder/utils/sql-format';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { useAppContext } from '@/src/context/AppContext';
import { AnalyticsEntity, AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  QueryExprType,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryPageType,
  QuerySortDirection,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { ChartConfig, ChartType, QueryResultView } from '@/src/models/analytics/query-builder';
import { ReadFailure } from '@/src/models/server-action';
import { SavedQuery, SavedQueryRequest, SavedQueryScope, SavedQueryTimeMode } from '@/src/models/analytics/saved-query';
import { QueryOutcome } from '@/src/components/Analytics/Common/use-analytics-query';

const runQueryMock = vi.fn(
  async (_query?: unknown): Promise<QueryOutcome> => ({ isSuccess: true, result: { rows: [] } }),
);

// One object for the file: a fresh one per render would change the identity the effects depend on.
const RUNNER = {
  runQuery: runQueryMock,
  runSql: vi.fn(async (): Promise<QueryOutcome> => ({ isSuccess: true, result: { rows: [] } })),
};
vi.mock('@/src/components/Analytics/Common/use-analytics-query', () => ({
  useAnalyticsQuery: () => RUNNER,
}));

vi.mock('@/src/app/[lang]/queries/actions');

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockShowNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification, removeNotification: vi.fn() }),
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({ featureFlags: {}, isFullAdmin: true })),
}));

const setFullAdmin = (isFullAdmin: boolean) =>
  vi.mocked(useAppContext).mockReturnValue({ featureFlags: {}, isFullAdmin } as never);

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData?: unknown[] }) => <div>grid rows: {rowData?.length ?? 0}</div>,
}));

vi.mock('@/src/components/Analytics/QueryBuilder/Sql/SqlEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea aria-label="sql-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock('@/src/components/Analytics/QueryBuilder/Result/ResultArea', () => ({
  default: ({
    result,
    view,
    onChangeView,
    chartConfig,
    onChangeChartConfig,
    actions,
  }: {
    result: unknown;
    view: QueryResultView;
    onChangeView: (view: QueryResultView) => void;
    chartConfig: ChartConfig;
    onChangeChartConfig: (config: ChartConfig) => void;
    actions?: ReactNode;
  }) => (
    <div>
      {actions}
      <span>view: {view}</span>
      <span>result: {result ? 'present' : 'none'}</span>
      <span>
        chart: {chartConfig.type}/{chartConfig.xField ?? 'none'}
      </span>
      <button onClick={() => onChangeView(QueryResultView.Chart)}>use chart view</button>
      <button onClick={() => onChangeChartConfig({ type: ChartType.Pie, xField: 'project_id', yFields: ['count'] })}>
        change axes
      </button>
    </div>
  ),
}));

const ENTITIES: AnalyticsEntity[] = [{ name: 'conversations' }, { name: 'dial_usage_log' }, { name: 'other_table' }];
const FIELDS: AnalyticsEntityField[] = [
  { name: 'event_id', type: AnalyticsFieldType.Uuid, source: 'event_id', tag: 'identity' },
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id', tag: 'lineage' },
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time', tag: 'identity' },
];

const STRUCTURED_BODY: StructuredQuery = {
  entity: 'dial_usage_log',
  mode: QueryMode.Row,
  page: { type: QueryPageType.Offset, limit: 100, offset: 0, include_total: false },
};

const STORED_SQL = 'SELECT count(*) FROM dial_usage_log';
const TRANSLATED_SQL = "SELECT * FROM dial_usage_log WHERE project_id = 'a'";
const EDITED_SQL = 'SELECT project_id FROM dial_usage_log';

const UNREPRESENTABLE_BODY: StructuredQuery = {
  entity: 'dial_usage_log',
  mode: QueryMode.Row,
  filter: {
    op: QueryLogicalOperator.And,
    args: [
      {
        op: QueryLogicalOperator.Or,
        args: [
          {
            op: QueryLogicalOperator.And,
            args: [
              {
                op: QueryOperator.Eq,
                args: [
                  { type: QueryExprType.Field, name: 'project_id' },
                  { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'a' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

const savedQuery = (overrides?: Partial<SavedQuery>): SavedQuery => ({
  id: 'sq_1',
  name: 'Top chats',
  scope: SavedQueryScope.Personal,
  source: ['dial_usage_log'],
  query: STRUCTURED_BODY,
  time: { mode: SavedQueryTimeMode.Relative, period: '7d' },
  result_view: QueryResultView.Table,
  generation: 1,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-02T00:00:00Z',
  ...overrides,
});

interface TranslationProps {
  translatedSql?: string | null;
  translationFailure?: ReadFailure | null;
}

const renderPage = (query: SavedQuery = savedQuery(), translation: TranslationProps = {}) =>
  render(
    <QueryBuilder
      initialEntities={ENTITIES}
      initialEntityName={savedQueryPrimarySource(query)}
      initialFields={FIELDS}
      initialFunctions={TEST_FUNCTIONS}
      name={query.name}
      savedQuery={query}
      {...translation}
    />,
  );

const viewRadio = (name: string) => screen.getByRole('radio', { name });

const saveButton = () => screen.queryByRole('button', { name: 'Buttons.Save' });
const discardButton = () => screen.queryByRole('button', { name: 'Buttons.Discard' });
const sentRequest = () => vi.mocked(updateSavedQuery).mock.calls[0][1] as SavedQueryRequest;
const duplicateButton = () => screen.queryByRole('button', { name: 'Buttons.Duplicate' });
const saveAsNewButton = () => screen.queryByRole('button', { name: 'Queries.SaveAsNewQuery' });
const createdRequest = () => vi.mocked(createSavedQuery).mock.calls[0][0] as SavedQueryRequest;

const openSaveMenu = async (user: ReturnType<typeof userEvent.setup>, item: string) => {
  await user.click(await screen.findByRole('button', { name: 'Buttons.Save' }));
  return screen.findByRole('menuitem', { name: item });
};

const saveInPlace = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(await openSaveMenu(user, 'Buttons.Save'));

const openLimitRows = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('button', { name: /QueryBuilder.Limit/ }));
  return within(await screen.findByRole('dialog')).getByRole('spinbutton', { name: /QueryChips.Rows/ });
};

const editLimit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /QueryBuilder.Limit/ }));
  const dialog = await screen.findByRole('dialog');
  const rows = within(dialog).getByRole('spinbutton', { name: /QueryChips.Rows/ });
  await user.clear(rows);
  await user.type(rows, '50');
  await user.click(within(dialog).getByRole('button', { name: 'Buttons.Apply' }));
};

describe('QueryBuilder — a stored saved query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setFullAdmin(true);
    vi.mocked(updateSavedQuery).mockResolvedValue({ success: true, response: savedQuery({ generation: 2 }) });
    runQueryMock.mockImplementation(() =>
      Promise.resolve({ isSuccess: true, result: { columns: ['project_id'], rows: [{ project_id: 'a' }] } }),
    );
  });

  test('shows the query name as the heading', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Top chats' })).toBeInTheDocument();
  });

  test('opens a query joining two entities in the SQL view without a failed schema load', () => {
    const composite = savedQuery({
      query: void 0,
      sql: 'SELECT c.chat_id FROM conversations c JOIN dial_usage_log u ON u.chat_id = c.chat_id',
      source: ['conversations', 'dial_usage_log'],
    });

    renderPage(composite);

    expect(viewRadio('QueryBuilder.ViewSql')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText('sql-editor')).toHaveValue(formatSql(composite.sql ?? ''));
    expect(screen.queryByText('QueryBuilder.SchemaLoadFailed')).not.toBeInTheDocument();
  });

  test('opens a representable structured body in the builder with chips reflecting it', async () => {
    const user = userEvent.setup();
    renderPage(
      savedQuery({
        query: {
          ...STRUCTURED_BODY,
          sort: [{ field: 'project_id', dir: QuerySortDirection.Desc }],
          page: { type: QueryPageType.Offset, limit: 40, offset: 0, include_total: false },
        },
      }),
    );

    expect(viewRadio('QueryBuilder.ViewForm')).toHaveAttribute('aria-checked', 'true');
    const bar = screen.getByRole('group', { name: 'QueryChips.Bar' });
    expect(within(bar).getByRole('button', { name: /project_id/ })).toBeInTheDocument();
    expect(within(bar).getByRole('button', { name: /QueryChips.Period/ })).toBeInTheDocument();
    expect(saveButton()).toBeNull();
    expect(await openLimitRows(user)).toHaveValue(40);
  });

  test('opens a structured body the builder cannot represent as its translated SQL, with no unsaved changes', async () => {
    renderPage(savedQuery({ query: UNREPRESENTABLE_BODY }), { translatedSql: TRANSLATED_SQL });

    expect(await screen.findByLabelText('sql-editor')).toHaveValue(formatSql(TRANSLATED_SQL));
    expect(viewRadio('QueryBuilder.ViewSql')).toHaveAttribute('aria-checked', 'true');
    expect(saveButton()).toBeNull();
    expect(discardButton()).toBeNull();
    expect(mockShowNotification).not.toHaveBeenCalled();
  });

  test('opens a stored body with no page as its translated SQL', async () => {
    renderPage(savedQuery({ query: { entity: 'dial_usage_log', mode: QueryMode.Row } }), {
      translatedSql: TRANSLATED_SQL,
    });

    expect(await screen.findByLabelText('sql-editor')).toHaveValue(formatSql(TRANSLATED_SQL));
  });

  test('saves an edit to the translated SQL as a SQL body', async () => {
    const user = userEvent.setup();
    renderPage(savedQuery({ query: UNREPRESENTABLE_BODY }), { translatedSql: TRANSLATED_SQL });

    fireEvent.change(await screen.findByLabelText('sql-editor'), { target: { value: EDITED_SQL } });
    await saveInPlace(user);

    await vi.waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect(request.sql).toBe(EDITED_SQL);
    expect('query' in request).toBeFalsy();
  });

  test('opens an empty SQL view and reports the failure when the translation was refused', async () => {
    renderPage(savedQuery({ query: UNREPRESENTABLE_BODY }), {
      translatedSql: null,
      translationFailure: { errorMessage: 'not expressible', requestId: 'trace-9' },
    });

    expect(await screen.findByLabelText('sql-editor')).toHaveValue('');
    expect(viewRadio('QueryBuilder.ViewSql')).toHaveAttribute('aria-checked', 'true');
    expect(saveButton()).toBeNull();
    expect(mockShowNotification).toHaveBeenCalledOnce();
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'QueryBuilder.SqlTranslateFailed', description: 'not expressible' }),
    );
  });

  test('keeps the stored body on a save made while the refused translation leaves the SQL view empty', async () => {
    const user = userEvent.setup();
    renderPage(savedQuery({ query: UNREPRESENTABLE_BODY }), { translatedSql: null });

    await user.click(await screen.findByRole('button', { name: 'use chart view' }));
    await saveInPlace(user);

    await vi.waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect(request.query).toEqual(UNREPRESENTABLE_BODY);
    expect('sql' in request).toBeFalsy();
  });

  test('keeps the stored body through a visit to the Builder that changes nothing', async () => {
    const user = userEvent.setup();
    renderPage(savedQuery({ query: UNREPRESENTABLE_BODY }), { translatedSql: null });
    await screen.findByLabelText('sql-editor');

    await user.click(viewRadio('QueryBuilder.ViewForm'));
    expect(await screen.findByRole('button', { name: /QueryBuilder.Limit/ })).toBeInTheDocument();
    expect(saveButton()).toBeNull();

    await user.click(screen.getByRole('button', { name: 'use chart view' }));
    await saveInPlace(user);

    await vi.waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
    expect(sentRequest().query).toEqual(UNREPRESENTABLE_BODY);
  });

  test('saves the chips once the user edits them in place of a body that was held aside', async () => {
    const user = userEvent.setup();
    renderPage(savedQuery({ query: UNREPRESENTABLE_BODY }), { translatedSql: null });
    await screen.findByLabelText('sql-editor');

    await user.click(viewRadio('QueryBuilder.ViewForm'));
    await screen.findByRole('button', { name: /QueryBuilder.Limit/ });
    await editLimit(user);
    await saveInPlace(user);

    await vi.waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect(request.query).not.toEqual(UNREPRESENTABLE_BODY);
    expect(request.query?.page).toEqual(expect.objectContaining({ limit: 50 }));
  });

  test('opens a SQL body in the SQL view with the stored statement laid out for reading', async () => {
    renderPage(savedQuery({ query: void 0, sql: 'SELECT count(*) FROM dial_usage_log' }));

    expect(await screen.findByLabelText('sql-editor')).toHaveValue(formatSql('SELECT count(*) FROM dial_usage_log'));
  });

  test('reports no unsaved changes when freshly loaded', () => {
    renderPage();

    expect(saveButton()).toBeNull();
    expect(discardButton()).toBeNull();
    expect(screen.getByRole('button', { name: 'Buttons.Edit' })).toBeInTheDocument();
  });

  test('reports no unsaved changes for a query with no stored time intent', () => {
    renderPage(savedQuery({ time: void 0 }));

    expect(saveButton()).toBeNull();
  });

  test('reports no unsaved changes for a query whose stored period it cannot express', () => {
    renderPage(savedQuery({ time: { mode: SavedQueryTimeMode.Relative, period: 'last_fortnight' } }));

    expect(saveButton()).toBeNull();
  });

  test('reports unsaved changes when the query body is edited', async () => {
    const user = userEvent.setup();
    renderPage();

    await editLimit(user);

    expect(saveButton()).toBeInTheDocument();
    expect(discardButton()).toBeInTheDocument();
  });

  test('reports unsaved changes when the result view is switched', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'use chart view' }));

    expect(saveButton()).toBeInTheDocument();
  });

  test('reports unsaved changes when the chart configuration is changed', async () => {
    const user = userEvent.setup();
    renderPage(savedQuery({ result_view: QueryResultView.Chart }));

    await user.click(screen.getByRole('button', { name: 'change axes' }));

    expect(saveButton()).toBeInTheDocument();
  });

  test('saves the edited query and re-reads it', async () => {
    const user = userEvent.setup();
    renderPage();

    await editLimit(user);
    await saveInPlace(user);

    await vi.waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    expect(updateSavedQuery).toHaveBeenCalledOnce();
    expect(vi.mocked(updateSavedQuery).mock.calls[0][0]).toBe('sq_1');
    expect(mockShowNotification).toHaveBeenCalled();
  });

  test('persists the authored period as a relative token, with no time bound in the body', async () => {
    const user = userEvent.setup();
    renderPage();

    await editLimit(user);
    await saveInPlace(user);

    await vi.waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
    const request = sentRequest();
    expect(request.time).toEqual({ mode: SavedQueryTimeMode.Relative, period: '7d' });
    expect(JSON.stringify(request.query?.filter ?? {})).not.toContain('request_time');
  });

  test('keeps the edits when a save fails', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSavedQuery).mockResolvedValue({
      success: false,
      errorHeader: 'validation_error',
      errorMessage: 'select[0] is invalid',
      requestId: 'trace-1',
    });
    renderPage();

    await editLimit(user);
    await saveInPlace(user);

    await vi.waitFor(() => expect(mockShowNotification).toHaveBeenCalled());
    expect(saveButton()).toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  test('reports a transport failure on save and re-enables Save with the edits kept', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSavedQuery).mockRejectedValue(new Error('network down'));
    renderPage();

    await editLimit(user);
    await saveInPlace(user);

    await vi.waitFor(() =>
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Error.Error', description: 'Queries.ErrorGeneric' }),
      ),
    );
    expect(saveButton()).toBeEnabled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  test('returns the user to the list when the query it is showing has gone', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSavedQuery).mockResolvedValue({ success: false, errorHeader: 'not_found', status: 404 });
    renderPage();

    await editLimit(user);
    await saveInPlace(user);

    await vi.waitFor(() => expect(mockPush).toHaveBeenCalledWith('/queries'));
  });

  test('reverts to the last saved query when a discard is confirmed', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'use chart view' }));
    expect(screen.getByText(`view: ${QueryResultView.Chart}`)).toBeInTheDocument();

    await user.click(discardButton()!);
    const dialog = (await screen.findByText('Entities.DiscardChanges')).closest('[role="dialog"]') as HTMLElement;
    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Discard' }));

    expect(await screen.findByText(`view: ${QueryResultView.Table}`)).toBeInTheDocument();
    expect(saveButton()).toBeNull();
  });

  test('keeps the edits when a discard is cancelled', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'use chart view' }));
    await user.click(discardButton()!);
    await user.click(screen.getByRole('button', { name: 'Buttons.ContinueEditing' }));

    expect(screen.getByText(`view: ${QueryResultView.Chart}`)).toBeInTheDocument();
    expect(saveButton()).toBeInTheDocument();
  });

  test('restores a stored chart configuration and keeps it across the first run', async () => {
    const user = userEvent.setup();
    renderPage(
      savedQuery({
        result_view: QueryResultView.Chart,
        chart: { type: ChartType.Line, x_field: 'project_id', y_field: ['count'] },
      }),
    );

    expect(screen.getByText(`chart: ${ChartType.Line}/project_id`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));

    expect(await screen.findByText(`chart: ${ChartType.Line}/project_id`)).toBeInTheDocument();
  });

  test('offers no Save or Edit on a common query to a caller who cannot write it', async () => {
    const user = userEvent.setup();
    setFullAdmin(false);
    renderPage(savedQuery({ scope: SavedQueryScope.Common }));

    expect(screen.queryByRole('button', { name: 'Buttons.Edit' })).toBeNull();

    await editLimit(user);

    expect(discardButton()).toBeInTheDocument();
    expect(saveButton()).toBeNull();
  });

  test('offers Save and Edit on a common query to a full administrator', async () => {
    const user = userEvent.setup();
    setFullAdmin(true);
    renderPage(savedQuery({ scope: SavedQueryScope.Common }));

    expect(screen.getByRole('button', { name: 'Buttons.Edit' })).toBeInTheDocument();

    await editLimit(user);

    expect(saveButton()).toBeInTheDocument();
  });

  test('opens the metadata editor from the Edit action', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Buttons.Edit' }));

    expect(await screen.findByText('Queries.EditQuery')).toBeInTheDocument();
  });

  describe('Delete', () => {
    const deleteButton = () => screen.queryByRole('button', { name: 'Buttons.Delete' });

    beforeEach(() => {
      vi.mocked(deleteSavedQuery).mockResolvedValue({ success: true });
    });

    test('is offered to a caller who may write the query', () => {
      renderPage();

      expect(deleteButton()).toBeEnabled();
    });

    test('is not offered on a common query to a caller who is not a full administrator', () => {
      setFullAdmin(false);
      renderPage(savedQuery({ scope: SavedQueryScope.Common }));

      expect(deleteButton()).toBeNull();
    });

    test('asks for confirmation naming the query before deleting', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(deleteButton()!);

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText('Top chats')).toBeInTheDocument();
      expect(deleteSavedQuery).not.toHaveBeenCalled();
    });

    test('deletes on confirmation and leaves for the draft builder', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(deleteButton()!);
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Buttons.Delete' }));

      await waitFor(() => expect(dialog).not.toBeInTheDocument());
      expect(mockPush).toHaveBeenCalledWith('/queries');
      expect(deleteSavedQuery).toHaveBeenCalledWith('sq_1');
      expect(mockRefresh).toHaveBeenCalled();
    });

    test('keeps the page and reports the failure when the delete fails', async () => {
      const user = userEvent.setup();
      vi.mocked(deleteSavedQuery).mockResolvedValue({ success: false, errorHeader: 'forbidden' });
      renderPage();

      await user.click(deleteButton()!);
      const dialog = await screen.findByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Buttons.Delete' }));

      await vi.waitFor(() => expect(mockShowNotification).toHaveBeenCalled());
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'Top chats', hidden: true })).toBeInTheDocument();
    });
  });

  describe('Save menu', () => {
    test('opens a menu with both ways to save, without saving anything', async () => {
      const user = userEvent.setup();
      renderPage();
      await editLimit(user);

      expect(await openSaveMenu(user, 'Buttons.Save')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Queries.SaveAsNewQuery' })).toBeInTheDocument();
      expect(updateSavedQuery).not.toHaveBeenCalled();
      expect(screen.queryByText('Queries.SaveQueryAs')).toBeNull();
    });

    test('replaces Edit, Delete and Duplicate while there are unsaved changes', async () => {
      const user = userEvent.setup();
      renderPage();

      await editLimit(user);

      expect(saveButton()).toBeEnabled();
      expect(discardButton()).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Buttons.Edit' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Buttons.Delete' })).toBeNull();
      expect(duplicateButton()).toBeNull();
      expect(saveAsNewButton()).toBeNull();
    });

    test('is disabled while a save is in flight', async () => {
      const user = userEvent.setup();
      let finishSave: (value: Awaited<ReturnType<typeof updateSavedQuery>>) => void = () => {};
      vi.mocked(updateSavedQuery).mockReturnValue(
        new Promise((resolve) => {
          finishSave = resolve;
        }),
      );
      renderPage();
      await editLimit(user);

      await saveInPlace(user);

      await waitFor(() => expect(saveButton()).toBeDisabled());
      finishSave({ success: true, response: savedQuery({ generation: 2 }) });
      await vi.waitFor(() => expect(mockRefresh).toHaveBeenCalled());
    });

    test('is disabled while the SQL view holds no statement', async () => {
      renderPage(savedQuery({ query: void 0, sql: STORED_SQL }));

      fireEvent.change(await screen.findByLabelText('sql-editor'), { target: { value: '' } });

      await waitFor(() => expect(saveButton()).toBeDisabled());
    });
  });

  describe('Duplicate', () => {
    const CREATED = savedQuery({ id: 'sq_new', name: 'Top chats (copy)' });

    beforeEach(() => {
      vi.mocked(createSavedQuery).mockResolvedValue({ success: true, response: CREATED });
    });

    test('is offered without unsaved changes, while Save and Discard are not', () => {
      renderPage();

      expect(duplicateButton()).toBeEnabled();
      expect(saveButton()).toBeNull();
      expect(discardButton()).toBeNull();
      expect(saveAsNewButton()).toBeNull();
      expect(screen.queryByRole('button', { name: 'Buttons.SaveAs' })).toBeNull();
    });

    test('is offered on a common query the caller cannot write, where Edit and Delete are not', () => {
      setFullAdmin(false);
      renderPage(savedQuery({ scope: SavedQueryScope.Common }));

      expect(duplicateButton()).toBeEnabled();
      expect(screen.queryByRole('button', { name: 'Buttons.Edit' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Buttons.Delete' })).toBeNull();
    });

    test('opens a modal seeded with the source name and a copy suffix', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(duplicateButton()!);

      expect(await screen.findByText('Queries.SaveQueryAs')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Top chats (copy)')).toBeInTheDocument();
    });

    test('copies a clean query as stored', async () => {
      const user = userEvent.setup();
      const stored = savedQuery({ query: void 0, sql: 'SELECT 1 FROM dial_usage_log' });
      renderPage(stored);

      await user.click(duplicateButton()!);
      const dialog = (await screen.findByText('Queries.SaveQueryAs')).closest('[role="dialog"]') as HTMLElement;
      await user.click(within(dialog).getByRole('button', { name: 'Buttons.Save' }));

      await vi.waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
      expect(createdRequest().sql).toBe('SELECT 1 FROM dial_usage_log');
      expect(updateSavedQuery).not.toHaveBeenCalled();
    });
  });

  describe('Save as a new query', () => {
    const CREATED = savedQuery({ id: 'sq_new', name: 'Top chats (copy)' });

    beforeEach(() => {
      vi.mocked(createSavedQuery).mockResolvedValue({ success: true, response: CREATED });
    });

    const openSaveAs = async (user: ReturnType<typeof userEvent.setup>, isWritable = true) => {
      await editLimit(user);
      await user.click(isWritable ? await openSaveMenu(user, 'Queries.SaveAsNewQuery') : saveAsNewButton()!);
      return screen.findByText('Queries.SaveQueryAs');
    };

    const submitSaveAs = async (user: ReturnType<typeof userEvent.setup>, isWritable = true) => {
      const dialog = (await openSaveAs(user, isWritable)).closest('[role="dialog"]') as HTMLElement;
      await user.click(within(dialog).getByRole('button', { name: 'Buttons.Save' }));
      await vi.waitFor(() => expect(createSavedQuery).toHaveBeenCalledOnce());
    };

    test('is a plain button next to Discard on a common query the caller cannot write, with no Save menu', async () => {
      const user = userEvent.setup();
      setFullAdmin(false);
      renderPage(savedQuery({ scope: SavedQueryScope.Common }));

      await editLimit(user);

      expect(saveAsNewButton()).toBeEnabled();
      expect(discardButton()).toBeInTheDocument();
      expect(saveButton()).toBeNull();
      expect(duplicateButton()).toBeNull();
    });

    test('opens a modal seeded with the source name and a copy suffix', async () => {
      const user = userEvent.setup();
      renderPage();

      await openSaveAs(user);

      expect(screen.getByDisplayValue('Top chats (copy)')).toBeInTheDocument();
    });

    test('creates a new query from the unsaved edits and leaves the source alone', async () => {
      const user = userEvent.setup();
      renderPage();

      await submitSaveAs(user);

      const request = createdRequest();
      expect(request.name).toBe('Top chats (copy)');
      expect(request.query?.page).toEqual({ type: QueryPageType.Offset, limit: 50, offset: 0, include_total: false });
      expect(request.time).toEqual({ mode: SavedQueryTimeMode.Relative, period: '7d' });
      expect(updateSavedQuery).not.toHaveBeenCalled();
    });

    test("puts a non-administrator's copy of a common query in the personal scope", async () => {
      const user = userEvent.setup();
      setFullAdmin(false);
      renderPage(savedQuery({ scope: SavedQueryScope.Common }));

      await submitSaveAs(user, false);

      expect(createdRequest().scope).toBe(SavedQueryScope.Personal);
    });

    test('stays on the source page, still dirty, and links to the new query from the notification', async () => {
      const user = userEvent.setup();
      renderPage();

      await submitSaveAs(user);

      await waitFor(() => expect(screen.queryByText('Queries.SaveQueryAs')).toBeNull());
      expect(mockPush).not.toHaveBeenCalled();
      expect(saveButton()).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Top chats' })).toBeInTheDocument();

      const notification = mockShowNotification.mock.calls[0][0];
      render(<>{notification.description}</>);
      expect(screen.getByRole('link', { name: 'Top chats (copy)' })).toHaveAttribute(
        'href',
        expect.stringMatching(/^\/en\/queries\/.*sq_new/),
      );
    });

    test('keeps the modal open when the create fails', async () => {
      const user = userEvent.setup();
      vi.mocked(createSavedQuery).mockResolvedValue({
        success: false,
        errorHeader: 'validation_error',
        errorMessage: "unknown column 'project_id'",
      });
      renderPage();

      await submitSaveAs(user);

      await vi.waitFor(() => expect(mockShowNotification).toHaveBeenCalled());
      expect(screen.getByText('Queries.SaveQueryAs')).toBeInTheDocument();
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.objectContaining({ description: "unknown column 'project_id'" }),
      );
    });

    test('keeps the edits when the modal is cancelled', async () => {
      const user = userEvent.setup();
      renderPage();

      const header = await openSaveAs(user);
      const dialog = header.closest('[role="dialog"]') as HTMLElement;
      await user.click(within(dialog).getByRole('button', { name: 'Buttons.Cancel' }));

      expect(screen.queryByText('Queries.SaveQueryAs')).toBeNull();
      expect(saveButton()).toBeInTheDocument();
      expect(createSavedQuery).not.toHaveBeenCalled();
    });

    test('is unavailable to a caller who cannot write the query while the SQL view holds no statement', async () => {
      setFullAdmin(false);
      renderPage(savedQuery({ scope: SavedQueryScope.Common, query: void 0, sql: STORED_SQL }));

      fireEvent.change(await screen.findByLabelText('sql-editor'), { target: { value: '' } });

      await waitFor(() => expect(saveAsNewButton()).toBeDisabled());
    });
  });

  describe('regressions', () => {
    test('a query stored with no time intent is not dirty on open', () => {
      renderPage(savedQuery({ time: void 0 }));

      expect(saveButton()).toBeNull();
    });

    test('discard clears the dirty state for a query stored with no time intent', async () => {
      const user = userEvent.setup();
      renderPage(savedQuery({ time: void 0 }));

      await user.click(screen.getByRole('button', { name: 'use chart view' }));
      expect(saveButton()).toBeInTheDocument();

      await user.click(discardButton()!);
      await user.click(screen.getByRole('button', { name: 'Buttons.Discard' }));

      // The baseline is rebuilt from live values on discard; reading them from a stale closure left the
      // page dirty forever, with Save and Discard stuck on screen.
      await waitFor(() => expect(saveButton()).toBeNull());
      expect(screen.getByRole('button', { name: 'Buttons.Edit' })).toBeInTheDocument();
    });

    test('an untranslatable stored SQL body survives an attempted switch to the builder', async () => {
      const user = userEvent.setup();
      vi.mocked(translateSqlToQuery).mockResolvedValue({ success: false, status: 400 } as never);
      renderPage(savedQuery({ query: void 0, sql: STORED_SQL }));

      await screen.findByLabelText('sql-editor');
      await user.click(viewRadio('QueryBuilder.ViewForm'));
      expect(await screen.findByText('QueryBuilder.DiscardQueryHeader')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Buttons.Cancel' }));

      await user.click(screen.getByRole('button', { name: 'use chart view' }));
      await saveInPlace(user);

      await vi.waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
      const request = sentRequest();
      expect(request.sql).toBe(formatSql(STORED_SQL));
      expect('query' in request).toBeFalsy();
    });

    test('a stored SQL body the builder can take is saved as the structured query its chips show', async () => {
      const user = userEvent.setup();
      vi.mocked(translateSqlToQuery).mockResolvedValue({
        success: true,
        response: { query: { ...STRUCTURED_BODY, page: { ...STRUCTURED_BODY.page, limit: 40 } } },
      } as never);
      renderPage(savedQuery({ query: void 0, sql: STORED_SQL }));

      await screen.findByLabelText('sql-editor');
      await user.click(viewRadio('QueryBuilder.ViewForm'));
      expect(await openLimitRows(user)).toHaveValue(40);
      await user.click(screen.getByRole('button', { name: 'Buttons.Cancel' }));
      await saveInPlace(user);

      await vi.waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
      const request = sentRequest();
      expect(request.query?.page).toEqual({ type: QueryPageType.Offset, limit: 40, offset: 0, include_total: false });
      expect('sql' in request).toBeFalsy();
    });

    test('a translation the chips cannot represent is guarded rather than loaded', async () => {
      const user = userEvent.setup();
      vi.mocked(translateSqlToQuery).mockResolvedValue({
        success: true,
        response: { query: UNREPRESENTABLE_BODY },
      } as never);
      renderPage(savedQuery({ query: void 0, sql: STORED_SQL }));

      await screen.findByLabelText('sql-editor');
      await user.click(viewRadio('QueryBuilder.ViewForm'));

      expect(await screen.findByText('QueryBuilder.DiscardQueryHeader')).toBeInTheDocument();
      expect(screen.getByLabelText('sql-editor')).toHaveValue(formatSql(STORED_SQL));
    });

    test('a failed translation round trip is guarded rather than thrown', async () => {
      const user = userEvent.setup();
      vi.mocked(translateSqlToQuery).mockRejectedValue(new Error('network down'));
      renderPage(savedQuery({ query: void 0, sql: STORED_SQL }));

      await screen.findByLabelText('sql-editor');
      await user.click(viewRadio('QueryBuilder.ViewForm'));

      expect(await screen.findByText('QueryBuilder.DiscardQueryHeader')).toBeInTheDocument();
    });

    test('a successful save keeps the result on screen', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));
      expect(await screen.findByText('result: present')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'use chart view' }));
      await saveInPlace(user);

      await vi.waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
      // Re-seeding the builder from the response used to clear the result the user had just run.
      expect(screen.getByText('result: present')).toBeInTheDocument();
    });

    test('a successful save clears the dirty state without re-seeding', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: 'use chart view' }));
      await saveInPlace(user);

      await vi.waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
      await waitFor(() => expect(saveButton()).toBeNull());
      // The view the user chose survives the save rather than reverting to the stored one.
      expect(screen.getByText(`view: ${QueryResultView.Chart}`)).toBeInTheDocument();
    });

    test('a chart result view with no stored chart configuration is not dirty on open', () => {
      renderPage(savedQuery({ result_view: QueryResultView.Chart, chart: void 0 }));

      expect(saveButton()).toBeNull();
    });
  });
});

describe('QueryBuilder — a draft', () => {
  const CREATED = savedQuery({ id: 'sq_new', name: 'From a draft' });

  const renderDraft = () =>
    render(
      <QueryBuilderDraft
        initialEntities={ENTITIES}
        initialEntityName="dial_usage_log"
        initialFields={FIELDS}
        initialFunctions={TEST_FUNCTIONS}
        name="dial_usage_log"
      />,
    );

  const saveAsQueryButton = () => screen.queryByRole('button', { name: 'Queries.SaveAsQuery' });
  const resetButton = () => screen.queryByRole('button', { name: 'Buttons.Reset' });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setFullAdmin(true);
    vi.mocked(createSavedQuery).mockResolvedValue({ success: true, response: CREATED });
  });

  test('shows the table name as the heading and offers Save as query', () => {
    renderDraft();

    expect(screen.getByRole('heading', { name: 'dial_usage_log' })).toBeInTheDocument();
    expect(saveAsQueryButton()).toBeEnabled();
  });

  test('offers no action that needs a stored query', () => {
    renderDraft();

    expect(screen.queryByRole('button', { name: 'Buttons.Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Buttons.Delete' })).toBeNull();
    expect(saveButton()).toBeNull();
    expect(discardButton()).toBeNull();
    expect(resetButton()).toBeNull();
  });

  test('offers Reset once the draft has changed', async () => {
    const user = userEvent.setup();
    renderDraft();

    await editLimit(user);

    expect(resetButton()).toBeEnabled();
  });

  test('returns to the starting state when Reset is confirmed', async () => {
    const user = userEvent.setup();
    renderDraft();
    await editLimit(user);

    await user.click(resetButton()!);
    await user.click(await screen.findByRole('button', { name: 'Buttons.Discard' }));

    await waitFor(() => expect(resetButton()).toBeNull());
    expect(saveAsQueryButton()).toBeEnabled();
  });

  test('keeps the changes when Reset is cancelled', async () => {
    const user = userEvent.setup();
    renderDraft();
    await editLimit(user);

    await user.click(resetButton()!);
    await user.click(await screen.findByRole('button', { name: 'Buttons.ContinueEditing' }));

    expect(resetButton()).toBeEnabled();
  });

  test('saves the draft as a new query and opens it', async () => {
    const user = userEvent.setup();
    renderDraft();
    await editLimit(user);

    await user.click(saveAsQueryButton()!);
    const dialog = (await screen.findByText('Queries.SaveQueryAs')).closest('[role="dialog"]') as HTMLElement;
    const submitButton = within(dialog).getByRole('button', { name: 'Buttons.Save' });
    expect(submitButton).toBeDisabled();

    fireEvent.change(within(dialog).getByRole('textbox', { name: /EntityFields.displayName/ }), {
      target: { value: 'From a draft' },
    });
    await user.click(submitButton);

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('sq_new'));
    const request = createdRequest();
    expect(request.name).toBe('From a draft');
    expect(request.scope).toBe(SavedQueryScope.Personal);
    expect(request.query?.entity).toBe('dial_usage_log');
    expect(mockRefresh).toHaveBeenCalled();
  });

  test('keeps the modal open when saving the draft fails', async () => {
    const user = userEvent.setup();
    vi.mocked(createSavedQuery).mockResolvedValue({ success: false, errorHeader: 'validation_error' });
    renderDraft();

    await user.click(saveAsQueryButton()!);
    const dialog = (await screen.findByText('Queries.SaveQueryAs')).closest('[role="dialog"]') as HTMLElement;
    fireEvent.change(within(dialog).getByRole('textbox', { name: /EntityFields.displayName/ }), {
      target: { value: 'From a draft' },
    });
    await user.click(within(dialog).getByRole('button', { name: 'Buttons.Save' }));

    await vi.waitFor(() => expect(mockShowNotification).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText('Queries.SaveQueryAs')).toBeInTheDocument();
  });
});

describe('QueryBuilder — Add to dashboard', () => {
  const addToDashboardButton = () => screen.queryByRole('button', { name: 'CustomDashboards.AddToDashboard' });

  const setCustomDashboards = (isEnabled: boolean) =>
    vi.mocked(useAppContext).mockReturnValue({
      featureFlags: { analyticsCustomDashboardsEnabled: isEnabled },
      isFullAdmin: true,
    } as never);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setCustomDashboards(true);
  });

  test('is offered on a saved query without edits', () => {
    renderPage();

    expect(addToDashboardButton()).toBeInTheDocument();
  });

  test('is offered on a SQL saved query', async () => {
    renderPage(savedQuery({ query: void 0, sql: 'SELECT count(*) FROM dial_usage_log' }));

    await screen.findByLabelText('sql-editor');

    expect(addToDashboardButton()).toBeInTheDocument();
  });

  test('gives way to Save and Discard once the query is edited', async () => {
    const user = userEvent.setup();
    renderPage();

    await editLimit(user);

    expect(saveButton()).toBeInTheDocument();
    expect(discardButton()).toBeInTheDocument();
    expect(addToDashboardButton()).toBeNull();
  });

  test('is absent while custom dashboards are off', () => {
    setCustomDashboards(false);
    renderPage();

    expect(screen.getByRole('button', { name: 'Buttons.Edit' })).toBeInTheDocument();
    expect(addToDashboardButton()).toBeNull();
  });
});
