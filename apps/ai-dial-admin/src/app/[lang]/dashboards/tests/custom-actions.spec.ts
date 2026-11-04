import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi, dashboardsApi } from '@/src/app/api/api';
import {
  createDashboard,
  getResolvedDashboard,
  listDashboards,
  replaceDashboard,
  resolveInlineWidgetQuery,
  resolveWidgetQuery,
} from '@/src/app/[lang]/dashboards/custom-actions';
import { Dashboard, DashboardRequest, DashboardVisibility, WidgetQueryKind } from '@/src/models/analytics/dashboard';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIsCustomDashboardsEnabled } from '@/src/utils/env/get-custom-dashboards-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/utils/env/get-custom-dashboards-toggle');
vi.mock('@/src/app/api/api');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const query: StructuredQuery = { entity: 'dial_usage_log', mode: QueryMode.Row };

const savedQuery = (patch: Partial<SavedQuery> = {}): SavedQuery => ({
  id: 'q1',
  name: 'Calls',
  scope: SavedQueryScope.Personal,
  result_view: QueryResultView.Table,
  generation: 1,
  created_at: '',
  updated_at: '',
  ...patch,
});

const dashboard: Dashboard = {
  id: 'd1',
  name: 'Ops',
  visibility: DashboardVisibility.Private,
  widgets: [
    { id: 'w1', saved_query_id: 'q1', row_limit: 100, layout: { x: 0, y: 0, w: 6, h: 4 } },
    { id: 'w2', saved_query_id: 'q1', row_limit: 10, layout: { x: 6, y: 0, w: 6, h: 4 } },
  ],
  generation: 1,
  created_at: '',
  updated_at: '',
  permissions: { write: true, publish: false },
};

describe('custom dashboards server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
    vi.mocked(getIsCustomDashboardsEnabled).mockReturnValue(true);
    vi.mocked(analyticsDataApi.getEntitySchema).mockResolvedValue({
      success: true,
      response: { name: 'dial_usage_log', fields: [] } as never,
    });
  });

  test('answers every call with a failure while the flag is off', async () => {
    vi.mocked(getIsCustomDashboardsEnabled).mockReturnValue(false);

    expect((await listDashboards()).success).toBe(false);
    expect((await createDashboard({ name: 'Ops', visibility: DashboardVisibility.Private, widgets: [] })).success).toBe(
      false,
    );
    expect(await resolveWidgetQuery('q1')).toEqual({ kind: WidgetQueryKind.Unavailable });
    expect(dashboardsApi.listDashboards).not.toHaveBeenCalled();
  });

  test('replaceDashboard passes the generation the caller read, with the caller token', async () => {
    const request: DashboardRequest = { name: 'Ops', visibility: DashboardVisibility.Private, widgets: [] };
    vi.mocked(dashboardsApi.replaceDashboard).mockResolvedValue({ success: true });

    await replaceDashboard('d1', request, 4);
    expect(dashboardsApi.replaceDashboard).toHaveBeenCalledWith('d1', request, 4, TOKEN_MOCK);
  });

  test('listDashboards lists with the caller token', async () => {
    vi.mocked(dashboardsApi.listDashboards).mockResolvedValue({
      success: true,
      response: { dashboards: [], permissions: { create_private: true, create_public: false } },
    });

    await listDashboards();
    expect(dashboardsApi.listDashboards).toHaveBeenCalledWith(TOKEN_MOCK);
  });

  test('createDashboard creates with the caller token', async () => {
    const request: DashboardRequest = { name: 'Ops', visibility: DashboardVisibility.Private, widgets: [] };
    vi.mocked(dashboardsApi.createDashboard).mockResolvedValue({ success: true, response: dashboard });

    await createDashboard(request);
    expect(dashboardsApi.createDashboard).toHaveBeenCalledWith(request, TOKEN_MOCK);
  });

  test('passes a dashboard the service refuses through without resolving any query', async () => {
    vi.mocked(dashboardsApi.getDashboard).mockResolvedValue({ success: false, status: 404, errorMessage: 'gone' });

    expect(await getResolvedDashboard('d1')).toEqual(expect.objectContaining({ success: false, status: 404 }));
    expect(dashboardsApi.getDashboard).toHaveBeenCalledWith('d1', TOKEN_MOCK);
    expect(analyticsDataApi.getSavedQuery).not.toHaveBeenCalled();
  });

  test('resolves an inline query under the widget key without reading a saved query', async () => {
    const sql = 'SELECT * FROM a JOIN b ON a.id = b.id';
    vi.mocked(dashboardsApi.getDashboard).mockResolvedValue({
      success: true,
      response: {
        ...dashboard,
        widgets: [
          {
            id: 'w3',
            inline_query: { name: 'Joined', sql, result_view: QueryResultView.Table },
            row_limit: 100,
            layout: { x: 0, y: 0, w: 6, h: 4 },
          },
          {
            id: 'w4',
            inline_query: { name: 'Rows', query, result_view: QueryResultView.Table },
            row_limit: 100,
            layout: { x: 6, y: 0, w: 6, h: 4 },
          },
        ],
      },
    });
    vi.mocked(analyticsDataApi.translateSqlAction).mockResolvedValue({ success: false, status: 400 });

    const res = await getResolvedDashboard('d1');

    expect(analyticsDataApi.getSavedQuery).not.toHaveBeenCalled();
    expect(res.response?.queries).toEqual({
      'inline:w3': expect.objectContaining({ kind: WidgetQueryKind.CompositeSql, sql }),
      'inline:w4': expect.objectContaining({ kind: WidgetQueryKind.Structured, query }),
    });
  });

  test('resolveInlineWidgetQuery translates SQL without reading a saved query', async () => {
    vi.mocked(analyticsDataApi.translateSqlAction).mockResolvedValue({ success: true, response: { query } });

    expect(
      await resolveInlineWidgetQuery({
        name: 'Calls',
        sql: 'SELECT * FROM dial_usage_log',
        result_view: QueryResultView.Table,
      }),
    ).toEqual(expect.objectContaining({ kind: WidgetQueryKind.Structured, query }));
    expect(analyticsDataApi.translateSqlAction).toHaveBeenCalledWith('SELECT * FROM dial_usage_log', TOKEN_MOCK);
    expect(analyticsDataApi.getSavedQuery).not.toHaveBeenCalled();
  });

  test('resolves each distinct saved query once, with the caller token', async () => {
    vi.mocked(dashboardsApi.getDashboard).mockResolvedValue({ success: true, response: dashboard });
    vi.mocked(analyticsDataApi.getSavedQuery).mockResolvedValue({ success: true, response: savedQuery({ query }) });

    const res = await getResolvedDashboard('d1');

    expect(analyticsDataApi.getSavedQuery).toHaveBeenCalledOnce();
    expect(analyticsDataApi.getSavedQuery).toHaveBeenCalledWith('q1', TOKEN_MOCK);
    expect(res.response?.queries.q1).toEqual(expect.objectContaining({ kind: WidgetQueryKind.Structured, query }));
  });

  test('passes a missing dashboard through as a failure', async () => {
    vi.mocked(dashboardsApi.getDashboard).mockResolvedValue({ success: false, status: 404, errorMessage: 'gone' });

    expect(await getResolvedDashboard('d1')).toEqual({
      success: false,
      status: 404,
      errorHeader: undefined,
      errorMessage: 'gone',
    });
  });

  test('resolves translatable SQL to its structured form', async () => {
    vi.mocked(analyticsDataApi.getSavedQuery).mockResolvedValue({
      success: true,
      response: savedQuery({ sql: 'SELECT * FROM dial_usage_log' }),
    });
    vi.mocked(analyticsDataApi.translateSqlAction).mockResolvedValue({ success: true, response: { query } });

    expect(await resolveWidgetQuery('q1')).toEqual(
      expect.objectContaining({ kind: WidgetQueryKind.Structured, query }),
    );
  });

  test('resolves SQL with no structured form as composite', async () => {
    const sql = 'SELECT * FROM a JOIN b ON a.id = b.id';
    vi.mocked(analyticsDataApi.getSavedQuery).mockResolvedValue({ success: true, response: savedQuery({ sql }) });
    vi.mocked(analyticsDataApi.translateSqlAction).mockResolvedValue({ success: false, status: 400 });

    expect(await resolveWidgetQuery('q1')).toEqual(
      expect.objectContaining({ kind: WidgetQueryKind.CompositeSql, sql }),
    );
  });

  test.each([403, 404])('resolves a saved query answered %i as unavailable', async (status) => {
    vi.mocked(analyticsDataApi.getSavedQuery).mockResolvedValue({ success: false, status });

    expect(await resolveWidgetQuery('q1')).toEqual({ kind: WidgetQueryKind.Unavailable });
  });

  test('resolves a saved query whose read failed otherwise as failed, so it can be retried', async () => {
    vi.mocked(analyticsDataApi.getSavedQuery).mockResolvedValue({ success: false, status: 500 });

    expect(await resolveWidgetQuery('q1')).toEqual({ kind: WidgetQueryKind.Failed });
  });

  test('resolves a structured query whose entity schema could not be read as failed', async () => {
    vi.mocked(analyticsDataApi.getSavedQuery).mockResolvedValue({ success: true, response: savedQuery({ query }) });
    vi.mocked(analyticsDataApi.getEntitySchema).mockResolvedValue({ success: false, status: 502 });

    expect(await resolveWidgetQuery('q1')).toEqual({ kind: WidgetQueryKind.Failed });
  });

  test('fails only the widget whose resolution throws, not the whole dashboard', async () => {
    const second = { ...dashboard.widgets[0], id: 'w3', saved_query_id: 'q2' };
    vi.mocked(dashboardsApi.getDashboard).mockResolvedValue({
      success: true,
      response: { ...dashboard, widgets: [...dashboard.widgets, second] },
    });
    vi.mocked(analyticsDataApi.getSavedQuery).mockImplementation(async (id) => {
      if (id === 'q2') throw new Error('network');
      return { success: true, response: savedQuery({ query }) };
    });

    const res = await getResolvedDashboard('d1');

    expect(res.success).toBe(true);
    expect(res.response?.queries.q1).toEqual(expect.objectContaining({ kind: WidgetQueryKind.Structured }));
    expect(res.response?.queries.q2).toEqual({ kind: WidgetQueryKind.Failed });
  });
});
