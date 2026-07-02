import { beforeEach, describe, expect, test, vi } from 'vitest';

import { structuredQueryApi } from '@/src/app/api/api';
import { QueryMode, StructuredQuery } from '@/src/models/evaluation/structured-query';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { executeStructuredQuery } from '../actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Runs server actions', () => {
  const QUERY_MOCK: StructuredQuery = { entity: 'runs', mode: QueryMode.Row };

  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call structuredQueryApi.execute with the query and token', async () => {
    (structuredQueryApi.execute as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await executeStructuredQuery(QUERY_MOCK);

    expect(getUserToken).toHaveBeenCalled();
    expect(structuredQueryApi.execute).toHaveBeenCalledWith(QUERY_MOCK, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should propagate a null response from the API', async () => {
    (structuredQueryApi.execute as any).mockResolvedValue(null);

    const result = await executeStructuredQuery(QUERY_MOCK);

    expect(result).toBe(null);
  });
});
