import {
  getRolesGridData,
  isDisableRole,
  getNoAvailableTitle,
  isResetAvailable,
  isLimitSameAsDefault,
  integerValueFormatter,
  isSetNoLimitsHidden,
  isResetToDefaultHidden,
} from '@/src/components/EntityView/Roles/utils';
import { ApplicationRoute } from '@/src/types/routes';
import { MenuI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { describe, expect, test, vi } from 'vitest';
import { GridApi, IRowNode } from 'ag-grid-community';
import { UNLIMITED_VALUE } from '@/src/constants/role';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';

describe('getNoAvailableTitle', () => {
  test('returns NotAvailableModel for Models view', () => {
    expect(getNoAvailableTitle(ApplicationRoute.Models)).toBe(RolesI18nKey.NotAvailableModel);
  });

  test('returns NotAvailableApplication for Applications view', () => {
    expect(getNoAvailableTitle(ApplicationRoute.Applications)).toBe(RolesI18nKey.NotAvailableApplication);
  });

  test('returns NotAvailableApplication for Toolsets view', () => {
    expect(getNoAvailableTitle(ApplicationRoute.Toolsets)).toBe(RolesI18nKey.NotAvailableToolSet);
  });
});

describe('isLimitSameAsDefault', () => {
  const defaultLimit = {
    enabled: true,
    day: '1',
    minute: '2',
  };

  test('returns true when limit is exact subset with same values', () => {
    const limit = { enabled: true, day: '1' };

    expect(isLimitSameAsDefault(limit, defaultLimit)).toBe(true);
  });

  test('returns true when limit matches default exactly', () => {
    const limit = { enabled: true, day: '1', minute: '2' };

    expect(isLimitSameAsDefault(limit, defaultLimit)).toBe(true);
  });

  test('returns false when value differs', () => {
    const limit = { enabled: true, day: '2' };

    expect(isLimitSameAsDefault(limit, defaultLimit)).toBe(false);
  });

  test('returns false when enabled differs', () => {
    const limit = { enabled: false };

    expect(isLimitSameAsDefault(limit, defaultLimit)).toBe(false);
  });

  test('returns false when extra key exists', () => {
    const limit = { enabled: true, day: '1', week: '3' };

    expect(isLimitSameAsDefault(limit, defaultLimit)).toBe(false);
  });

  test('returns true when defaultLimit is undefined and limit has no extra rules', () => {
    const limit = {};

    expect(isLimitSameAsDefault(limit, undefined)).toBe(true);
  });
});

describe('isResetAvailable', () => {
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

describe('isDisableRole', () => {
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

describe('getRolesGridData', () => {
  test('Should return role for isPublic true with limits and shares', () => {
    const res = getRolesGridData(
      {
        isPublic: true,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: {
          limit: { day: '1', minute: '1' },
          limit2: { day: null, minute: null },
        },
      },
      [{ name: 'limit' }, { name: 'limit2' }],
    );
    expect(res).toEqual([
      { name: 'limit', day: '1', minute: '1' },
      { name: 'limit2', day: null, minute: null },
    ]);
  });

  test('Should return role for isPublic false with limits and shares', () => {
    const res = getRolesGridData(
      {
        isPublic: false,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: { limit: { day: '1', minute: '1', enabled: true } },
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([
      {
        name: 'limit',
        day: '1',
        minute: '1',
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
        roleLimits: { limit: { day: '1', minute: '1', enabled: true } },
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
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([{ name: 'limit', day: '2', minute: '2' }]);
  });

  test('Should handle missing roleShareResourceLimits gracefully when isPublic true', () => {
    const res = getRolesGridData(
      {
        isPublic: true,
        defaultRoleLimit: { day: '2', minute: '2' },
        roleLimits: { limit: { day: '1', minute: '1' } },
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([
      {
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
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([
      {
        day: null,
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
      },
      [{ name: 'limit' }],
    );
    expect(res).toEqual([
      {
        day: '1',
        minute: '1',
        month: undefined,
        name: 'limit',
        week: undefined,
      },
    ]);
  });
});

describe('integerValueFormatter', () => {
  test('returns empty string for null and undefined', () => {
    // @ts-ignore
    expect(integerValueFormatter(null)).toBe('');
    // @ts-ignore
    expect(integerValueFormatter(undefined)).toBe('');
  });

  test('returns empty string for empty input or non-digits', () => {
    expect(integerValueFormatter('')).toBe('');
    expect(integerValueFormatter('abc')).toBe('');
  });

  test('preserves numeric strings and numbers', () => {
    expect(integerValueFormatter('123')).toBe('123');
    expect(integerValueFormatter(123)).toBe('123');
  });

  test('strips non-digit characters', () => {
    expect(integerValueFormatter('a1b2c3')).toBe('123');
  });

  test('handles leading zeros: single zero stays, multi zeros trimmed', () => {
    expect(integerValueFormatter('0')).toBe('0');
    expect(integerValueFormatter('05')).toBe('5');
    expect(integerValueFormatter('000')).toBe('0');
    expect(integerValueFormatter('0a1')).toBe('1');
  });
});

describe('isSetNoLimitsHidden', () => {
  const mockApi = (values: Record<string, string>) =>
    ({
      getColumn: vi.fn((key: string) => key),
      getCellValue: vi.fn(({ colKey }: { colKey: string }) => values[colKey]),
    }) as unknown as GridApi;

  const baseNode = {
    data: {
      type: 'SomeOtherType',
    },
  } as IRowNode;

  test('returns true for Routes type', () => {
    const api = mockApi({});
    const node = {
      data: { type: MenuI18nKey.Routes },
    } as IRowNode;

    expect(isSetNoLimitsHidden(api, node)).toBe(true);
  });

  test('returns true for Toolsets type', () => {
    const api = mockApi({});
    const node = {
      data: { type: MenuI18nKey.Toolsets },
    } as IRowNode;

    expect(isSetNoLimitsHidden(api, node)).toBe(true);
  });

  test('returns true when all limits are UNLIMITED', () => {
    const api = mockApi({
      day: UNLIMITED_VALUE,
      minute: UNLIMITED_VALUE,
      week: UNLIMITED_VALUE,
      month: UNLIMITED_VALUE,
    });

    expect(isSetNoLimitsHidden(api, baseNode)).toBe(true);
  });

  test('returns false when at least one limit is not UNLIMITED', () => {
    const api = mockApi({
      day: UNLIMITED_VALUE,
      minute: UNLIMITED_VALUE,
      week: UNLIMITED_VALUE,
      month: '10',
    });

    expect(isSetNoLimitsHidden(api, baseNode)).toBe(false);
  });
});

describe('isResetToDefaultHidden', () => {
  const mockApi = (values: Record<string, string | undefined>) =>
    ({
      getColumn: vi.fn((key: string) => key),
      getCellValue: vi.fn(({ colKey }: { colKey: string }) => values[colKey]),
    }) as unknown as GridApi;

  const node = {} as IRowNode;

  test('returns true when all values match defaultRoleLimit', () => {
    const api = mockApi({
      day: '1',
      minute: '2',
      week: '3',
      month: '4',
    });

    const entity = {
      defaultRoleLimit: {
        day: '1',
        minute: '2',
        week: '3',
        month: '4',
      },
    } as EntityRoleLimits;

    expect(isResetToDefaultHidden(api, node, entity)).toBe(true);
  });

  test('returns false when any value differs from defaultRoleLimit', () => {
    const api = mockApi({
      day: '1',
      minute: '2',
      week: '99',
      month: '4',
    });

    const entity = {
      defaultRoleLimit: {
        day: '1',
        minute: '2',
        week: '3',
        month: '4',
      },
    } as EntityRoleLimits;

    expect(isResetToDefaultHidden(api, node, entity)).toBe(false);
  });

  test('returns false when defaultRoleLimit is undefined', () => {
    const api = mockApi({
      day: '1',
      minute: '2',
      week: '3',
      month: '4',
    });

    const entity = {
      defaultRoleLimit: undefined,
    } as EntityRoleLimits;

    expect(isResetToDefaultHidden(api, node, entity)).toBe(false);
  });
});
