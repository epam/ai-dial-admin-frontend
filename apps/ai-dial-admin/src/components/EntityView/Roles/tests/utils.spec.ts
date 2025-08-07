import { describe, expect, test } from 'vitest';
import { getRolesGridData, isResetAvailable, isDisableRole } from '@/src/components/EntityView/Roles/utils';

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
  test('Should return role for isPublic true', () => {
    const res = getRolesGridData(
      {
        isPublic: true,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: {
          limit: { day: '1', minute: '1' },
          limit1: { day: '1', minute: '1' },
          limit2: { day: null, minute: null },
        },
      },
      [{ name: 'limit' }, { name: 'limit2' }, {}],
    );
    expect(res).toEqual([
      { name: 'limit', day: '1', minute: '1' },
      { name: 'limit2', day: null, minute: null },
      { day: '2', minute: '2' },
    ]);
  });

  test('Should return role for isPublic false', () => {
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

  test('Should return empty array for isPublic false', () => {
    const res = getRolesGridData(
      {
        isPublic: false,
        defaultRoleLimit: { day: '2', minute: '2' },
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([]);
  });
});
