import { JWT } from 'next-auth/jwt';

import { Deployment } from '@/src/models/evaluation/deployment';
import { TestCase, TestSuite, TestSuiteRun } from '@/src/models/evaluation/test-suite';
import { EvaluationPageData, FilterDto, SortDto } from '@/src/models/request';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { getRequestFiltersRunsStr, getRequestFiltersStr } from '@/src/utils/request/get-request-filters';
import { getRequestSortsStr } from '@/src/utils/request/get-request-sorts';

export const TEST_SUITES_URL = `${API}/test-suites`;
export const TEST_SUITE_URL = (id?: string) => `${TEST_SUITES_URL}/${id || ''}`;
export const TEST_CASES_URL = (id?: string) => `${TEST_SUITE_URL(id)}/test-cases`;
export const TEST_CASE_URL = (id?: string, testCaseId?: string) => `${TEST_CASES_URL(id)}/${testCaseId || ''}`;
export const DEPLOYMENTS_URL = `${API}/deployments`;
export const TEST_SUITES_RUNS_URL = `${API}/test-suite-runs`;

export class TestSuitesApi extends BaseApi {
  getTestSuites(
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: JWT | null,
  ): Promise<EvaluationPageData<TestSuite> | null> {
    return this.get<EvaluationPageData<TestSuite>>(
      `${TEST_SUITES_URL}?page=${page}&size=${size}&includeTotalCount=true${this.getFiltersAndSortsStr(sorts, filters)}`,
      token,
    );
  }

  getRuns(
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: JWT | null,
  ): Promise<EvaluationPageData<TestSuiteRun> | null> {
    return this.get<EvaluationPageData<TestSuiteRun>>(
      `${TEST_SUITES_RUNS_URL}?page=${page}&size=${size}&includeTotalCount=true${this.getFiltersAndSortsStr(sorts, filters)}`,
      token,
    );
  }

  getTestSuite(id: string, etag: string, token: JWT | null): Promise<ServerActionResponse<TestSuite> | null> {
    return this.getActionWithEtag(TEST_SUITE_URL(id), etag, token);
  }

  importTestCase(id: string, file: FormData, token: JWT | null): Promise<ServerActionResponse> {
    return this.postFiles(`${TEST_CASES_URL(id)}/import`, file, token);
  }

  importTestCasePreview(id: string, file: FormData, token: JWT | null): Promise<ServerActionResponse> {
    return this.postFiles(`${TEST_CASES_URL(id)}/import/preview`, file, token);
  }

  getTestCases(
    id: string | undefined,
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: JWT | null,
  ): Promise<EvaluationPageData<TestCase> | null> {
    return this.get<EvaluationPageData<TestCase>>(
      `${TEST_CASES_URL(id)}?page=${page}&size=${size}&includeTotalCount=true${this.getFiltersAndSortsStr(sorts, filters)}`,
      token,
    );
  }

  getTestCase(id: string, testCaseId: string | undefined, token: JWT | null): Promise<TestCase | null> {
    return this.get(TEST_CASE_URL(id, testCaseId), token);
  }

  createTestSuite(suite: TestSuite, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(TEST_SUITES_URL, suite, token);
  }

  removeTestSuite(id: string, token: JWT | null): Promise<ServerActionResponse> {
    return this.deleteAction(TEST_SUITE_URL(id), token);
  }

  updateTestSuite(suite: TestSuite, etag: string, token: JWT | null): Promise<ServerActionResponse> {
    return this.putActionWithEtag(TEST_SUITE_URL(suite.id), suite, token, etag);
  }

  private getFiltersAndSortsStr(sorts: SortDto[], filters: FilterDto[]): string {
    const filtersStr = getRequestFiltersStr(filters);
    const sortsStr = getRequestSortsStr(sorts);
    return `${filtersStr || sortsStr ? '&' : ''}${filtersStr}${sortsStr ? '&' : ''}${sortsStr}`;
  }

  getDeployments(token: JWT | null): Promise<Deployment[] | null> {
    return this.get(DEPLOYMENTS_URL, token);
  }

  getDeployment(id: string, type: string, token: JWT | null): Promise<Deployment | null> {
    return this.get(`${DEPLOYMENTS_URL}/${type}/${id}`, token);
  }
}
