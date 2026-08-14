import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi, queryAssistantApi } from '@/src/app/api/api';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { QueryAssistantRole } from '@/src/models/analytics/query-assistant';
import { QueryResultView } from '@/src/models/analytics/query-builder';
import { SavedQueryRequest, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createSavedQuery,
  deleteSavedQuery,
  executeQuery,
  generateQuery,
  getEntities,
  getEntitySchema,
  getFunctions,
  getSavedQuery,
  listSavedQueries,
  translateQuery,
  translateSqlToQuery,
  updateSavedQuery,
} from '../actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Queries server actions', () => {
  const request: SavedQueryRequest = {
    name: 'Top chats',
    scope: SavedQueryScope.Personal,
    result_view: QueryResultView.Table,
    query: { entity: 'dial_usage_log', mode: QueryMode.Row },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('listSavedQueries passes the scope + token to the client', async () => {
    (analyticsDataApi.listSavedQueries as any).mockResolvedValue([]);

    await listSavedQueries(SavedQueryScope.Common);

    expect(getUserToken).toHaveBeenCalled();
    expect(analyticsDataApi.listSavedQueries).toHaveBeenCalledWith(SavedQueryScope.Common, TOKEN_MOCK);
  });

  test('getSavedQuery passes the id + token', async () => {
    (analyticsDataApi.getSavedQuery as any).mockResolvedValue(null);

    await getSavedQuery('sq_1');

    expect(analyticsDataApi.getSavedQuery).toHaveBeenCalledWith('sq_1', TOKEN_MOCK);
  });

  test('createSavedQuery passes the payload + token', async () => {
    (analyticsDataApi.createSavedQuery as any).mockResolvedValue({ success: true });

    await createSavedQuery(request);

    expect(analyticsDataApi.createSavedQuery).toHaveBeenCalledWith(request, TOKEN_MOCK);
  });

  test('updateSavedQuery passes the id, payload + token', async () => {
    (analyticsDataApi.updateSavedQuery as any).mockResolvedValue({ success: true });

    await updateSavedQuery('sq_1', request);

    expect(analyticsDataApi.updateSavedQuery).toHaveBeenCalledWith('sq_1', request, TOKEN_MOCK);
  });

  test('deleteSavedQuery passes the id + token', async () => {
    (analyticsDataApi.deleteSavedQuery as any).mockResolvedValue({ success: true });

    await deleteSavedQuery('sq_1');

    expect(analyticsDataApi.deleteSavedQuery).toHaveBeenCalledWith('sq_1', TOKEN_MOCK);
  });

  test('an action returns the client response unchanged', async () => {
    const failure = { success: false, errorHeader: 'validation_error', errorMessage: 'blank name' };
    (analyticsDataApi.createSavedQuery as any).mockResolvedValue(failure);

    const res = await createSavedQuery(request);

    expect(res).toEqual(failure);
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

  test('getFunctions passes the token to the client', async () => {
    (analyticsDataApi.getFunctions as any).mockResolvedValue([]);

    await getFunctions();

    expect(analyticsDataApi.getFunctions).toHaveBeenCalledWith(TOKEN_MOCK);
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
