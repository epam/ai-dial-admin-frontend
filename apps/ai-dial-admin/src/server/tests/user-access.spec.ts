import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { getUserInfo } from '@/src/app/api/api';
import { UserRole } from '@/src/models/user-info';
import { isFullAdminCaller } from '@/src/server/user-access';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/app/api/api');
vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const withRoles = (roles: UserRole[]) =>
  vi
    .mocked(getUserInfo)
    .mockResolvedValue({ success: true, response: { userInfo: { id: 'u1', email: 'admin@example.com', roles } } });

describe('isFullAdminCaller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('DIAL_ADMIN_API_URL', 'http://admin');
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('reads the roles and admits a FULL_ADMIN', async () => {
    withRoles([UserRole.FULL_ADMIN]);

    expect(await isFullAdminCaller()).toBe(true);
    expect(getUserInfo).toHaveBeenCalledWith(TOKEN_MOCK);
  });

  test('refuses a READ_ONLY_ADMIN', async () => {
    withRoles([UserRole.READ_ONLY_ADMIN]);

    expect(await isFullAdminCaller()).toBe(false);
  });

  test('admits everyone without reading roles when auth is off', async () => {
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(false);

    expect(await isFullAdminCaller()).toBe(true);
    expect(getUserInfo).not.toHaveBeenCalled();
  });

  test('refuses when the identity read throws', async () => {
    vi.mocked(getUserInfo).mockRejectedValue(new Error('down'));

    expect(await isFullAdminCaller()).toBe(false);
  });
});
