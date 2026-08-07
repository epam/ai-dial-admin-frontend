import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import QueryBuilder from '@/src/components/Analytics/QueryBuilder/QueryBuilder';
import {
  createSavedQuery,
  executeQuery,
  getEntitySchema,
  listSavedQueries,
  updateSavedQuery,
} from '@/src/app/[lang]/query-builder/actions';
import { TEST_FUNCTIONS } from '@/src/components/Analytics/QueryBuilder/utils/tests/functions.fixture';
import { useAppContext } from '@/src/context/AppContext';
import { AnalyticsEntity, AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { QueryMode } from '@/src/models/analytics/query';
import { ChartType, QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryScope, SavedQueryTimeMode } from '@/src/models/analytics/saved-query';

vi.mock('@/src/app/[lang]/query-builder/actions');

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: vi.fn(() => ({ featureFlags: {}, isFullAdmin: true, isEnableAuth: true })),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData?: unknown[] }) => <div>grid rows: {rowData?.length ?? 0}</div>,
}));

vi.mock('@/src/components/Analytics/QueryBuilder/Sql/SqlEditor', () => ({
  default: ({ value }: { value: string }) => <textarea aria-label="sql-editor" value={value} readOnly />,
}));

vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  default: ({ value }: { value: string }) => <textarea aria-label="json-editor" value={value} readOnly />,
}));

vi.mock('echarts-for-react', () => ({ default: () => <div>chart canvas</div> }));

const ENTITIES: AnalyticsEntity[] = [{ name: 'dial_usage_log' }];
const FIELDS: AnalyticsEntityField[] = [
  { name: 'project_id', type: AnalyticsFieldType.String, source: 'project_id' },
  { name: 'request_time', type: AnalyticsFieldType.Timestamp, source: 'request_time' },
];

const ROW_QUERY: SavedQuery = {
  id: 'sq_1',
  name: 'Top chats',
  tag: 'Adoption',
  scope: SavedQueryScope.Personal,
  source: 'dial_usage_log',
  query: {
    entity: 'dial_usage_log',
    mode: QueryMode.Row,
    select: [{ expr: { type: 'field', name: 'project_id' } }],
    page: { type: 'offset', offset: 0, limit: 25, include_total: false },
  },
  time: { mode: SavedQueryTimeMode.Relative, period: '2d' },
  result_view: QueryResultView.Table,
  generation: 1,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
};

const CHART_QUERY: SavedQuery = {
  ...ROW_QUERY,
  id: 'sq_2',
  name: 'Requests per project',
  query: {
    entity: 'dial_usage_log',
    mode: QueryMode.Aggregate,
    group_by: ['project_id'],
    select: [
      { expr: { type: 'field', name: 'project_id' } },
      { expr: { type: 'fn', name: 'count', args: [] }, as: 'Count' },
    ],
    page: { type: 'offset', offset: 0, limit: 25, include_total: false },
  },
  result_view: QueryResultView.Chart,
  chart: { type: ChartType.Line, x_field: null, y_field: null },
};

const renderBuilder = () =>
  render(
    <QueryBuilder
      initialEntities={ENTITIES}
      initialEntityName="dial_usage_log"
      initialFields={FIELDS}
      initialFunctions={TEST_FUNCTIONS}
    />,
  );

const openSavedQuery = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('button', { name: /QueryBuilder.SavedQueries/ }));
  await user.click(await screen.findByText(name));
  await user.click(screen.getByRole('button', { name: 'QueryBuilder.SavedQueriesOpen' }));
};

describe('QueryBuilder :: saved query session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAppContext).mockReturnValue({
      featureFlags: {},
      isFullAdmin: true,
      isEnableAuth: true,
    } as never);
    vi.mocked(getEntitySchema).mockResolvedValue({ fields: FIELDS });
    vi.mocked(listSavedQueries).mockResolvedValue([ROW_QUERY]);
  });

  test('no identity chip and no query actions before anything is loaded', async () => {
    renderBuilder();

    await waitFor(() => expect(listSavedQueries).toHaveBeenCalled());
    expect(screen.queryByText('Top chats')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).not.toBeInTheDocument();
  });

  test('a scratch query never offers Revert however much it is edited', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.AggregateMode' }));

    expect(screen.queryByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).not.toBeInTheDocument();
  });

  test('opening a saved query names it beside the heading', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await openSavedQuery(user, 'Top chats');

    expect(await screen.findByText('Adoption')).toBeInTheDocument();
    expect(screen.getByText('Top chats')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).toBeDisabled();
  });

  test('Save is enabled for a scratch query — there is nothing it could duplicate', async () => {
    renderBuilder();

    await waitFor(() => expect(listSavedQueries).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'QueryBuilder.SaveQuery' })).toBeEnabled();
  });

  test('Save is disabled while a loaded query is unchanged', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await openSavedQuery(user, 'Top chats');

    // Overwriting an unchanged query rewrites the same body and reorders the library for nothing.
    await waitFor(() => expect(screen.getByRole('button', { name: 'QueryBuilder.SaveQuery' })).toBeDisabled());
  });

  test('Save re-enables as soon as the query diverges, and disables again on revert', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await openSavedQuery(user, 'Top chats');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.AggregateMode' }));

    const toolbarSave = () => screen.getAllByRole('button', { name: 'QueryBuilder.SaveQuery' })[0];
    await waitFor(() => expect(toolbarSave()).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryRevert' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'QueryBuilder.SaveQuery' })).toBeDisabled());
  });

  test('the keyboard shortcut does not overwrite an unchanged query', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSavedQuery).mockResolvedValue({ success: true, response: ROW_QUERY });
    renderBuilder();

    await openSavedQuery(user, 'Top chats');
    await waitFor(() => expect(screen.getByRole('button', { name: 'QueryBuilder.SaveQuery' })).toBeDisabled());

    await user.keyboard('{Control>}s{/Control}');

    expect(updateSavedQuery).not.toHaveBeenCalled();
  });

  test('closing the loaded query drops its identity but keeps the builder content', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await openSavedQuery(user, 'Top chats');
    await screen.findByText('Adoption');

    await user.click(screen.getByRole('button', { name: 'Buttons.Close Top chats' }));

    // The chip and its Save target go; what is on screen is now an unnamed scratch query.
    await waitFor(() => expect(screen.queryByText('Adoption')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'QueryBuilder.SaveQuery' })).toBeEnabled();
  });

  test('closing a diverged query removes its actions with it', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await openSavedQuery(user, 'Top chats');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.AggregateMode' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'Buttons.Close Top chats' }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).not.toBeInTheDocument(),
    );
  });

  test('diverging from a loaded query enables Revert', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await openSavedQuery(user, 'Top chats');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.AggregateMode' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).toBeEnabled());
    expect(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).toBeInTheDocument();
  });

  test('reverting restores the loaded query and disables Revert again', async () => {
    const user = userEvent.setup();
    renderBuilder();

    await openSavedQuery(user, 'Top chats');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.AggregateMode' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryRevert' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).toBeDisabled());
  });

  test('saving a loaded query replaces it in place rather than creating another', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSavedQuery).mockResolvedValue({ success: true, response: ROW_QUERY });
    renderBuilder();

    await openSavedQuery(user, 'Top chats');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.AggregateMode' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.SaveQuery' }));

    await waitFor(() => expect(updateSavedQuery).toHaveBeenCalledWith('sq_1', expect.anything()));
    expect(createSavedQuery).not.toHaveBeenCalled();
  });

  test('the replace body carries only the accepted fields', async () => {
    const user = userEvent.setup();
    vi.mocked(updateSavedQuery).mockResolvedValue({ success: true, response: ROW_QUERY });
    renderBuilder();

    await openSavedQuery(user, 'Top chats');
    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.AggregateMode' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'QueryBuilder.SavedQueryRevert' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'QueryBuilder.SaveQuery' }));

    await waitFor(() => expect(updateSavedQuery).toHaveBeenCalled());
    const body = vi.mocked(updateSavedQuery).mock.calls[0][1];
    ['id', 'owner_id', 'owner_email', 'source', 'generation', 'created_at', 'updated_at', 'params'].forEach((key) =>
      expect(body).not.toHaveProperty(key),
    );
  });

  test('a saved chart opens on the Chart tab and survives the first run', async () => {
    const user = userEvent.setup();
    vi.mocked(listSavedQueries).mockResolvedValue([CHART_QUERY]);
    vi.mocked(executeQuery).mockResolvedValue({
      success: true,
      response: { columns: ['project_id', 'Count'], rows: [{ project_id: 'a', Count: 3 }] },
    });
    renderBuilder();

    await openSavedQuery(user, 'Requests per project');

    // The stored view is applied on load, before any result exists.
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'QueryBuilder.ViewChart' })).toHaveAttribute('aria-selected', 'true'),
    );

    await user.click(screen.getByRole('button', { name: 'QueryBuilder.Run' }));

    // ChartConfig needs a result to mean anything, so the first run after a load must not reset it.
    await waitFor(() => expect(screen.getByText('chart canvas')).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: 'Line' })).toHaveAttribute('aria-selected', 'true');
  });
});
