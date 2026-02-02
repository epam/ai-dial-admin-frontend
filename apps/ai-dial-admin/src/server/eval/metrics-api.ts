import { JWT } from 'next-auth/jwt';

import { BaseApi } from '@/src/server/base-api';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { Metric } from '@/src/models/evaluation/metric';

export const METRICS_URL = `${API}/metrics-definitions`;
export const METRIC_URL = (id: string) => `${METRICS_URL}/${id}`;

export class MetricsApi extends BaseApi {
  getMetrics(token: JWT | null): Promise<Metric[]> {
    return this.get<{ content: Metric[] }>(METRICS_URL, token).then((res) => res?.content || []);
  }

  getMetric(id: string, token: JWT | null): Promise<ServerActionResponse> {
    return this.getAction(METRIC_URL(id), token);
  }
}
