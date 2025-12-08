import { beforeEach, describe, expect, test, vi } from 'vitest';

import { utilityApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { getProperties, updateProperties } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('System properties :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getProperties action', async () => {
    (utilityApi.getSystemProperties as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getProperties('etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.getSystemProperties).toHaveBeenCalledWith(TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateProperties action', async () => {
    (utilityApi.updateSystemProperties as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateProperties({ globalInterceptors: [''] }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(utilityApi.updateSystemProperties).toHaveBeenCalledWith({ globalInterceptors: [''] }, TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });
});
