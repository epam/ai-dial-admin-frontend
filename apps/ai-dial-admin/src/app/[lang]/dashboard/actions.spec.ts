import { getDashboardData } from './actions';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { telemetryApi } from '@/src/app/api/api';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

jest.mock('@/src/utils/auth/auth-request');
jest.mock('@/src/utils/env/get-auth-toggle');
jest.mock('@/src/app/api/api');

describe('Export config :: actions :: getDashboardData', () => {
  const mockQuery = { from: '2024-01-01', to: '2024-01-31' };
  const mockDashboardData = { totalUsers: 100 };

  beforeEach(() => {
    jest.clearAllMocks();
    (getUserToken as jest.Mock).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as jest.Mock).mockReturnValue(true);
    (telemetryApi.getDashboardData as jest.Mock).mockResolvedValue(mockDashboardData);
  });

  it('should call getUserToken and fetch dashboard data', async () => {
    const result = await getDashboardData(mockQuery);

    expect(telemetryApi.getDashboardData).toHaveBeenCalledWith(mockQuery, TOKEN_MOCK);
    expect(result).toBe(mockDashboardData);
  });
});
