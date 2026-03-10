import { Token } from '@/src/models/auth';
import { ExtractionResult, Run } from '@/src/models/evaluation/run';
import { EvaluationPageData, FilterDto } from '@/src/models/request';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { getRequestFiltersStr } from '@/src/utils/request/get-request-filters';

export const RUNS_URL = `${API}/test-suite-runs`;
export const RUN_URL = (id: string) => `${RUNS_URL}/${id}`;
export const RUN_RESULTS_URL = `${API}/analytics/test-case-results`;
export class RunsApi extends BaseApi {
  getRuns(page: number, size: number, token: Token): Promise<EvaluationPageData<Run> | null> {
    return this.get<EvaluationPageData<Run>>(`${RUNS_URL}?page=${page}&size=${size}&includeTotalCount=true`, token);
  }

  getRun(id: string, token: Token): Promise<Run | null> {
    return this.get<Run>(RUN_URL(id), token);
  }

  removeRun(id: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(RUN_URL(id), token);
  }

  getRunResults(token: Token, filters: FilterDto[]): Promise<{ content: ExtractionResult[] } | null> {
    return this.get<{ content: ExtractionResult[] }>(`${RUN_RESULTS_URL}?${getRequestFiltersStr(filters)}`, token);
  }
}
