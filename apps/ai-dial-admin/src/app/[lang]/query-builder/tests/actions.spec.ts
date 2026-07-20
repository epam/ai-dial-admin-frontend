import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi, queryAssistantApi } from '@/src/app/api/api';
import { QueryAssistantRole } from '@/src/models/analytics/query-assistant';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  executeQuery,
  generateQuery,
  getEntities,
  getEntitySchema,
  translateQuery,
  translateSqlToQuery,
} from '../actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Query builder server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('getEntities passes the token to the client', async () => {
    (analyticsDataApi.getEntities as any).mockResolvedValue([]);

    await getEntities();

    expect(getUserToken).toHaveBeenCalled();
    expect(analyticsDataApi.getEntities).toHaveBeenCalledWith(TOKEN_MOCK);
  });

  test('getEntitySchema passes name + token', async () => {
    (analyticsDataApi.getEntitySchema as any).mockResolvedValue(null);

    await getEntitySchema('conversation');

    expect(analyticsDataApi.getEntitySchema).toHaveBeenCalledWith('conversation', TOKEN_MOCK);
  });

  test('executeQuery passes the query + token', async () => {
    const query: StructuredQuery = { entity: 'conversation', mode: QueryMode.Row };
    (analyticsDataApi.executeAction as any).mockResolvedValue({ success: true });

    await executeQuery(query);

    expect(analyticsDataApi.executeAction).toHaveBeenCalledWith(query, TOKEN_MOCK);
  });

  test('translateQuery passes the query + token', async () => {
    const query: StructuredQuery = { entity: 'conversation', mode: QueryMode.Row };
    (analyticsDataApi.translateAction as any).mockResolvedValue({ success: true });

    await translateQuery(query);

    expect(analyticsDataApi.translateAction).toHaveBeenCalledWith(query, TOKEN_MOCK);
  });

  test('translateSqlToQuery passes the sql + token', async () => {
    (analyticsDataApi.translateSqlAction as any).mockResolvedValue({ success: true });

    await translateSqlToQuery('SELECT id FROM conversation');

    expect(analyticsDataApi.translateSqlAction).toHaveBeenCalledWith('SELECT id FROM conversation', TOKEN_MOCK);
  });

  describe('generateQuery', () => {
    const messages = [{ role: QueryAssistantRole.User, content: 'total cost by deployment' }];

    test('passes messages, the configured deployment, and the token', async () => {
      process.env.DIAL_QUERY_ASSISTANT_DEPLOYMENT = 'applications/public/query-helper__0.0.1';
      (queryAssistantApi.chatCompletion as any).mockResolvedValue({ success: true });

      await generateQuery(messages);

      expect(queryAssistantApi.chatCompletion).toHaveBeenCalledWith(
        messages,
        'applications/public/query-helper__0.0.1',
        TOKEN_MOCK,
      );
    });

    test('returns a failure without calling the client when no deployment is configured', async () => {
      delete process.env.DIAL_QUERY_ASSISTANT_DEPLOYMENT;

      const res = await generateQuery(messages);

      expect(res.success).toBe(false);
      expect(queryAssistantApi.chatCompletion).not.toHaveBeenCalled();
    });
  });
});
