import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { executeQuery, updateSavedQuery } from '@/src/app/[lang]/queries/actions';
import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { useAppContext } from '@/src/context/AppContext';
import { AnalyticsEntity, AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  QueryExprType,
  QueryLogicalOperator,
  QueryMode,
  QueryOperator,
  QueryValueType,
  StructuredQuery,
} from '@/src/models/analytics/query';
import { ChartConfig, ChartType, QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryRequest, SavedQueryScope, SavedQueryTimeMode } from '@/src/models/analytics/saved-query';

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
  default: ({ value }: { value: string }) => <textarea aria-label="sql-editor" value={value} readOnly />,
}));

vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value?: string) => void }) => (
    <textarea aria-label="json-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock('@/src/components/Analytics/QueryBuilder/Result/ResultArea', () => ({
  default: ({
    result,
    view,
    onChangeView,
    chartConfig,
    onChangeChartConfig,
  }: {
    result: unknown;
    view: QueryResultView;
    onChangeView: (view: QueryResultView) => void;
    chartConfig: ChartConfig;
    onChangeChartConfig: (config: ChartConfig) => void;
  }) => (
    <div>
      <span>view: {view}</span>
      <span>result: {result ? 'present' : 'none'}</span>
      <span>
        chart: {chartConfig.type}/{chartConfig.xField ?? 'none'}
      </span>
      <button onClick={() => onChangeView(QueryResultView.Chart)}>use chart view</button>
      <button onClick={() => onChangeChartConfig({ type: ChartType.Pie, xField: 'project_id', yField: 'count' })}>
        change axes
      </button>
    </div>
  ),
}));

const ENTITIES: AnalyticsEntity[] = [{ name: 'dial_usage_log' }, { name: 'other_table' }];
const FIELDS: AnalyticsEntityField[] = [
  { name: 'event_id', type: AnalyticsFieldType.Uuid, source: 'event_id', tag: 'identity' },
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id', tag: 'lineage' },
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time', tag: 'identity' },
];

const STRUCTURED_BODY: StructuredQuery = { entity: 'dial_usage_log', mode: QueryMode.Row };

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
  source: 'dial_usage_log',
  query: STRUCTURED_BODY,
  time: { mode: SavedQueryTimeMode.Relative, period: '7d' },
  result_view: QueryResultView.Table,
  generation: 1,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-02T00:00:00Z',
  ...overrides,
});

const renderPage = (query: SavedQuery = savedQuery(), fields: AnalyticsEntityField[] = FIELDS) =>
  render(
    <QueryBuilder
      initialEntities={ENTITIES}
      initialEntityName={query.query?.entity ?? query.source ?? ''}
      initialFields={fields}
      initialFunctions={TEST_FUNCTIONS}
      name={query.name}
      savedQuery={query}
    />,
  );

const saveButton = () => screen.queryByRole('button', { name: 'Buttons.Save' });
const discardButton = () => screen.queryByRole('button', { name: 'Buttons.Discard' });
const sentRequest = () => vi.mocked(updateSavedQuery).mock.calls[0][1] as SavedQueryRequest;

const addProjectionField = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'QueryBuilder.Select: QueryBuilder.AddField' }));
  await user.click(screen.getByRole('button', { name: /lineage/ }));
  await user.click(screen.getByRole('option', { name: /project_id/ }));
};

describe('QueryBuilder — a stored saved query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setFullAdmin(true);
    vi.mocked(updateSavedQuery).mockResolvedValue({ success: true, response: savedQuery({ generation: 2 }) });
    vi.mocked(executeQuery).mockImplementation(() =>
      Promise.resolve({ success: true, response: { columns: ['project_id'], rows: [{ project_id: 'a' }] } }),
    );
  });

  test('shows the query name as the heading', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Top chats' })).toBeInTheDocument();
  });

  test('opens a representable structured body in the builder', () => {
    renderPage();

    expect(screen.getByRole('tab', { name: 'QueryBuilder.ViewForm' })).toHaveAttribute('aria-selected', 'true');
  });

  test('opens a structured body the builder cannot represent in the JSON view', async () => {
    renderPage(savedQuery({ query: UNREPRESENTABLE_BODY }));

    expect(await screen.findByLabelText('json-editor')).toHaveValue(JSON.stringify(UNREPRESENTABLE_BODY, null, 2));
  });

  test('opens a SQL body in the SQL view with the stored statement intact', async () => {
    renderPage(savedQuery({ query: void 0, sql: 'SELECT count(*) FROM dial_usage_log' }));

    expect(await screen.findByLabelText('sql-editor')).toHaveValue('SELECT count(*) FROM dial_usage_log');
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

    await addProjectionField(user);

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

    await addProjectionField(user);
    await user.click(saveButton()!);

    await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
    expect(vi.mocked(updateSavedQuery).mock.calls[0][0]).toBe('sq_1');
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockShowNotification).toHaveBeenCalled();
  });

  test('persists the authored period as a relative token, with no time bound in the body', async () => {
    const user = userEvent.setup();
    renderPage();

    await addProjectionField(user);
    await user.click(saveButton()!);

    await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
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

    await addProjectionField(user);
    await user.click(saveButton()!);

    await waitFor(() => expect(mockShowNotification).toHaveBeenCalled());
    expect(saveButton()).toBeInTheDocument();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  test('returns the user to the list when the query it is showing has gone', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSavedQuery).mockResolvedValue({ success: false, errorHeader: 'not_found', status: 404 });
    renderPage();

    await addProjectionField(user);
    await user.click(saveButton()!);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/queries'));
  });

  test('reverts to the last saved query when a discard is confirmed', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'use chart view' }));
    expect(screen.getByText(`view: ${QueryResultView.Chart}`)).toBeInTheDocument();

    await user.click(discardButton()!);
    await user.click(screen.getByRole('button', { name: 'Buttons.Discard' }));

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
        chart: { type: ChartType.Line, x_field: 'project_id', y_field: 'count' },
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

    await addProjectionField(user);

    expect(discardButton()).toBeInTheDocument();
    expect(saveButton()).toBeNull();
  });

  test('offers Save and Edit on a common query to a full administrator', async () => {
    const user = userEvent.setup();
    setFullAdmin(true);
    renderPage(savedQuery({ scope: SavedQueryScope.Common }));

    expect(screen.getByRole('button', { name: 'Buttons.Edit' })).toBeInTheDocument();

    await addProjectionField(user);

    expect(saveButton()).toBeInTheDocument();
  });

  test('opens the metadata editor from the Edit action', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Buttons.Edit' }));

    expect(await screen.findByText('Queries.EditQuery')).toBeInTheDocument();
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

    test('leaving the SQL view does not replace a stored SQL body with builder state', async () => {
      const user = userEvent.setup();
      renderPage(savedQuery({ query: void 0, sql: 'SELECT count(*) FROM dial_usage_log' }));

      await screen.findByLabelText('sql-editor');
      await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewJson' }));
      await user.click(screen.getByRole('button', { name: 'use chart view' }));
      await user.click(saveButton()!);

      await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
      const request = sentRequest();
      expect(request.sql).toBe('SELECT count(*) FROM dial_usage_log');
      expect('query' in request).toBeFalsy();
    });

    test('a successful save keeps the result on screen', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: /QueryBuilder.Run/ }));
      expect(await screen.findByText('result: present')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'use chart view' }));
      await user.click(saveButton()!);

      await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
      // Re-seeding the builder from the response used to clear the result the user had just run.
      expect(screen.getByText('result: present')).toBeInTheDocument();
    });

    test('a successful save clears the dirty state without re-seeding', async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole('button', { name: 'use chart view' }));
      await user.click(saveButton()!);

      await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
      await waitFor(() => expect(saveButton()).toBeNull());
      // The view the user chose survives the save rather than reverting to the stored one.
      expect(screen.getByText(`view: ${QueryResultView.Chart}`)).toBeInTheDocument();
    });

    test('a chart result view with no stored chart configuration is not dirty on open', () => {
      renderPage(savedQuery({ result_view: QueryResultView.Chart, chart: void 0 }));

      expect(saveButton()).toBeNull();
    });
    test('an edit to a body the builder cannot display counts as an unsaved change', async () => {
      renderPage(savedQuery({ query: UNREPRESENTABLE_BODY }));

      const editor = await screen.findByLabelText('json-editor');
      expect(saveButton()).toBeNull();

      const edited = { ...UNREPRESENTABLE_BODY, distinct: true };
      fireEvent.change(editor, { target: { value: JSON.stringify(edited, null, 2) } });

      // The builder state is never hydrated from a diverged body, so the buffer itself has to reach the
      // payload — otherwise the edit is untracked and lost on navigation.
      await waitFor(() => expect(saveButton()).toBeInTheDocument());
    });

    test('saves the edited body the builder cannot display', async () => {
      const user = userEvent.setup();
      renderPage(savedQuery({ query: UNREPRESENTABLE_BODY }));

      const editor = await screen.findByLabelText('json-editor');
      const edited = { ...UNREPRESENTABLE_BODY, distinct: true };
      fireEvent.change(editor, { target: { value: JSON.stringify(edited, null, 2) } });

      await waitFor(() => expect(saveButton()).toBeInTheDocument());
      await user.click(saveButton()!);

      await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledOnce());
      expect(sentRequest().query).toEqual(edited);
    });

    test('a query the builder cannot display is not dirty on open', async () => {
      renderPage(savedQuery({ query: UNREPRESENTABLE_BODY }));

      await screen.findByLabelText('json-editor');

      expect(saveButton()).toBeNull();
    });
  });
});
