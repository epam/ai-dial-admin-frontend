import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { replaceDashboard } from '@/src/app/[lang]/dashboards/custom-actions';
import { listSavedQueries } from '@/src/app/[lang]/queries/actions';
import CustomDashboardView from '@/src/components/Analytics/CustomDashboards/CustomDashboardView';
import { AnalyticsUsageI18nKey, ButtonsI18nKey, CustomDashboardsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import {
  Dashboard,
  DashboardVisibility,
  DashboardWidget,
  ResolvedDashboard,
  WidgetQuery,
  WidgetQueryKind,
} from '@/src/models/analytics/dashboard';
import { useNotification } from '@/src/context/NotificationContext';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryScope, SavedQueryTimeMode } from '@/src/models/analytics/saved-query';

vi.mock('@/src/app/[lang]/dashboards/custom-actions', () => ({
  createDashboard: vi.fn(),
  deleteDashboard: vi.fn(),
  replaceDashboard: vi.fn(),
  resolveInlineWidgetQuery: vi.fn(),
  resolveWidgetQuery: vi.fn(),
}));

vi.mock('@/src/app/[lang]/queries/actions', () => ({ listSavedQueries: vi.fn() }));

// The grid engine needs a measured container; the stub lays widgets out in placement order.
vi.mock('@/src/components/Analytics/CustomDashboards/Grid/DashboardGrid', () => ({
  default: ({
    widgets,
    renderWidget,
  }: {
    widgets: DashboardWidget[];
    renderWidget: (widget: DashboardWidget, index: number, ordered: DashboardWidget[]) => ReactNode;
  }) => (
    <div>
      {widgets.map((widget, index) => (
        <div key={widget.id}>{renderWidget(widget, index, widgets)}</div>
      ))}
    </div>
  ),
}));

// A card runs its own query; here it only has to name itself, expose Remove in edit mode, and report an
// unavailable query as denied, as the real card does once its data hook says so.
vi.mock('@/src/components/Analytics/CustomDashboards/Widget/WidgetCard', () => ({
  default: ({
    widget,
    widgetQuery,
    refreshToken,
    isEditing,
    onRemove,
    onDeniedChange,
    onLoadingChange,
  }: {
    widget: DashboardWidget;
    widgetQuery?: WidgetQuery;
    refreshToken?: number;
    isEditing: boolean;
    onRemove: (id: string) => void;
    onDeniedChange?: (id: string, isDenied: boolean) => void;
    onLoadingChange?: (id: string, isLoading: boolean) => void;
  }) => {
    const isDenied = widgetQuery?.kind === WidgetQueryKind.Unavailable;
    const isLoading = widget.title === 'Loading';
    useEffect(() => {
      onDeniedChange?.(widget.id, isDenied);
    }, [onDeniedChange, widget.id, isDenied]);
    useEffect(() => {
      onLoadingChange?.(widget.id, isLoading);
    }, [onLoadingChange, widget.id, isLoading]);
    return (
      <section aria-label={widget.title} data-refresh-token={refreshToken}>
        {isEditing && (
          <button type="button" onClick={() => onRemove(widget.id)}>
            {`remove ${widget.title}`}
          </button>
        )}
      </section>
    );
  },
}));

const WIDGETS: DashboardWidget[] = [
  { id: 'w-1', saved_query_id: 'q-1', title: 'Spend', row_limit: 100, layout: { x: 0, y: 0, w: 6, h: 4 } },
  { id: 'w-2', saved_query_id: 'q-2', title: 'Latency', row_limit: 100, layout: { x: 6, y: 0, w: 6, h: 4 } },
];

const DASHBOARD: Dashboard = {
  id: 'd-1',
  name: 'Costs',
  visibility: DashboardVisibility.Private,
  time: { mode: SavedQueryTimeMode.Relative, period: '7d' },
  widgets: WIDGETS,
  generation: 3,
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  permissions: { write: true, publish: true },
};

const resolve = (dashboard: Dashboard): ResolvedDashboard => ({ dashboard, queries: {} });

const router = { push: vi.fn(), refresh: vi.fn(), replace: vi.fn() };

describe('CustomDashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);
    vi.mocked(listSavedQueries).mockResolvedValue([]);
  });

  const openActions = async (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));

  const editLayout = async (user: ReturnType<typeof userEvent.setup>) => {
    await openActions(user);
    await user.click(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.EditLayout }));
  };

  const renderView = (dashboard: Dashboard = DASHBOARD, isInitiallyEditing = false) =>
    render(
      <CustomDashboardView
        resolved={resolve(dashboard)}
        dashboards={[
          {
            id: dashboard.id,
            name: dashboard.name,
            visibility: dashboard.visibility,
            updated_at: dashboard.updated_at,
            permissions: dashboard.permissions,
          },
        ]}
        createPermissions={{ create_private: true, create_public: true }}
        isInitiallyEditing={isInitiallyEditing}
      />,
    );

  test('drops the edit parameter from the address once a just-created dashboard opened in edit mode', () => {
    renderView(DASHBOARD, true);

    expect(screen.getByRole('button', { name: CustomDashboardsI18nKey.AddWidget })).toBeTruthy();
    expect(router.replace).toHaveBeenCalledWith('/dashboards/d-1');
  });

  test('states the dashboard description under its controls', () => {
    renderView({ ...DASHBOARD, description: 'Where agents spend' });

    expect(screen.getByText('Where agents spend')).toBeTruthy();
  });

  test('re-runs every widget on Refresh', async () => {
    renderView();
    const user = userEvent.setup();

    expect(screen.getByRole('region', { name: 'Spend' }).dataset.refreshToken).toBe('0');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Refresh }));

    expect(screen.getByRole('region', { name: 'Spend' }).dataset.refreshToken).toBe('1');
    expect(screen.getByRole('region', { name: 'Latency' }).dataset.refreshToken).toBe('1');
  });

  test('disables Refresh while a widget is loading', () => {
    renderView({ ...DASHBOARD, widgets: [{ ...WIDGETS[0], title: 'Loading' }, WIDGETS[1]] });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Refresh })).toBeDisabled();
  });

  test('leaves the address alone when the dashboard opens in view mode', () => {
    renderView();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Actions })).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });

  test('makes a compare change part of the draft in edit mode', async () => {
    renderView();
    const user = userEvent.setup();

    await editLayout(user);
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();

    await user.click(screen.getByRole('combobox', { name: new RegExp(`^${AnalyticsUsageI18nKey.CompareLabel}`) }));
    await user.click(await screen.findByRole('option', { name: AnalyticsUsageI18nKey.ComparePreviousMonth }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
  });

  test('offers the dashboard menu and no layout controls in view mode', async () => {
    renderView();

    // The switcher names the open dashboard; there is no separate name heading.
    expect(screen.getByRole('combobox', { name: new RegExp(`^${CustomDashboardsI18nKey.Switcher}`) })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Costs' })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Edit })).toBeNull();
    expect(screen.queryByRole('button', { name: CustomDashboardsI18nKey.AddWidget })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
    expect(screen.queryByRole('button', { name: 'remove Spend' })).toBeNull();

    await openActions(userEvent.setup());
    expect(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.EditDetails })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: CustomDashboardsI18nKey.EditLayout })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: CustomDashboardsI18nKey.DeleteDashboard })).toBeTruthy();
  });

  test('offers Add widget and a plain Cancel in edit mode until something changes', async () => {
    renderView();
    const user = userEvent.setup();

    await editLayout(user);

    expect(await screen.findByRole('button', { name: CustomDashboardsI18nKey.AddWidget })).toBeTruthy();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Cancel })).toBeTruthy();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Discard })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
  });

  test('leaves edit mode at once on Cancel, with nothing to confirm', async () => {
    renderView(DASHBOARD, true);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(await screen.findByRole('button', { name: ButtonsI18nKey.Actions })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: CustomDashboardsI18nKey.AddWidget })).toBeNull();
  });

  test('offers Discard and Save once the draft differs from the stored dashboard', async () => {
    renderView(DASHBOARD, true);
    const user = userEvent.setup();

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'remove Spend' }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Discard })).toBeTruthy();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Cancel })).toBeNull();
  });

  test('saves the whole draft guarded by the stored generation and returns to view mode', async () => {
    vi.mocked(replaceDashboard).mockResolvedValue({
      success: true,
      response: { ...DASHBOARD, widgets: [WIDGETS[1]], generation: 4 },
    });
    renderView(DASHBOARD, true);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'remove Spend' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(await screen.findByRole('button', { name: ButtonsI18nKey.Actions })).toBeTruthy();
    expect(replaceDashboard).toHaveBeenCalledWith(
      'd-1',
      expect.objectContaining({ name: 'Costs', widgets: [expect.objectContaining({ id: 'w-2' })] }),
      3,
    );
    expect(screen.queryByRole('region', { name: 'Spend' })).toBeNull();
  });

  test('stays in edit mode with the draft when the save fails', async () => {
    vi.mocked(replaceDashboard).mockResolvedValue({ success: false, errorMessage: 'stale' });
    renderView(DASHBOARD, true);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'remove Spend' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    await act(async () => {});

    expect(replaceDashboard).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeEnabled();
    expect(screen.getByRole('button', { name: CustomDashboardsI18nKey.AddWidget })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Spend' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Latency' })).toBeTruthy();
  });

  test('restores the stored widgets after a confirmed discard', async () => {
    renderView(DASHBOARD, true);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'remove Spend' }));
    expect(screen.queryByRole('region', { name: 'Spend' })).toBeNull();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    const dialog = await screen.findByRole('dialog', { name: EntitiesI18nKey.DiscardChanges });
    await user.click(within(dialog).getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect(await screen.findByRole('region', { name: 'Spend' })).toBeTruthy();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Actions })).toBeTruthy();
    expect(replaceDashboard).not.toHaveBeenCalled();
  });

  test('pre-fills Row count with 100 in the Add widget modal', async () => {
    renderView(DASHBOARD, true);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: CustomDashboardsI18nKey.AddWidget }));

    const rowCount = await screen.findByRole('spinbutton', { name: new RegExp(CustomDashboardsI18nKey.RowCount) });

    expect(rowCount).toHaveValue(100);
  });
});

describe('CustomDashboardView — empty dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);
    vi.mocked(listSavedQueries).mockResolvedValue([]);
  });

  const EMPTY: Dashboard = { ...DASHBOARD, widgets: [] };

  test('offers Edit layout from the empty state in view mode', () => {
    render(
      <CustomDashboardView
        resolved={resolve(EMPTY)}
        dashboards={[]}
        createPermissions={{ create_private: true, create_public: true }}
        isInitiallyEditing={false}
      />,
    );

    expect(screen.getByText(CustomDashboardsI18nKey.EmptyTitle)).toBeTruthy();
    expect(screen.getByRole('button', { name: CustomDashboardsI18nKey.EditLayout })).toBeTruthy();
  });

  test('offers Add widget from the empty state in edit mode', () => {
    render(
      <CustomDashboardView
        resolved={resolve(EMPTY)}
        dashboards={[]}
        createPermissions={{ create_private: true, create_public: true }}
        isInitiallyEditing
      />,
    );

    expect(screen.getByText(CustomDashboardsI18nKey.EmptyTitle)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: CustomDashboardsI18nKey.AddWidget })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: CustomDashboardsI18nKey.EditLayout })).toBeNull();
  });
});

describe('CustomDashboardView — access', () => {
  const PERSONAL_SQL = 'SELECT model, sum(cost) FROM usage GROUP BY model';
  const QUERIES: Record<string, WidgetQuery> = {
    'q-1': {
      kind: WidgetQueryKind.CompositeSql,
      savedQuery: {
        id: 'q-1',
        name: 'Personal spend',
        scope: SavedQueryScope.Personal,
        sql: PERSONAL_SQL,
        result_view: QueryResultView.Table,
      },
      sql: PERSONAL_SQL,
    },
    'q-2': {
      kind: WidgetQueryKind.CompositeSql,
      savedQuery: { id: 'q-2', name: 'Common latency', scope: SavedQueryScope.Common, sql: 'SELECT 1' },
      sql: 'SELECT 1',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);
    vi.mocked(listSavedQueries).mockResolvedValue([]);
    vi.mocked(replaceDashboard).mockImplementation(async (id, request, generation) => ({
      success: true,
      response: { ...DASHBOARD, ...request, id, generation: generation + 1 },
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderView = (dashboard: Dashboard = DASHBOARD, queries: Record<string, WidgetQuery> = QUERIES) =>
    render(
      <CustomDashboardView
        resolved={{ dashboard, queries }}
        dashboards={[]}
        createPermissions={{ create_private: true, create_public: true }}
        isInitiallyEditing={false}
      />,
    );

  const publish = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));
    await user.click(await screen.findByRole('menuitem', { name: CustomDashboardsI18nKey.EditDetails }));
    await user.click(await screen.findByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.Visibility) }));
    await user.click(await screen.findByRole('option', { name: CustomDashboardsI18nKey.VisibilityPublic }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));
  };

  test('asks before publishing, naming only the personal queries it copies', async () => {
    renderView();
    const user = userEvent.setup();

    await publish(user);

    expect(await screen.findByText(CustomDashboardsI18nKey.PublishMessage)).toBeTruthy();
    expect(screen.getByRole('listitem')).toHaveTextContent('Personal spend');
    expect(screen.queryByText('Common latency')).toBeNull();
    expect(replaceDashboard).not.toHaveBeenCalled();
  });

  test('writes the personal query as an inline copy once publishing is confirmed', async () => {
    renderView();
    const user = userEvent.setup();

    await publish(user);
    await user.click(await screen.findByRole('button', { name: CustomDashboardsI18nKey.PublishConfirm }));

    expect(replaceDashboard).toHaveBeenCalledOnce();
    expect(replaceDashboard).toHaveBeenCalledWith(
      'd-1',
      expect.objectContaining({
        visibility: DashboardVisibility.Public,
        widgets: [
          {
            id: 'w-1',
            title: 'Spend',
            row_limit: 100,
            layout: WIDGETS[0].layout,
            inline_query: { name: 'Personal spend', sql: PERSONAL_SQL, result_view: QueryResultView.Table },
          },
          WIDGETS[1],
        ],
      }),
      3,
    );
    await vi.waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
  });

  test('refuses to publish while a widget has not resolved its saved query', async () => {
    renderView(DASHBOARD, { 'q-2': QUERIES['q-2'] });
    const user = userEvent.setup();

    await publish(user);

    await vi.waitFor(() =>
      expect(useNotification().showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: CustomDashboardsI18nKey.PublishUnresolved }),
      ),
    );
    expect(screen.queryByText(CustomDashboardsI18nKey.PublishMessage)).toBeNull();
    expect(replaceDashboard).not.toHaveBeenCalled();
  });

  test('writes nothing when publishing is cancelled', async () => {
    renderView();
    const user = userEvent.setup();

    await publish(user);
    await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(screen.queryByText(CustomDashboardsI18nKey.PublishMessage)).toBeNull();
    expect(replaceDashboard).not.toHaveBeenCalled();
  });

  test('publishes at once when no widget uses a personal query', async () => {
    renderView({ ...DASHBOARD, widgets: [WIDGETS[1]] });
    const user = userEvent.setup();

    await publish(user);

    await vi.waitFor(() =>
      expect(replaceDashboard).toHaveBeenCalledWith(
        'd-1',
        expect.objectContaining({ visibility: DashboardVisibility.Public, widgets: [WIDGETS[1]] }),
        3,
      ),
    );
  });

  test('offers no dashboard actions on a dashboard the caller may not write', () => {
    renderView({ ...DASHBOARD, visibility: DashboardVisibility.Public, permissions: { write: false, publish: false } });

    expect(screen.getByRole('region', { name: 'Spend' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Actions })).toBeNull();
  });

  test('keeps the dashboard actions on a public dashboard the caller may write', () => {
    renderView({ ...DASHBOARD, visibility: DashboardVisibility.Public });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Actions })).toBeTruthy();
  });

  test('replaces the grid with one message when no widget is available to the viewer', async () => {
    renderView(DASHBOARD, {
      'q-1': { kind: WidgetQueryKind.Unavailable },
      'q-2': { kind: WidgetQueryKind.Unavailable },
    });

    expect(await screen.findByText(CustomDashboardsI18nKey.DashboardUnavailable)).toBeTruthy();
  });

  test('stores a personal saved query added to a public dashboard as an inline copy', async () => {
    vi.mocked(listSavedQueries).mockImplementation(async (scope) =>
      scope === SavedQueryScope.Personal
        ? [{ id: 'q-9', name: 'My spend', scope: SavedQueryScope.Personal, sql: PERSONAL_SQL } as SavedQuery]
        : [],
    );
    const publicDashboard: Dashboard = { ...DASHBOARD, visibility: DashboardVisibility.Public, widgets: [] };
    render(
      <CustomDashboardView
        resolved={{ dashboard: publicDashboard, queries: {} }}
        dashboards={[]}
        createPermissions={{ create_private: true, create_public: true }}
        isInitiallyEditing
      />,
    );
    const user = userEvent.setup();

    await user.click(screen.getAllByRole('button', { name: CustomDashboardsI18nKey.AddWidget })[0]);
    await user.click(await screen.findByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.SavedQuery) }));
    await user.click(await screen.findByRole('option', { name: 'My spend' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));
    expect(await screen.findByRole('region', { name: 'My spend' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    // Matched whole, so a widget that also kept a `saved_query_id` reference does not match.
    await vi.waitFor(() =>
      expect(replaceDashboard).toHaveBeenCalledWith(
        'd-1',
        expect.objectContaining({
          widgets: [
            {
              id: expect.any(String),
              title: 'My spend',
              row_limit: 100,
              layout: expect.anything(),
              inline_query: expect.objectContaining({ name: 'My spend', sql: PERSONAL_SQL }),
            },
          ],
        }),
        3,
      ),
    );
  });

  test('keeps the grid when only some widgets are unavailable', async () => {
    renderView(DASHBOARD, { ...QUERIES, 'q-1': { kind: WidgetQueryKind.Unavailable } });

    expect(await screen.findByRole('region', { name: 'Latency' })).toBeTruthy();
    expect(screen.queryByText(CustomDashboardsI18nKey.DashboardUnavailable)).toBeNull();
  });
});
