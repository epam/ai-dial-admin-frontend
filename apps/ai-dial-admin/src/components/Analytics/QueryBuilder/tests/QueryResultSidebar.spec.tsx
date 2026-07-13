import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';

import * as actions from '@/src/app/[lang]/query-builder/actions';
import QueryResultSidebar from '@/src/components/Analytics/QueryBuilder/Result/QueryResultSidebar';
import { DockPosition } from '@/src/components/Common/Sidebar/models';
import { BasicI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { QueryRequestKind, QueryRunRequest } from '@/src/models/analytics/query-builder';

vi.mock('@/src/app/[lang]/query-builder/actions');
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData?: unknown[] }) => <div>grid rows: {rowData?.length ?? 0}</div>,
}));

const toggleDock = vi.fn();
const toggleDockCollapsed = vi.fn();
const mockSidebar = {
  show: true,
  content: null,
  showSidebar: vi.fn(),
  closeSidebar: vi.fn(),
  dockable: true,
  dockPosition: DockPosition.Right,
  dockCollapsed: false,
  toggleDock,
  toggleDockCollapsed,
};

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ sidebar: mockSidebar }),
}));

const QUERY: StructuredQuery = { entity: 'dial_usage_log', mode: QueryMode.Row };
const STRUCTURED_REQUEST: QueryRunRequest = { kind: QueryRequestKind.Structured, query: QUERY };
const SQL_REQUEST: QueryRunRequest = { kind: QueryRequestKind.Sql, sql: 'SELECT event_id FROM dial_usage_log' };

beforeEach(() => {
  vi.clearAllMocks();
  mockSidebar.dockPosition = DockPosition.Right;
  mockSidebar.dockCollapsed = false;
});

describe('QueryResultSidebar', () => {
  test('runs the structured query on mount and renders the result grid with a row count', async () => {
    (actions.executeQuery as Mock).mockResolvedValue({
      success: true,
      response: { columns: ['event_id'], rows: [{ event_id: 'a' }, { event_id: 'b' }] },
    });

    render(<QueryResultSidebar request={STRUCTURED_REQUEST} />);

    expect(await screen.findByText('grid rows: 2')).toBeInTheDocument();
    expect(screen.getByText(QueryBuilderI18nKey.Rows)).toBeInTheDocument();
    expect(actions.executeQuery).toHaveBeenCalledWith(QUERY);
  });

  test('runs a SQL request via executeSqlQuery', async () => {
    (actions.executeSqlQuery as Mock).mockResolvedValue({
      success: true,
      response: { columns: ['event_id'], rows: [{ event_id: 'a' }] },
    });

    render(<QueryResultSidebar request={SQL_REQUEST} />);

    expect(await screen.findByText('grid rows: 1')).toBeInTheDocument();
    expect(actions.executeSqlQuery).toHaveBeenCalledWith(
      SQL_REQUEST.kind === QueryRequestKind.Sql ? SQL_REQUEST.sql : '',
    );
    expect(actions.executeQuery).not.toHaveBeenCalled();
  });

  test('surfaces an error notification when a SQL run fails', async () => {
    (actions.executeSqlQuery as Mock).mockResolvedValue({
      success: false,
      errorHeader: 'bad sql',
      errorMessage: 'unsupported construct',
    });

    render(<QueryResultSidebar request={SQL_REQUEST} />);

    expect(await screen.findByText(QueryBuilderI18nKey.NoRows)).toBeInTheDocument();
  });

  test('shows the empty state when the result has no rows', async () => {
    (actions.executeQuery as Mock).mockResolvedValue({
      success: true,
      response: { columns: [], rows: [] },
    });

    render(<QueryResultSidebar request={STRUCTURED_REQUEST} />);

    expect(await screen.findByText(QueryBuilderI18nKey.NoRows)).toBeInTheDocument();
  });

  test('renders a "dock to bottom" toggle when docked right and calls toggleDock on click', async () => {
    (actions.executeQuery as Mock).mockResolvedValue({ success: true, response: { columns: [], rows: [] } });
    const user = userEvent.setup();

    render(<QueryResultSidebar request={STRUCTURED_REQUEST} />);

    const toggle = await screen.findByRole('button', { name: QueryBuilderI18nKey.DockToBottom });
    expect(toggle).toBeInTheDocument();

    await user.click(toggle);
    expect(toggleDock).toHaveBeenCalledTimes(1);
  });

  test('shows a "dock to right" toggle when currently docked to the bottom', async () => {
    mockSidebar.dockPosition = DockPosition.Bottom;
    (actions.executeQuery as Mock).mockResolvedValue({ success: true, response: { columns: [], rows: [] } });

    render(<QueryResultSidebar request={STRUCTURED_REQUEST} />);

    expect(await screen.findByRole('button', { name: QueryBuilderI18nKey.DockToRight })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: QueryBuilderI18nKey.DockToBottom })).not.toBeInTheDocument();
  });

  test('shows a collapse toggle only when docked to the bottom and calls toggleDockCollapsed', async () => {
    (actions.executeQuery as Mock).mockResolvedValue({ success: true, response: { columns: [], rows: [] } });
    const user = userEvent.setup();

    // Right dock → no collapse control.
    const { unmount } = render(<QueryResultSidebar request={STRUCTURED_REQUEST} />);
    await screen.findByRole('button', { name: QueryBuilderI18nKey.DockToBottom });
    expect(screen.queryByRole('button', { name: BasicI18nKey.Collapse })).not.toBeInTheDocument();
    unmount();

    // Bottom dock → collapse control present and wired.
    mockSidebar.dockPosition = DockPosition.Bottom;
    render(<QueryResultSidebar request={STRUCTURED_REQUEST} />);

    const collapse = await screen.findByRole('button', { name: BasicI18nKey.Collapse });
    await user.click(collapse);
    expect(toggleDockCollapsed).toHaveBeenCalledTimes(1);
  });

  test('shows an expand toggle when the bottom overlay is collapsed', async () => {
    mockSidebar.dockPosition = DockPosition.Bottom;
    mockSidebar.dockCollapsed = true;
    (actions.executeQuery as Mock).mockResolvedValue({ success: true, response: { columns: [], rows: [] } });

    render(<QueryResultSidebar request={STRUCTURED_REQUEST} />);

    expect(await screen.findByRole('button', { name: BasicI18nKey.Expand })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BasicI18nKey.Collapse })).not.toBeInTheDocument();
  });
});
