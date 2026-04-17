import { Token } from '@/src/models/auth';
import { MetricSnapshot } from '@/src/models/evaluation/metric';
import { AnalyticsResult } from '@/src/models/evaluation/run';
import { FilterDto } from '@/src/models/request';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { getRequestFiltersStr } from '@/src/utils/request/get-request-filters';

export const ANALYTICS_URL = `${API}/analytics`;
export const ANALYTICS_RESULTS_URL = `${ANALYTICS_URL}/eval-summaries`;
export const ANALYTICS_RUN_METRIC_SNAPSHOTS_URL = `${ANALYTICS_URL}/run-metric-snapshots`;

export class AnalyticsApi extends BaseApi {
  getTestCaseRunResults(filters: FilterDto[], token: Token): Promise<{ content: AnalyticsResult[] } | null> {
    return this.get<{ content: AnalyticsResult[] }>(
      `${ANALYTICS_RESULTS_URL}?${getRequestFiltersStr(filters)}&computation=latest&size=1000`,
      token,
    );
  }

  getTestCaseRunResultDetails(id: string, token: Token): Promise<AnalyticsResult | null> {
    return this.get<AnalyticsResult>(`${ANALYTICS_RESULTS_URL}/${id}`, token);
  }

  getMetricSnapshots(filters: FilterDto[], token: Token): Promise<MetricSnapshot[] | null> {
    return this.get<MetricSnapshot[]>(`${ANALYTICS_RUN_METRIC_SNAPSHOTS_URL}?${getRequestFiltersStr(filters)}`, token);
  }
}
