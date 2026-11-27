import { Token } from '@/src/models/auth';
import {
  DeploymentCosts,
  ExtractionResult,
  Run,
  RunTotalCosts,
  RunsTotalCostsRequest,
  SuitePassRateRequest,
  SuitePassRateResponse,
  TotalCosts,
  TotalCostsRequest,
} from '@/src/models/evaluation/run';
import { EvaluationPageData, FilterDto, SortDto } from '@/src/models/request';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { encodeCorePath } from '@/src/server/publications/path';
import { getRequestFiltersStr } from '@/src/utils/request/get-request-filters';
import { getRequestSortsStr } from '@/src/utils/request/get-request-sorts';

export const RUNS_URL = `${API}/test-suite-runs`;
export const RUN_URL = (id: string) => `${RUNS_URL}/${id}`;
export const RUNS_TOTAL_COSTS_URL = `${API}/costs/test-suite-runs`;
export const TOTAL_COSTS_URL = `${API}/costs/total`;
export const DEPLOYMENT_COSTS_URL = (deploymentId: string, fromMs: number, toMs: number) =>
  `${API}/costs/deployment/${encodeCorePath(deploymentId)}?from=${fromMs}&to=${toMs}`;
export const RUN_CANCEL_URL = (id: string) => `${RUN_URL(id)}/cancel`;
export const RUN_RESULTS_URL = `${API}/analytics/test-case-results`;
export const SUITE_PASS_RATE_URL = `${API}/analytics/test-suites/pass-rate`;

export class RunsApi extends BaseApi {
  getRuns(
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: Token,
  ): Promise<EvaluationPageData<Run> | null> {
    const filtersStr = getRequestFiltersStr(filters);
    const sortsStr = getRequestSortsStr(sorts);
    const filtersAndSortsStr = `${filtersStr || sortsStr ? '&' : ''}${filtersStr}${sortsStr ? '&' : ''}${sortsStr}`;
    return this.get<EvaluationPageData<Run>>(
      `${RUNS_URL}?page=${page}&size=${size}&includeTotalCount=true${filtersAndSortsStr}`,
      token,
    );
  }

  getRun(id: string, token: Token): Promise<Run | null> {
    return this.get<Run>(RUN_URL(id), token);
  }

  getRunsTotalCosts(runIds: RunsTotalCostsRequest, token: Token): Promise<RunTotalCosts[] | null> {
    return this.post(RUNS_TOTAL_COSTS_URL, runIds, token);
  }

  getTotalCosts(fromMs: number, toMs: number, token: Token): Promise<TotalCosts | null> {
    const request: TotalCostsRequest = { from: fromMs, to: toMs };
    return this.post<TotalCostsRequest, TotalCosts>(TOTAL_COSTS_URL, request, token);
  }

  getDeploymentCosts(
    deploymentId: string,
    fromMs: number,
    toMs: number,
    token: Token,
  ): Promise<DeploymentCosts | null> {
    return this.get<DeploymentCosts>(DEPLOYMENT_COSTS_URL(deploymentId, fromMs, toMs), token);
  }

  removeRun(id: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(RUN_URL(id), token);
  }

  cancelRun(id: string, token: Token): Promise<ServerActionResponse> {
    return this.postAction(RUN_CANCEL_URL(id), {}, token);
  }

  getRunResults(token: Token, filters: FilterDto[]): Promise<{ content: ExtractionResult[] } | null> {
    return this.get<{ content: ExtractionResult[] }>(
      `${RUN_RESULTS_URL}?size=1000&${getRequestFiltersStr(filters)}`,
      token,
    );
  }

  getSuitePassRate(request: SuitePassRateRequest, token: Token): Promise<SuitePassRateResponse | null> {
    return this.post(SUITE_PASS_RATE_URL, request, token);
  }
}
