import { JWT } from 'next-auth/jwt';

import { BaseApi } from '@/src/server/base-api';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { TestCases, TestSuite } from '@/src/models/evaluation/test-suite';
import { EvaluationPageData } from '../../models/request';

export const TEST_SUITES_URL = `${API}/test-suites`;
export const TEST_SUITE_URL = (id?: string) => `${TEST_SUITES_URL}/${id || ''}`;
export const TEST_CASES_URL = (id?: string) => `${TEST_SUITE_URL(id)}/test-cases`;
export const TEST_CASE_URL = (id?: string, testCaseId?: string) => `${TEST_CASES_URL(id)}/${testCaseId || ''}`;

export class TestSuitesApi extends BaseApi {
  getTestSuites(page: number, size: number, token: JWT | null): Promise<EvaluationPageData<TestSuite> | null> {
    return this.get<EvaluationPageData<TestSuite>>(
      `${TEST_SUITES_URL}?page=${page}&size=${size}&includeTotalCount=true`,
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
    token: JWT | null,
  ): Promise<EvaluationPageData<TestCases> | null> {
    return this.get<EvaluationPageData<TestCases>>(
      `${TEST_CASES_URL(id)}?page=${page}&size=${size}&includeTotalCount=true`,
      token,
    );
  }

  getTestCase(id: string, testCaseId: string | undefined, token: JWT | null): Promise<TestCases | null> {
    return this.get(TEST_CASE_URL(id, testCaseId), token);
  }

  createTestSuite(suite: TestSuite, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(TEST_SUITE_URL(suite.id), suite, token);
  }

  removeTestSuite(id: string, token: JWT | null): Promise<ServerActionResponse> {
    return this.deleteAction(TEST_SUITE_URL(id), token);
  }

  updateTestSuite(suite: TestSuite, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(TEST_SUITE_URL(suite.id), suite, token);
  }
}
