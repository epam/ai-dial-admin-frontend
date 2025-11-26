import { beforeEach, describe, expect, test, vi } from 'vitest';

import { adaptersApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { createAdapter, removeAdapter, updateAdapter } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Adapters :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call removeAdapter action', async () => {
    (adaptersApi.removeAdapter as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeAdapter('adapter');
    expect(getUserToken).toHaveBeenCalled();
    expect(adaptersApi.removeAdapter).toHaveBeenCalledWith(TOKEN_MOCK, 'adapter');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createAdapter action', async () => {
    (adaptersApi.createAdapter as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createAdapter({ name: 'adapter' });
    expect(getUserToken).toHaveBeenCalled();
    expect(adaptersApi.createAdapter).toHaveBeenCalledWith({ name: 'adapter' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateAdapter action', async () => {
    (adaptersApi.updateAdapter as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateAdapter({ name: 'adapter' }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(adaptersApi.updateAdapter).toHaveBeenCalledWith({ name: 'adapter' }, TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });
});
