import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { Dashboard, DashboardList, DashboardRequest, DashboardVisibility } from '@/src/models/analytics/dashboard';
import { DashboardsApi } from '@/src/server/analytics/dashboards-api';
import { TEST_URL, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

const fetch = createFetchMock(vi);
fetch.enableMocks();

const JSON_HEADERS = { headers: { 'content-type': 'application/json' } };

const request: DashboardRequest = {
  name: 'Ops',
  visibility: DashboardVisibility.Private,
  widgets: [],
};

const dashboard: Dashboard = {
  ...request,
  id: 'dash 1',
  generation: 3,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
  permissions: { write: true, publish: false },
};

const list: DashboardList = {
  dashboards: [
    {
      id: dashboard.id,
      name: dashboard.name,
      visibility: dashboard.visibility,
      updated_at: dashboard.updated_at,
      permissions: dashboard.permissions,
    },
  ],
  permissions: { create_private: true, create_public: false },
};

describe('Server :: DashboardsApi', () => {
  const instance = new DashboardsApi({ host: TEST_URL });

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('listDashboards issues GET /v1/dashboards and keeps the list with its create permissions', async () => {
    fetch.mockResponseOnce(JSON.stringify(list), JSON_HEADERS);

    const res = await instance.listDashboards(TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: list }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/dashboards'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('listDashboards fails on a body without a dashboards array', async () => {
    fetch.mockResponseOnce(JSON.stringify(list.dashboards), JSON_HEADERS);

    const res = await instance.listDashboards(TOKEN_MOCK);

    expect(res.success).toBe(false);
  });

  test('getDashboard issues GET on the encoded dashboard URL', async () => {
    fetch.mockResponseOnce(JSON.stringify(dashboard), JSON_HEADERS);

    const res = await instance.getDashboard(dashboard.id, TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: dashboard }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/dashboards/dash%201'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('getDashboard passes the service status through for a dashboard it does not show', async () => {
    fetch.mockResponseOnce(JSON.stringify({ error: 'not_found', message: "dashboard 'x' was not found" }), {
      status: 404,
    });

    const res = await instance.getDashboard('x', TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: false, status: 404 }));
  });

  test('createDashboard POSTs the payload without a generation', async () => {
    fetch.mockResponseOnce(JSON.stringify(dashboard), JSON_HEADERS);

    const res = await instance.createDashboard(request, TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: true, response: dashboard }));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/dashboards'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(request) }),
    );
  });

  test('createDashboard surfaces the service message of a refused write', async () => {
    fetch.mockResponseOnce(
      JSON.stringify({ error: 'validation_error', message: "widget a: 'row_limit' must be a whole number" }),
      { status: 422 },
    );

    const res = await instance.createDashboard(request, TOKEN_MOCK);

    expect(res).toEqual(
      expect.objectContaining({
        success: false,
        status: 422,
        errorMessage: "widget a: 'row_limit' must be a whole number",
      }),
    );
  });

  test('replaceDashboard PUTs the payload with the generation the caller read', async () => {
    fetch.mockResponseOnce(JSON.stringify({ ...dashboard, generation: 4 }), JSON_HEADERS);

    await instance.replaceDashboard(dashboard.id, request, 3, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/dashboards/dash%201'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ ...request, generation: 3 }) }),
    );
  });

  test('replaceDashboard answers 409 when the dashboard moved past the generation', async () => {
    fetch.mockResponseOnce(JSON.stringify({ error: 'dashboard_conflict', message: 'has changed since generation 3' }), {
      status: 409,
    });

    const res = await instance.replaceDashboard(dashboard.id, request, 3, TOKEN_MOCK);

    expect(res).toEqual(expect.objectContaining({ success: false, status: 409 }));
  });

  test('deleteDashboard issues DELETE on the encoded dashboard URL', async () => {
    fetch.mockResponseOnce('');

    await instance.deleteDashboard(dashboard.id, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/dashboards/dash%201'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
