import { describe, test, expect, vi } from 'vitest';
import { ColDef, Column, GridApi, IRowNode } from 'ag-grid-community';

import { DialRole } from '@/src/models/dial/role';
import { SharingType } from '../types';
import { getSharingData, getDefaultPlaceholder, isResetToDefaultHidden, isSetNoLimitsHidden } from '../utils';
import { UNLIMITED_ACCEPTED_USERS, UNLIMITED_VALUE } from '@/src/constants/role';

describe('getSharingData', () => {
  test('should return default sharing data when role is undefined', () => {
    const result = getSharingData();

    expect(result).toEqual([
      { name: SharingType.APPLICATION, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.TOOL_SET, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.PROMPT, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.FILE, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.CONVERSATION, invitationTtl: undefined, maxAcceptedUsers: undefined },
    ]);
  });

  test('should return correct sharing data based on provided role', () => {
    const mockRole: DialRole = {
      share: {
        [SharingType.APPLICATION]: { invitationTtl: '3600000', maxAcceptedUsers: '5' },
        [SharingType.TOOL_SET]: { invitationTtl: '7200000', maxAcceptedUsers: '10' },
        [SharingType.PROMPT]: { invitationTtl: '1800000', maxAcceptedUsers: '3' },
        [SharingType.FILE]: { invitationTtl: '600000', maxAcceptedUsers: '2' },
        [SharingType.CONVERSATION]: { invitationTtl: '1200000', maxAcceptedUsers: '4' },
      },
    };

    const result = getSharingData(mockRole);

    expect(result).toEqual([
      { name: SharingType.APPLICATION, invitationTtl: '1', maxAcceptedUsers: '5' },
      { name: SharingType.TOOL_SET, invitationTtl: '2', maxAcceptedUsers: '10' },
      { name: SharingType.PROMPT, invitationTtl: '0.5', maxAcceptedUsers: '3' },
      { name: SharingType.FILE, invitationTtl: '0.16666666666666666', maxAcceptedUsers: '2' },
      { name: SharingType.CONVERSATION, invitationTtl: '0.3333333333333333', maxAcceptedUsers: '4' },
    ]);
  });

  test('should return undefined values if specific SharingType is not present in role', () => {
    const mockRole: DialRole = {
      share: {
        [SharingType.APPLICATION]: { invitationTtl: '3600000', maxAcceptedUsers: '5' },
        [SharingType.TOOL_SET]: { invitationTtl: '7200000', maxAcceptedUsers: '10' },
        [SharingType.FILE]: { invitationTtl: '600000', maxAcceptedUsers: '2' },
        [SharingType.CONVERSATION]: { invitationTtl: '1200000', maxAcceptedUsers: '4' },
      },
    };

    const result = getSharingData(mockRole);

    expect(result).toEqual([
      { name: SharingType.APPLICATION, invitationTtl: '1', maxAcceptedUsers: '5' },
      { name: SharingType.TOOL_SET, invitationTtl: '2', maxAcceptedUsers: '10' },
      { name: SharingType.PROMPT, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.FILE, invitationTtl: '0.16666666666666666', maxAcceptedUsers: '2' },
      { name: SharingType.CONVERSATION, invitationTtl: '0.3333333333333333', maxAcceptedUsers: '4' },
    ]);
  });

  test('should return the same structure even if role is empty', () => {
    const mockRole: DialRole = {
      share: {},
    };

    const result = getSharingData(mockRole);

    expect(result).toEqual([
      { name: SharingType.APPLICATION, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.TOOL_SET, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.PROMPT, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.FILE, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.CONVERSATION, invitationTtl: undefined, maxAcceptedUsers: undefined },
    ]);
  });

  test('should return UNLIMITED_VALUE for invitationTtl when it is equal to UNLIMITED_VALUE', () => {
    const mockRole: DialRole = {
      share: {
        [SharingType.APPLICATION]: { invitationTtl: UNLIMITED_VALUE, maxAcceptedUsers: '5' },
        [SharingType.TOOL_SET]: { invitationTtl: UNLIMITED_VALUE, maxAcceptedUsers: '10' },
      },
    };

    const result = getSharingData(mockRole);

    expect(result).toEqual([
      { name: SharingType.APPLICATION, invitationTtl: UNLIMITED_VALUE, maxAcceptedUsers: '5' },
      { name: SharingType.TOOL_SET, invitationTtl: UNLIMITED_VALUE, maxAcceptedUsers: '10' },
      { name: SharingType.PROMPT, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.FILE, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.CONVERSATION, invitationTtl: undefined, maxAcceptedUsers: undefined },
    ]);
  });

  test('should return undefined for invitationTtl if it is falsy (null, undefined)', () => {
    const mockRole: DialRole = {
      share: {
        [SharingType.APPLICATION]: { invitationTtl: null, maxAcceptedUsers: '5' },
        [SharingType.TOOL_SET]: { invitationTtl: undefined, maxAcceptedUsers: '10' },
      },
    };

    const result = getSharingData(mockRole);

    expect(result).toEqual([
      { name: SharingType.APPLICATION, invitationTtl: undefined, maxAcceptedUsers: '5' },
      { name: SharingType.TOOL_SET, invitationTtl: undefined, maxAcceptedUsers: '10' },
      { name: SharingType.PROMPT, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.FILE, invitationTtl: undefined, maxAcceptedUsers: undefined },
      { name: SharingType.CONVERSATION, invitationTtl: undefined, maxAcceptedUsers: undefined },
    ]);
  });
});

describe('getDefaultPlaceholder', () => {
  test('should return the correct placeholder based on node data and column field', () => {
    const mockNode = {
      data: { name: SharingType.APPLICATION },
    } as IRowNode;
    const mockColDef: ColDef = { field: 'invitationTtl' };

    const result = getDefaultPlaceholder(mockNode, mockColDef);
    expect(result).toBe('72');
  });

  test('should return the correct maxAcceptedUsers based on node data and column field', () => {
    const mockNode = {
      data: { name: SharingType.TOOL_SET },
    } as IRowNode;
    const mockColDef: ColDef = { field: 'maxAcceptedUsers' };

    const result = getDefaultPlaceholder(mockNode, mockColDef);
    expect(result).toBe('');
  });

  test('should return undefined if field does not exist in sharingDefaults for the given name', () => {
    const mockNode = {
      data: { name: SharingType.CONVERSATION },
    } as IRowNode;
    const mockColDef: ColDef = { field: 'nonExistentField' };

    const result = getDefaultPlaceholder(mockNode, mockColDef);
    expect(result).toBeUndefined();
  });
});

describe('isResetToDefaultHidden', () => {
  const mockApi = {
    getCellValue: vi.fn(),
    getColumn: vi.fn(),
  } as unknown as GridApi;

  const mockNode: IRowNode = { data: {} } as IRowNode;

  test('should return true when both invitationTtl and maxAcceptedUsers are falsy', () => {
    mockApi.getCellValue.mockImplementation(({ colKey }: { colKey: string }) => {
      if (colKey === 'invitationTtl') return undefined;
      if (colKey === 'maxAcceptedUsers') return undefined;
    });

    mockApi.getColumn.mockImplementation((colKey: string) => {
      if (colKey === 'invitationTtl') return 'invitationTtl';
      if (colKey === 'maxAcceptedUsers') return 'maxAcceptedUsers';
      return {} as Column;
    });

    const result = isResetToDefaultHidden(mockApi, mockNode);
    expect(result).toBe(true);
  });

  test('should return false when invitationTtl is truthy', () => {
    mockApi.getCellValue.mockImplementation(({ colKey }: { colKey: string }) => {
      if (colKey === 'invitationTtl') return '3600';
      if (colKey === 'maxAcceptedUsers') return undefined;
    });

    mockApi.getColumn.mockImplementation((colKey: string) => {
      if (colKey === 'invitationTtl') return 'invitationTtl';
      if (colKey === 'maxAcceptedUsers') return 'maxAcceptedUsers';
      return {} as Column;
    });

    const result = isResetToDefaultHidden(mockApi, mockNode);
    expect(result).toBe(false);
  });

  test('should return false when maxAcceptedUsers is truthy', () => {
    mockApi.getCellValue.mockImplementation(({ colKey }: { colKey: string }) => {
      if (colKey === 'invitationTtl') return undefined;
      if (colKey === 'maxAcceptedUsers') return '10';
    });

    mockApi.getColumn.mockImplementation((colKey: string) => {
      if (colKey === 'invitationTtl') return 'invitationTtl';
      if (colKey === 'maxAcceptedUsers') return 'maxAcceptedUsers';
      return {} as Column;
    });

    const result = isResetToDefaultHidden(mockApi, mockNode);
    expect(result).toBe(false);
  });

  test('should return false when both invitationTtl and maxAcceptedUsers are truthy', () => {
    mockApi.getCellValue.mockImplementation(({ colKey }: { colKey: string }) => {
      if (colKey === 'invitationTtl') return '3600';
      if (colKey === 'maxAcceptedUsers') return '10';
    });

    mockApi.getColumn.mockImplementation((colKey: string) => {
      if (colKey === 'invitationTtl') return 'invitationTtl';
      if (colKey === 'maxAcceptedUsers') return 'maxAcceptedUsers';
      return {} as Column;
    });

    const result = isResetToDefaultHidden(mockApi, mockNode);
    expect(result).toBe(false);
  });
});

describe('isSetNoLimitsHidden', () => {
  const mockApi = {
    getCellValue: vi.fn(),
    getColumn: vi.fn(),
  } as unknown as GridApi;

  const mockNode: IRowNode = { data: {} } as IRowNode;

  test('should return true when both invitationTtl and maxAcceptedUsers are falsy', () => {
    mockApi.getCellValue.mockImplementation(({ colKey }: { colKey: string }) => {
      if (colKey === 'invitationTtl') return undefined;
      if (colKey === 'maxAcceptedUsers') return undefined;
    });

    mockApi.getColumn.mockImplementation((colKey: string) => {
      if (colKey === 'invitationTtl') return 'invitationTtl';
      if (colKey === 'maxAcceptedUsers') return 'maxAcceptedUsers';
      return {} as Column;
    });

    const result = isSetNoLimitsHidden(mockApi, mockNode);
    expect(result).toBe(false);
  });

  test('should return true when invitationTtl is UNLIMITED_VALUE and maxAcceptedUsers is UNLIMITED_ACCEPTED_USERS', () => {
    mockApi.getCellValue.mockImplementation(({ colKey }: { colKey: string }) => {
      if (colKey === 'invitationTtl') return UNLIMITED_VALUE;
      if (colKey === 'maxAcceptedUsers') return UNLIMITED_ACCEPTED_USERS;
    });

    mockApi.getColumn.mockImplementation((colKey: string) => {
      if (colKey === 'invitationTtl') return 'invitationTtl';
      if (colKey === 'maxAcceptedUsers') return 'maxAcceptedUsers';
      return {} as Column;
    });

    const result = isSetNoLimitsHidden(mockApi, mockNode);
    expect(result).toBe(true);
  });

  test('should return false when invitationTtl is truthy and maxAcceptedUsers is falsy', () => {
    mockApi.getCellValue.mockImplementation(({ colKey }: { colKey: string }) => {
      if (colKey === 'invitationTtl') return '3600';
      if (colKey === 'maxAcceptedUsers') return undefined;
    });

    mockApi.getColumn.mockImplementation((colKey: string) => {
      if (colKey === 'invitationTtl') return 'invitationTtl';
      if (colKey === 'maxAcceptedUsers') return 'maxAcceptedUsers';
      return {} as Column;
    });

    const result = isSetNoLimitsHidden(mockApi, mockNode);
    expect(result).toBe(false);
  });

  test('should return false when invitationTtl is falsy and maxAcceptedUsers is truthy', () => {
    mockApi.getCellValue.mockImplementation(({ colKey }: { colKey: string }) => {
      if (colKey === 'invitationTtl') return '3600';
      if (colKey === 'invitationTtl') return undefined;
      if (colKey === 'maxAcceptedUsers') return '10';
    });

    mockApi.getColumn.mockImplementation((colKey: string) => {
      if (colKey === 'invitationTtl') return 'invitationTtl';
      if (colKey === 'maxAcceptedUsers') return 'maxAcceptedUsers';
      return {} as Column;
    });

    const result = isSetNoLimitsHidden(mockApi, mockNode);
    expect(result).toBe(false);
  });

  test('should return false when both invitationTtl and maxAcceptedUsers are truthy but do not match UNLIMITED_VALUE', () => {
    mockApi.getCellValue.mockImplementation(({ colKey }: { colKey: string }) => {
      if (colKey === 'invitationTtl') return '3600';
      if (colKey === 'maxAcceptedUsers') return '10';
    });

    mockApi.getColumn.mockImplementation((colKey: string) => {
      if (colKey === 'invitationTtl') return 'invitationTtl';
      if (colKey === 'maxAcceptedUsers') return 'maxAcceptedUsers';
      return {} as Column;
    });

    const result = isSetNoLimitsHidden(mockApi, mockNode);
    expect(result).toBe(false);
  });
});
