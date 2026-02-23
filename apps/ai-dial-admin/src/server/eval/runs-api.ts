import { Token } from '@/src/models/auth';
import { Run } from '@/src/models/evaluation/run';
import { EvaluationPageData } from '@/src/models/request';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';

export const RUNS_URL = `${API}/test-suite-runs`;
export const RUN_URL = (id: string) => `${RUNS_URL}/${id}`;

export class RunsApi extends BaseApi {
  getRuns(page: number, size: number, token: Token): Promise<EvaluationPageData<Run> | null> {
    return this.get<EvaluationPageData<Run>>(`${RUNS_URL}?page=${page}&size=${size}&includeTotalCount=true`, token);
  }

  getRun(id: string, token: Token): Promise<Run | null> {
    return this.get<Run>(RUN_URL(id), token);
  }
}
