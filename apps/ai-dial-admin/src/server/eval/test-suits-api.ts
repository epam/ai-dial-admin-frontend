import { JWT } from 'next-auth/jwt';

import { BaseApi } from '@/src/server/base-api';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '@/src/server/api';
import { TestSuits } from '@/src/models/evaluation/test-suit';

export const TEST_SUITS_URL = `${API}/test-suites`;
export const TEST_SUIT_URL = (id: string) => `${TEST_SUITS_URL}/${id}`;

export class TestSuitsApi extends BaseApi {
  getTestSuits(token: JWT | null): Promise<TestSuits[] | null> {
    return this.get<TestSuits[]>(TEST_SUITS_URL, token);
  }

  getTestSuit(id: string, token: JWT | null): Promise<ServerActionResponse> {
    return this.getAction(TEST_SUIT_URL(id), token);
  }

  createTestSuit(suit: TestSuits, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(TEST_SUIT_URL(suit.id), suit, token);
  }

  removeTestSuit(id: string, token: JWT | null): Promise<ServerActionResponse> {
    return this.deleteAction(TEST_SUIT_URL(id), token);
  }

  updateTestSuit(suit: TestSuits, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(TEST_SUIT_URL(suit.id), suit, token);
  }
}
