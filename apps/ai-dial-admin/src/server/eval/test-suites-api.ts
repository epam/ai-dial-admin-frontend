import { Token } from '@/src/models/auth';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TemplateVariable, TestCase, TestSuite, TryOutResponse } from '@/src/models/evaluation/test-suite';
import { EvaluationPageData, FilterDto, SortDto } from '@/src/models/request';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { BaseApi } from '@/src/server/base-api';
import { getAuthorizationHeader } from '@/src/utils/auth/api-headers';
import { getRequestFiltersStr } from '@/src/utils/request/get-request-filters';
import { getRequestSortsStr } from '@/src/utils/request/get-request-sorts';
import { Run } from '@/src/models/evaluation/run';
import { TestCaseConflictStrategy, TestCaseImportMode } from '../../types/evaluation';

export const TEST_SUITES_URL = `${API}/test-suites`;
export const TEST_SUITE_URL = (id?: string) => `${TEST_SUITES_URL}/${id || ''}`;
export const TEST_CASES_URL = (id?: string) => `${TEST_SUITE_URL(id)}/test-cases`;
export const TEST_SUITE_RUN_URL = (id?: string) => `${TEST_SUITE_URL(id)}/runs`;
export const TEST_CASE_URL = (id?: string, testCaseId?: string) => `${TEST_CASES_URL(id)}/${testCaseId || ''}`;
export const DEPLOYMENTS_URL = `${API}/deployments`;
export const TEST_SUITES_RUNS_URL = `${API}/test-suite-runs`;
export const TEST_SUITE_TEMPLATE_VARIABLES_URL = (id: string) => `${TEST_SUITE_URL(id)}/template-variables`;
export const TEST_CASE_TEMPLATE_VARIABLES_URL = (id: string, testCaseId: string) =>
  `${TEST_CASES_URL(id)}/${testCaseId}/template-variables`;
export const TEST_SUITE_TRY_OUT_URL = (id: string) => `${TEST_SUITE_URL(id)}/try-it-out`;
export const TEST_CASE_TRY_OUT_URL = (id: string, testCaseId: string) => `${TEST_CASE_URL(id, testCaseId)}/try-it-out`;

export class TestSuitesApi extends BaseApi {
  getTestSuites(
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: Token,
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
    token: Token,
  ): Promise<EvaluationPageData<Run> | null> {
    return this.get<EvaluationPageData<Run>>(
      `${TEST_SUITES_RUNS_URL}?page=${page}&size=${size}&includeTotalCount=true${this.getFiltersAndSortsStr(sorts, filters)}`,
      token,
    );
  }

  getTestSuite(id: string, etag: string, token: Token): Promise<ServerActionResponse<TestSuite> | null> {
    return this.getActionWithEtag(TEST_SUITE_URL(id), etag, token);
  }

  importTestCase(
    id: string,
    file: FormData,
    token: Token,
    mode: TestCaseImportMode,
    strategy: TestCaseConflictStrategy,
  ): Promise<ServerActionResponse> {
    return this.postFiles(`${TEST_CASES_URL(id)}/import?importMode=${mode}&conflictStrategy=${strategy}`, file, token);
  }

  importTestCasePreview(id: string, file: FormData, token: Token): Promise<ServerActionResponse> {
    return this.postFiles(`${TEST_CASES_URL(id)}/import/preview`, file, token);
  }

  getTestCases(
    id: string | undefined,
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: Token,
  ): Promise<EvaluationPageData<TestCase> | null> {
    return this.get<EvaluationPageData<TestCase>>(
      `${TEST_CASES_URL(id)}?page=${page}&size=${size}&includeTotalCount=true&includeWarnings=true${this.getFiltersAndSortsStr(sorts, filters)}`,
      token,
    );
  }

  getTestCase(id: string, testCaseId: string | undefined, token: Token): Promise<TestCase | null> {
    return this.get(TEST_CASE_URL(id, testCaseId), token);
  }

  removeTestCase(id: string, testCaseId: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(TEST_CASE_URL(id, testCaseId), token);
  }

  createTestCase(
    testSuiteId: string,
    body: Pick<TestCase, 'testCaseName' | 'data'>,
    token: Token,
    includeWarnings = false,
  ): Promise<ServerActionResponse> {
    const url = `${TEST_CASES_URL(testSuiteId)}${includeWarnings ? '?includeWarnings=true' : ''}`;
    return this.postAction<Pick<TestCase, 'testCaseName' | 'data'>>(url, body, token);
  }

  updateTestCases(id: string, testCases: TestCase[], token: Token): Promise<ServerActionResponse> {
    return this.putAction(TEST_CASES_URL(id), testCases, token);
  }

  exportTestCasesCsv(testSuiteId: string, token: Token) {
    const filename = `test_suite_${testSuiteId}_export.csv`;
    return this.streamRequest(`${TEST_CASES_URL(testSuiteId)}/export.csv`, filename, token);
  }

  createTestSuite(suite: TestSuite, token: Token): Promise<ServerActionResponse> {
    return this.postAction(TEST_SUITES_URL, suite, token);
  }

  removeTestSuite(id: string, token: Token): Promise<ServerActionResponse> {
    return this.deleteAction(TEST_SUITE_URL(id), token);
  }

  updateTestSuite(suite: TestSuite, etag: string, token: Token): Promise<ServerActionResponse> {
    return this.putActionWithEtag(TEST_SUITE_URL(suite.id), suite, token, etag);
  }

  runTestSuite(token: Token, id?: string, numberOfRuns?: number | string): Promise<ServerActionResponse> {
    return this.postAction(TEST_SUITE_RUN_URL(id), { runConfig: { numberOfRuns } }, token);
  }

  private getFiltersAndSortsStr(sorts: SortDto[], filters: FilterDto[]): string {
    const filtersStr = getRequestFiltersStr(filters);
    const sortsStr = getRequestSortsStr(sorts);

    return `${filtersStr || sortsStr ? '&' : ''}${filtersStr}${sortsStr ? '&' : ''}${sortsStr}`;
  }

  getDeployments(token: Token): Promise<ServerActionResponse<Deployment[]> | null> {
    return this.getAction(DEPLOYMENTS_URL, token);
  }

  getDeployment(id: string, type: string, token: Token): Promise<Deployment | null> {
    return this.get(`${DEPLOYMENTS_URL}/${type}/${id}`, token);
  }

  getTestSuiteTemplateVariables(id: string, token: Token): Promise<TemplateVariable[] | null> {
    return this.get(TEST_SUITE_TEMPLATE_VARIABLES_URL(id), token);
  }

  getTestCaseTemplateVariables(id: string, testCaseId: string, token: Token): Promise<TemplateVariable[] | null> {
    return this.get(TEST_CASE_TEMPLATE_VARIABLES_URL(id, testCaseId), token);
  }

  tryOutTestSuite(
    id: string,
    requestBody: Record<string, unknown>,
    token: Token,
  ): Promise<ServerActionResponse<TryOutResponse> | null> {
    return this.postAction(TEST_SUITE_TRY_OUT_URL(id), { variables: requestBody }, token);
  }

  tryOutTestCase(id: string, testCaseId: string, token: Token): Promise<ServerActionResponse<TryOutResponse> | null> {
    return this.postAction(TEST_CASE_TRY_OUT_URL(id, testCaseId), {}, token);
  }
}
