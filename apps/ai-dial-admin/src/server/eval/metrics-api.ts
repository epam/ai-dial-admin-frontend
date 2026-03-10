import { Token } from '@/src/models/auth';
import { Metric } from '@/src/models/evaluation/metric';
import { EvaluationPageData } from '@/src/models/request';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const METRICS_URL = `${API}/metrics-definitions`;
export const METRIC_URL = (id: string) => `${METRICS_URL}/${id}`;

export class MetricsApi extends BaseApi {
  getMetrics(page: number, size: number, token: Token): Promise<EvaluationPageData<Metric> | null> {
    return this.get<EvaluationPageData<Metric>>(
      `${METRICS_URL}?page=${page}&size=${size}&includeTotalCount=true`,
      token,
    );
  }

  getMetric(id: string, token: Token): Promise<Metric | null> {
    return this.get<Metric>(METRIC_URL(id), token);
  }
}
