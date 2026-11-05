import { beforeEach, describe, expect, test, vi } from 'vitest';

import { coreUtilityApi } from '@/src/app/api/api';
import { AccessMode, AdminAccess } from '@/src/models/user-access';
import { getUserAccess, isFullAdminCaller } from '@/src/server/user-access';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';

vi.mock('@/src/app/api/api');
vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const answer = (adminAccess: AdminAccess) =>
  vi
    .mocked(coreUtilityApi.getUserRoleAssignments)
    .mockResolvedValue({ success: true, response: { adminAccess, items: [] } });

describe('getUserAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
  });

  test('asks Core with the caller token', async () => {
    answer(AdminAccess.FULL);

    const access = await getUserAccess();

    expect(coreUtilityApi.getUserRoleAssignments).toHaveBeenCalledWith(TOKEN_MOCK);
    expect(access.mode).toBe(AccessMode.FULL);
  });

  test('resolves to full without asking Core when auth is off', async () => {
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(false);

    const access = await getUserAccess();

    expect(access.mode).toBe(AccessMode.FULL);
    expect(coreUtilityApi.getUserRoleAssignments).not.toHaveBeenCalled();
  });

  test('resolves to full when Core answers 404 (org units off)', async () => {
    vi.mocked(coreUtilityApi.getUserRoleAssignments).mockResolvedValue({ success: false, status: 404 });

    expect((await getUserAccess()).mode).toBe(AccessMode.FULL);
  });

  test('resolves to denied when the read throws', async () => {
    vi.mocked(coreUtilityApi.getUserRoleAssignments).mockRejectedValue(new Error('down'));

    expect(await getUserAccess()).toEqual({ mode: AccessMode.DENIED, adminAccess: AdminAccess.NONE, units: [] });
  });
});

describe('isFullAdminCaller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(true);
    vi.mocked(getUserToken).mockResolvedValue(TOKEN_MOCK);
  });

  test('admits adminAccess FULL', async () => {
    answer(AdminAccess.FULL);

    expect(await isFullAdminCaller()).toBe(true);
  });

  test('refuses adminAccess NONE', async () => {
    answer(AdminAccess.NONE);

    expect(await isFullAdminCaller()).toBe(false);
  });

  test('refuses when the read throws', async () => {
    vi.mocked(coreUtilityApi.getUserRoleAssignments).mockRejectedValue(new Error('down'));

    expect(await isFullAdminCaller()).toBe(false);
  });

  test('admits everyone when auth is off', async () => {
    vi.mocked(getIsEnableAuthToggle).mockReturnValue(false);

    expect(await isFullAdminCaller()).toBe(true);
  });
});
