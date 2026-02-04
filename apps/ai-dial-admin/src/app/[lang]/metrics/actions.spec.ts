import { beforeEach, describe, expect, test, vi } from 'vitest';

import { metricsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { getMetric, getMetrics } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Metrics :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getMetric action with undefined description', async () => {
    (metricsApi.getMetric as any).mockResolvedValue(RESPONSE_MOCK);
    const result = await getMetric('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(metricsApi.getMetric).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getMetrics action', async () => {
    (metricsApi.getMetrics as any).mockResolvedValue([RESPONSE_MOCK]);
    const result = await getMetrics(1, 10);
    expect(getUserToken).toHaveBeenCalled();
    expect(metricsApi.getMetrics).toHaveBeenCalledWith(1, 10, TOKEN_MOCK);
    expect(result).toEqual([RESPONSE_MOCK]);
  });
});
