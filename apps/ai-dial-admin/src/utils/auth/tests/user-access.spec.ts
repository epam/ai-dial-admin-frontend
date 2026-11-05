import { describe, expect, test } from 'vitest';

import { CoreUserOrgUnitsResponse } from '@/src/models/dial/core-user-org-units';
import { ServerActionResponse } from '@/src/models/server-action';
import { AccessMode, AdminAccess, UserOrgUnit } from '@/src/models/user-access';
import { resolveUserAccess } from '@/src/utils/auth/user-access';

const UNIT: UserOrgUnit = {
  id: '1',
  name: 'Acme',
  displayName: 'Acme',
  path: 'public/Acme',
  folder: 'public/Acme/',
  roles: ['member'],
  permissions: {},
};

const ok = (adminAccess: AdminAccess, items?: UserOrgUnit[]): ServerActionResponse<CoreUserOrgUnitsResponse> => ({
  success: true,
  response: { adminAccess, items },
});

describe('resolveUserAccess', () => {
  test('auth off is a full admin, whatever the result', () => {
    expect(resolveUserAccess(false)).toEqual({ mode: AccessMode.FULL, adminAccess: AdminAccess.FULL, units: [] });
    expect(resolveUserAccess(false, ok(AdminAccess.NONE)).mode).toBe(AccessMode.FULL);
  });

  test('404 (org units off) is a full admin', () => {
    const access = resolveUserAccess(true, { success: false, status: 404 });

    expect(access).toEqual({ mode: AccessMode.FULL, adminAccess: AdminAccess.FULL, units: [] });
  });

  test('adminAccess FULL is full and keeps the units', () => {
    expect(resolveUserAccess(true, ok(AdminAccess.FULL, [UNIT]))).toEqual({
      mode: AccessMode.FULL,
      adminAccess: AdminAccess.FULL,
      units: [UNIT],
    });
  });

  test('READ_ONLY opens the full panel without being a full admin', () => {
    const access = resolveUserAccess(true, ok(AdminAccess.READ_ONLY));

    expect(access.mode).toBe(AccessMode.FULL);
    expect(access.adminAccess).toBe(AdminAccess.READ_ONLY);
  });

  test('NONE with a unit is unit mode', () => {
    expect(resolveUserAccess(true, ok(AdminAccess.NONE, [UNIT]))).toEqual({
      mode: AccessMode.UNIT,
      adminAccess: AdminAccess.NONE,
      units: [UNIT],
    });
  });

  test('NONE with no units, or no items field, is denied', () => {
    expect(resolveUserAccess(true, ok(AdminAccess.NONE, [])).mode).toBe(AccessMode.DENIED);
    expect(resolveUserAccess(true, ok(AdminAccess.NONE)).mode).toBe(AccessMode.DENIED);
  });

  test.each([401, 403, 500])('a %i failure is denied', (status) => {
    expect(resolveUserAccess(true, { success: false, status })).toEqual({
      mode: AccessMode.DENIED,
      adminAccess: AdminAccess.NONE,
      units: [],
    });
  });

  test('a missing result is denied when auth is on', () => {
    expect(resolveUserAccess(true).mode).toBe(AccessMode.DENIED);
  });

  test('a successful answer with no body is denied', () => {
    expect(resolveUserAccess(true, { success: true }).mode).toBe(AccessMode.DENIED);
  });
});
