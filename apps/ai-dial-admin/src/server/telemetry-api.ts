import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryQuery } from '@/src/models/telemetry';
import { JWT } from 'next-auth/jwt';
import { API } from './api';
import { BaseApi } from './base-api';

export const DASHBOARD_URL = `${API}/metrics/datasets/dial_analytics_realtime/data`;
export const USAGE_LOG_URL = `${API}/usageLog`;

export class TelemetryApi extends BaseApi {
  getDashboardData(query: TelemetryQuery, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(DASHBOARD_URL, query, token);
  }

  getUsageLog(token: JWT | null): Promise<any[] | null> {
    return this.get(USAGE_LOG_URL, token);
  }
}
