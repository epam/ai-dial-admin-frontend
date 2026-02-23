import { beforeEach, describe, expect, test, vi } from 'vitest';

import { runsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { getRun, getRuns } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Runs :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getRuns action', async () => {
    (runsApi.getRuns as any).mockResolvedValue([RESPONSE_MOCK]);

    const result = await getRuns(1, 10);

    expect(getUserToken).toHaveBeenCalled();
    expect(runsApi.getRuns).toHaveBeenCalledWith(1, 10, TOKEN_MOCK);
    expect(result).toEqual([RESPONSE_MOCK]);
  });

  test('Should call getRun action', async () => {
    (runsApi.getRun as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRun('run-id');

    expect(getUserToken).toHaveBeenCalled();
    expect(runsApi.getRun).toHaveBeenCalledWith('run-id', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
