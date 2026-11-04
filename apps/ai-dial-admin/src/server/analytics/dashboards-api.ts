import { Token } from '@/src/models/auth';
import { Dashboard, DashboardList, DashboardRequest } from '@/src/models/analytics/dashboard';
import { ServerActionResponse } from '@/src/models/server-action';
import { unreadableBody } from '@/src/server/analytics/analytics-data-api';
import { BaseApi } from '@/src/server/base-api';

export const DASHBOARDS_URL = 'v1/dashboards';
export const DASHBOARD_URL = (id: string): string => `${DASHBOARDS_URL}/${encodeURIComponent(id)}`;

interface DashboardReplaceRequest extends DashboardRequest {
  generation: number;
}

export class DashboardsApi extends BaseApi {
  async listDashboards(token: Token): Promise<ServerActionResponse<DashboardList>> {
    const res = await this.getAction(DASHBOARDS_URL, token);
    if (!res.success) return res;

    const list = res.response as DashboardList | undefined;
    return Array.isArray(list?.dashboards) ? { ...res, response: list } : unreadableBody(res);
  }

  async getDashboard(id: string, token: Token): Promise<ServerActionResponse<Dashboard>> {
    const res = await this.getAction(DASHBOARD_URL(id), token);
    return res.success && !res.response ? unreadableBody(res) : res;
  }

  createDashboard(request: DashboardRequest, token: Token): Promise<ServerActionResponse<Dashboard>> {
    return this.postAction<DashboardRequest>(DASHBOARDS_URL, request, token);
  }

  replaceDashboard(
    id: string,
    request: DashboardRequest,
    generation: number,
    token: Token,
  ): Promise<ServerActionResponse<Dashboard>> {
    return this.putAction<DashboardReplaceRequest>(DASHBOARD_URL(id), { ...request, generation }, token);
  }

  deleteDashboard(id: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(DASHBOARD_URL(id), token);
  }
}
