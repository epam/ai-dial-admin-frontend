import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryQuery } from '@/src/models/telemetry';
import { API } from './api';
import { BaseApi } from './base-api';

export const DASHBOARD_URL = `${API}/metrics/datasets/dial_analytics_realtime/data`;
export const DATASETS_URL = `${API}/metrics/datasets`;

export class TelemetryApi extends BaseApi {
  getDashboardData(query: TelemetryQuery, token: Token): Promise<ServerActionResponse> {
    return this.postAction(DASHBOARD_URL, query, token);
  }

  getDatasets(token: Token): Promise<ServerActionResponse> {
    return this.getAction(DATASETS_URL, token);
  }
}
