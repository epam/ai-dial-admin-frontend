import { beforeEach, describe, expect, test, vi } from 'vitest';

import { analyticsDataApi } from '@/src/app/api/api';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/app/api/api');
vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const checkAccess = () => analyticsDataApi.checkAccess as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  (getIsEnableAuthToggle as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  (getUserToken as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(TOKEN_MOCK);
});

describe('isAnalyticsForbidden', () => {
  test('reports forbidden when access is refused with 403', async () => {
    checkAccess().mockResolvedValue({ success: false, status: 403 });

    await expect(isAnalyticsForbidden()).resolves.toBe(true);
  });

  test('reports allowed when access succeeds', async () => {
    checkAccess().mockResolvedValue({ success: true, status: 200 });

    await expect(isAnalyticsForbidden()).resolves.toBe(false);
  });

  test('a non-403 failure is not treated as forbidden', async () => {
    checkAccess().mockResolvedValue({ success: false, status: 500 });

    await expect(isAnalyticsForbidden()).resolves.toBe(false);
  });

  // Callers await this gate before their own try/catch, so a rejection escapes the page and takes down the
  // application shell rather than rendering that page's load-error state.
  test('an unreachable service resolves instead of rejecting', async () => {
    checkAccess().mockRejectedValue(new TypeError('fetch failed'));

    await expect(isAnalyticsForbidden()).resolves.toBe(false);
  });

  test('passes the user token to the access check', async () => {
    checkAccess().mockResolvedValue({ success: true, status: 200 });

    await isAnalyticsForbidden();

    expect(checkAccess()).toHaveBeenCalledWith(TOKEN_MOCK);
  });
});
