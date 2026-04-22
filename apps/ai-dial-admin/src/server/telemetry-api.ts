import { Token } from '@/src/models/auth';
import { ServerActionResponse } from '@/src/models/server-action';
import { TelemetryQuery } from '@/src/models/telemetry';
import { TELEMETRY_DATASET_NAME } from '@/src/constants/telemetry';
import { API } from './api';
import { BaseApi } from './base-api';

export const DATASETS_URL = `${API}/metrics/datasets`;
export const DASHBOARD_URL = `${DATASETS_URL}/${TELEMETRY_DATASET_NAME}/data`;

export class TelemetryApi extends BaseApi {
  getDashboardData(query: TelemetryQuery, token: Token): Promise<ServerActionResponse> {
    return this.postAction(DASHBOARD_URL, query, token);
  }

  getDatasets(token: Token): Promise<ServerActionResponse> {
    return this.getAction(DATASETS_URL, token);
  }
}
