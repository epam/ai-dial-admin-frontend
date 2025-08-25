import { getRolesGridData, isDisableRole, isResetAvailable } from '@/src/components/EntityView/Roles/utils';
import { describe, expect, test } from 'vitest';

describe('Roles View :: isResetAvailable', () => {
  test('Should return true', () => {
    const res = isResetAvailable({
      defaultRoleLimit: { day: '2', minute: '2' },
      roleLimits: { limit: { day: '1', minute: '1' } },
    });
    expect(res).toBeTruthy();
  });

  test('Should return true', () => {
    const res = isResetAvailable({
      defaultRoleLimit: { day: '1', minute: '2' },
      roleLimits: { limit: { day: '1', minute: '1' } },
    });
    expect(res).toBeTruthy();
  });
});

describe('Roles View :: isDisableRole', () => {
  test('returns true if roleLimits is empty object and isPublic is falsy', () => {
    const entity = { roleLimits: {}, isPublic: false };
    expect(isDisableRole(entity)).toBe(true);
  });

  test('returns true if roleLimits is undefined and isPublic is falsy', () => {
    const entity = { isPublic: false };
    expect(isDisableRole(entity)).toBe(true);
  });

  test('returns false if roleLimits is not empty and isPublic is falsy', () => {
    const entity = { roleLimits: { admin: { minute: 1 } }, isPublic: false };
    expect(isDisableRole(entity)).toBe(false);
  });

  test('returns false if isPublic is true, even if roleLimits is empty', () => {
    const entity = { roleLimits: {}, isPublic: true };
    expect(isDisableRole(entity)).toBe(false);
  });

  test('returns false if isPublic is true and roleLimits is not empty', () => {
    const entity = { roleLimits: { admin: { minute: 1 } }, isPublic: true };
    expect(isDisableRole(entity)).toBe(false);
  });
});

describe('Roles View :: getRolesGridData', () => {
  test('Should return role for isPublic true with limits and shares', () => {
    const res = getRolesGridData(
      {
        isPublic: true,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: {
          limit: { day: '1', minute: '1' },
          limit2: { day: null, minute: null },
        },
        roleShareResourceLimits: {
          limit: { invitationTtl: '3600', maxAcceptedUsers: '10' },
          limit2: { invitationTtl: null, maxAcceptedUsers: null },
        },
      },
      [{ name: 'limit' }, { name: 'limit2' }],
    );
    expect(res).toEqual([
      { name: 'limit', day: '1', minute: '1', invitationTtl: '3600', maxAcceptedUsers: '10' },
      { name: 'limit2', day: null, minute: null, invitationTtl: null, maxAcceptedUsers: null },
    ]);
  });

  test('Should return role for isPublic false with limits and shares', () => {
    const res = getRolesGridData(
      {
        isPublic: false,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: { limit: { day: '1', minute: '1' } },
        roleShareResourceLimits: { limit: { invitationTtl: '3600', maxAcceptedUsers: '10' } },
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([
      {
        name: 'limit',
        day: '1',
        minute: '1',
        invitationTtl: '3600',
        maxAcceptedUsers: '10',
      },
    ]);
  });

  test('Should return empty array for isPublic false with no roleLimits or share limits', () => {
    const res = getRolesGridData(
      {
        isPublic: false,
        defaultRoleLimit: { day: '2', minute: '2' },
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([]);
  });

  test('Should return roles for isPublic false with only roleLimits and defaultRoleLimit', () => {
    const res = getRolesGridData(
      {
        isPublic: false,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: { limit: { day: '1', minute: '1' } },
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([{ name: 'limit', day: '1', minute: '1' }]);
  });

  test('Should return roles for isPublic true with only default limits', () => {
    const res = getRolesGridData(
      {
        isPublic: true,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: {},
        roleShareResourceLimits: {},
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([{ name: 'limit', day: '2', minute: '2' }]);
  });

  test('Should return roles for isPublic true with missing limits but share data available', () => {
    const res = getRolesGridData(
      {
        isPublic: true,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: {},
        roleShareResourceLimits: {
          limit: { invitationTtl: '3600', maxAcceptedUsers: '10' },
        },
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([{ name: 'limit', day: '2', minute: '2', invitationTtl: '3600', maxAcceptedUsers: '10' }]);
  });

  test('Should handle missing roleShareResourceLimits gracefully when isPublic true', () => {
    const res = getRolesGridData(
      {
        isPublic: true,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: { limit: { day: '1', minute: '1' } },
        roleShareResourceLimits: {},
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([
      {
        invitationTtl: undefined,
        maxAcceptedUsers: undefined,
        month: undefined,
        week: undefined,
        day: '1',
        minute: '1',
        name: 'limit',
      },
    ]);
  });

  test('Should handle missing roleLimits gracefully when isPublic false', () => {
    const res = getRolesGridData(
      {
        isPublic: false,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: {},
        roleShareResourceLimits: { limit: { invitationTtl: '3600', maxAcceptedUsers: '10' } },
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([]);
  });

  test('Should return default value when role limit is null and defaultRoleLimit is provided', () => {
    const res = getRolesGridData(
      {
        isPublic: true,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: { limit: { day: null, minute: null } },
        roleShareResourceLimits: {},
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([
      {
        day: null,
        invitationTtl: undefined,
        maxAcceptedUsers: undefined,
        minute: null,
        month: undefined,
        name: 'limit',
        week: undefined,
      },
    ]);
  });

  test('Should return null for missing share data when isPublic true', () => {
    const res = getRolesGridData(
      {
        isPublic: true,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: { limit: { day: '1', minute: '1' } },
        roleShareResourceLimits: {},
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([
      {
        day: '1',
        invitationTtl: undefined,
        maxAcceptedUsers: undefined,
        minute: '1',
        month: undefined,
        name: 'limit',
        week: undefined,
      },
    ]);
  });
});
