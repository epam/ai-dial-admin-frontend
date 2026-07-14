import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { executeQuery, getEntities, getEntitySchema } from '../actions';

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
});
