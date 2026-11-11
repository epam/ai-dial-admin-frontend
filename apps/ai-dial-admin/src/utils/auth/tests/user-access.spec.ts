import { describe, expect, test } from 'vitest';

import { CoreUserOrgUnitsResponse } from '@/src/models/dial/core-user-org-units';
import { ServerActionResponse } from '@/src/models/server-action';
import { AccessMode, AdminAccess, UnitAction, UnitNamespace, UserOrgUnit } from '@/src/models/user-access';
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

const MEMBER_UNIT: UserOrgUnit = { ...UNIT, permissions: { [UnitNamespace.ORG_UNITS]: [UnitAction.READ] } };

const VIEWER_UNIT: UserOrgUnit = {
  ...UNIT,
  id: '2',
  name: 'Risk',
  path: 'public/Acme/Risk',
  folder: 'public/Acme/Risk/',
  roles: ['viewer'],
  permissions: { [UnitNamespace.APPLICATIONS]: [UnitAction.READ], [UnitNamespace.ORG_UNITS]: [UnitAction.READ] },
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

  test('NONE with a unit that grants a readable section is unit mode', () => {
    expect(resolveUserAccess(true, ok(AdminAccess.NONE, [VIEWER_UNIT]))).toEqual({
      mode: AccessMode.UNIT,
      adminAccess: AdminAccess.NONE,
      units: [VIEWER_UNIT],
    });
  });

  test('a publications read alone is unit mode', () => {
    const unit = { ...UNIT, permissions: { [UnitNamespace.PUBLICATIONS]: [UnitAction.READ] } };

    expect(resolveUserAccess(true, ok(AdminAccess.NONE, [unit])).mode).toBe(AccessMode.UNIT);
  });

  test('a member-only caller is denied and keeps no units', () => {
    expect(resolveUserAccess(true, ok(AdminAccess.NONE, [MEMBER_UNIT]))).toEqual({
      mode: AccessMode.DENIED,
      adminAccess: AdminAccess.NONE,
      units: [],
    });
  });

  test('a unit with empty permissions, a write-only grant or an unknown namespace is denied', () => {
    const writeOnly = { ...UNIT, permissions: { [UnitNamespace.APPLICATIONS]: [UnitAction.WRITE] } };
    const unknown = { ...UNIT, permissions: { widgets: [UnitAction.READ] } };

    expect(resolveUserAccess(true, ok(AdminAccess.NONE, [UNIT])).mode).toBe(AccessMode.DENIED);
    expect(resolveUserAccess(true, ok(AdminAccess.NONE, [writeOnly])).mode).toBe(AccessMode.DENIED);
    expect(resolveUserAccess(true, ok(AdminAccess.NONE, [unknown])).mode).toBe(AccessMode.DENIED);
  });

  test('a member above a unit with content is unit mode and keeps both units', () => {
    const access = resolveUserAccess(true, ok(AdminAccess.NONE, [MEMBER_UNIT, VIEWER_UNIT]));

    expect(access.mode).toBe(AccessMode.UNIT);
    expect(access.units).toEqual([MEMBER_UNIT, VIEWER_UNIT]);
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
