import { beforeEach, describe, expect, test, vi } from 'vitest';

import { runsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { getRun, getRuns, removeRun } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

const mockPageData = {
  page: 0,
  size: 10,
  totalElements: 1,
  totalPages: 1,
  content: [{ id: 'run-1' }],
};

describe('Runs :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getRuns action and return page data', async () => {
    (runsApi.getRuns as any).mockResolvedValue(mockPageData);

    const result = await getRuns(1, 10);

    expect(getUserToken).toHaveBeenCalled();
    expect(runsApi.getRuns).toHaveBeenCalledWith(1, 10, TOKEN_MOCK);
    expect(result).toEqual(mockPageData);
  });

  test('Should call getRun action and return run', async () => {
    (runsApi.getRun as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getRun('run-id');

    expect(getUserToken).toHaveBeenCalled();
    expect(runsApi.getRun).toHaveBeenCalledWith('run-id', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call removeRun action and return server action response', async () => {
    (runsApi.removeRun as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeRun('run-id');

    expect(getUserToken).toHaveBeenCalled();
    expect(runsApi.removeRun).toHaveBeenCalledWith('run-id', TOKEN_MOCK);
    expect(result).toEqual(RESPONSE_MOCK);
  });
});
