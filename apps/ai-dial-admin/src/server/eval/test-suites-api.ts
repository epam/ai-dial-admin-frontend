import { JWT } from 'next-auth/jwt';

import { BaseApi } from '@/src/server/base-api';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { TestSuite } from '@/src/models/evaluation/test-suite';

export const TEST_SUITES_URL = `${API}/test-suites`;
export const TEST_SUITE_URL = (id?: string) => `${TEST_SUITES_URL}/${id || ''}`;

export class TestSuitesApi extends BaseApi {
  getTestSuites(token: JWT | null): Promise<TestSuite[]> {
    return this.get<{ content: TestSuite[] }>(TEST_SUITES_URL, token).then((res) => res?.content || []);
  }

  getTestSuite(id: string, token: JWT | null): Promise<TestSuite | null> {
    return this.get(TEST_SUITE_URL(id), token);
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
