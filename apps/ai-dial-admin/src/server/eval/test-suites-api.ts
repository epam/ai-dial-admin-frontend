import { JWT } from 'next-auth/jwt';

import { BaseApi } from '@/src/server/base-api';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { TestCase, TestSuite } from '@/src/models/evaluation/test-suite';
import { EvaluationPageData, FilterDto, SortDto } from '@/src/models/request';
import { getRequestSortsStr } from '@/src/utils/request/get-request-sorts';
import { getRequestFiltersStr } from '../../utils/request/get-request-filters';

export const TEST_SUITES_URL = `${API}/test-suites`;
export const TEST_SUITE_URL = (id?: string) => `${TEST_SUITES_URL}/${id || ''}`;
export const TEST_CASES_URL = (id?: string) => `${TEST_SUITE_URL(id)}/test-cases`;
export const TEST_CASE_URL = (id?: string, testCaseId?: string) => `${TEST_CASES_URL(id)}/${testCaseId || ''}`;

export class TestSuitesApi extends BaseApi {
  getTestSuites(
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: JWT | null,
  ): Promise<EvaluationPageData<TestSuite> | null> {
    const filtersStr = getRequestFiltersStr(filters);
    const sortsStr = getRequestSortsStr(sorts);
    const str = `&${filtersStr}${sortsStr ? '&' : ''}${sortsStr}`;

    return this.get<EvaluationPageData<TestSuite>>(
      `${TEST_SUITES_URL}?page=${page}&size=${size}&includeTotalCount=true${str}`,
      token,
    );
  }

  getTestSuite(id: string, token: JWT | null): Promise<TestSuite | null> {
    return this.get(TEST_SUITE_URL(id), token);
  }

  getTestCases(
    id: string,
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
    token: JWT | null,
  ): Promise<EvaluationPageData<TestCase> | null> {
    const filtersStr = getRequestFiltersStr(filters);
    const sortsStr = getRequestSortsStr(sorts);
    const str = `&${filtersStr}${sortsStr ? '&' : ''}${sortsStr}`;

    return this.get<EvaluationPageData<TestCase>>(
      `${TEST_CASES_URL(id)}?page=${page}&size=${size}&includeTotalCount=true${str}`,
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

  updateTestSuite(suite: TestSuite, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(TEST_SUITE_URL(suite.id), suite, token);
  }
}
