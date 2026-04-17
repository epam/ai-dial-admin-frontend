import { beforeEach, describe, expect, test, vi } from 'vitest';

import { telemetryApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { getDashboardData } from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Export config :: actions :: getDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getDashboardData action', async () => {
    (telemetryApi.getDashboardData as any).mockResolvedValue(RESPONSE_MOCK);

    const query = { $type: 'type', query: { expressions: ['aaa'], from: '2024-01-01' } };
    const result = await getDashboardData(query);

    expect(telemetryApi.getDashboardData).toHaveBeenCalledWith(query, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });
});
