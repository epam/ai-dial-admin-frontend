import { JWT } from 'next-auth/jwt';

import { Metric } from '@/src/models/evaluation/metric';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { EvaluationPageData } from '@/src/models/request';

export const METRICS_URL = `${API}/metrics-definitions`;
export const METRIC_URL = (id: string) => `${METRICS_URL}/${id}`;

export class MetricsApi extends BaseApi {
  getMetrics(page: number, size: number, token: JWT | null): Promise<EvaluationPageData<Metric> | null> {
    return this.get<EvaluationPageData<Metric>>(
      `${METRICS_URL}?page=${page}&size=${size}&includeTotalCount=true`,
      token,
    );
  }

  getMetric(id: string, token: JWT | null): Promise<Metric | null> {
    return this.get<Metric>(METRIC_URL(id), token);
  }
}
