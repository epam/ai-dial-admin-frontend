import { describe, expect, test } from 'vitest';

import { DialRoleResource } from '@/src/models/dial/resource';
import { PlatformSharingType } from '../models';
import {
  applySharingChange,
  getAssetSharingData,
  getDefaultPlaceholder,
  isResetToDefaultHidden,
  toCoreShareField,
} from '../utils';

describe('toCoreShareField', () => {
  test("maps invitationTtl to Core's snake_case invitation_ttl", () => {
    expect(toCoreShareField('invitationTtl')).toBe('invitation_ttl');
  });

  test("maps maxAcceptedUsers to Core's snake_case max_accepted_users", () => {
    expect(toCoreShareField('maxAcceptedUsers')).toBe('max_accepted_users');
  });
});

describe('getAssetSharingData', () => {
  test("reads invitation_ttl/max_accepted_users under Core's uppercase resource-type key", () => {
    const role = {
      share: { [PlatformSharingType.APPLICATION]: { invitation_ttl: 24, max_accepted_users: 5 } },
    } as DialRoleResource;

    const row = getAssetSharingData(role).find((r) => r.name === PlatformSharingType.APPLICATION);

    expect(row?.invitationTtl).toBe('24');
    expect(row?.maxAcceptedUsers).toBe('5');
  });

  test('lists all seven sharing types, including Credentials and Skills, even when the role has no share entries', () => {
    const rows = getAssetSharingData({} as DialRoleResource);

    expect(rows).toHaveLength(7);
    expect(rows.map((row) => row.name)).toEqual(Object.values(PlatformSharingType));
    expect(rows.every((row) => row.invitationTtl === undefined && row.maxAcceptedUsers === undefined)).toBe(true);
  });

  test('leaves a type with no share entry as undefined rather than "0"', () => {
    const role = {
      share: { [PlatformSharingType.APPLICATION]: { invitation_ttl: 24 } },
    } as DialRoleResource;

    const applicationRow = getAssetSharingData(role).find((r) => r.name === PlatformSharingType.APPLICATION);
    const toolsetRow = getAssetSharingData(role).find((r) => r.name === PlatformSharingType.TOOL_SET);

    expect(applicationRow?.maxAcceptedUsers).toBeUndefined();
    expect(toolsetRow?.invitationTtl).toBeUndefined();
  });

  test('treats Core\'s -1 "not provided" sentinel as absent, not as a literal -1', () => {
    const role = {
      share: {
        [PlatformSharingType.TOOL_SET]: { invitation_ttl: -1, max_accepted_users: -1 },
      },
    } as DialRoleResource;

    const row = getAssetSharingData(role).find((r) => r.name === PlatformSharingType.TOOL_SET);

    expect(row?.invitationTtl).toBeUndefined();
    expect(row?.maxAcceptedUsers).toBeUndefined();
  });
});

describe('applySharingChange', () => {
  test('writes the raw value to invitation_ttl with no ms<->hours conversion', () => {
    const role = {} as DialRoleResource;

    const result = applySharingChange(role, PlatformSharingType.APPLICATION, 'invitationTtl', 24);

    // Not `24 * 60 * 60 * 1000` — Core's own field is already in hours.
    expect(result.share?.[PlatformSharingType.APPLICATION]?.invitation_ttl).toBe(24);
  });

  test('writes the raw value to max_accepted_users', () => {
    const role = {} as DialRoleResource;

    const result = applySharingChange(role, PlatformSharingType.APPLICATION, 'maxAcceptedUsers', 5);

    expect(result.share?.[PlatformSharingType.APPLICATION]?.max_accepted_users).toBe(5);
  });

  test('preserves the other field on the same sharing type when only one is edited', () => {
    const role = {
      share: { [PlatformSharingType.APPLICATION]: { max_accepted_users: 5 } },
    } as DialRoleResource;

    const result = applySharingChange(role, PlatformSharingType.APPLICATION, 'invitationTtl', 24);

    expect(result.share?.[PlatformSharingType.APPLICATION]).toEqual({ max_accepted_users: 5, invitation_ttl: 24 });
  });

  test('clearing a field removes it from the entry, leaving a sibling field intact', () => {
    const role = {
      share: { [PlatformSharingType.APPLICATION]: { max_accepted_users: 5, invitation_ttl: 24 } },
    } as DialRoleResource;

    const result = applySharingChange(role, PlatformSharingType.APPLICATION, 'invitationTtl', '' as unknown as number);

    expect(result.share?.[PlatformSharingType.APPLICATION]).toEqual({ max_accepted_users: 5 });
  });

  test('drops the sharing type entry once every field on it is cleared', () => {
    const role = {
      share: { [PlatformSharingType.APPLICATION]: { invitation_ttl: 24 } },
    } as DialRoleResource;

    const cleared = applySharingChange(role, PlatformSharingType.APPLICATION, 'invitationTtl', '' as unknown as number);

    expect(cleared.share?.[PlatformSharingType.APPLICATION]).toBeUndefined();
  });

  test('writes a literal 0 when the user enters it manually, rather than treating it as clearing the field', () => {
    const role = {} as DialRoleResource;

    const result = applySharingChange(role, PlatformSharingType.APPLICATION, 'maxAcceptedUsers', 0);

    expect(result.share?.[PlatformSharingType.APPLICATION]).toEqual({ max_accepted_users: 0 });
  });

  test('leaves other sharing types untouched', () => {
    const role = {
      share: { [PlatformSharingType.CONVERSATION]: { invitation_ttl: 72 } },
    } as DialRoleResource;

    const result = applySharingChange(role, PlatformSharingType.APPLICATION, 'invitationTtl', 24);

    expect(result.share?.[PlatformSharingType.CONVERSATION]).toEqual({ invitation_ttl: 72 });
  });
});

describe('getDefaultPlaceholder', () => {
  test('returns 10 for toolsets, same as applications', () => {
    const applicationPlaceholder = getDefaultPlaceholder(
      { data: { name: PlatformSharingType.APPLICATION } } as never,
      { field: 'maxAcceptedUsers' } as never,
    );
    const toolsetPlaceholder = getDefaultPlaceholder(
      { data: { name: PlatformSharingType.TOOL_SET } } as never,
      { field: 'maxAcceptedUsers' } as never,
    );

    expect(toolsetPlaceholder).toBe('10');
    expect(toolsetPlaceholder).toBe(applicationPlaceholder);
  });

  test('returns 10 for the newly added Credentials and Skills types', () => {
    expect(
      getDefaultPlaceholder(
        { data: { name: PlatformSharingType.CREDENTIALS } } as never,
        {
          field: 'maxAcceptedUsers',
        } as never,
      ),
    ).toBe('10');
    expect(
      getDefaultPlaceholder(
        { data: { name: PlatformSharingType.SKILL } } as never,
        {
          field: 'maxAcceptedUsers',
        } as never,
      ),
    ).toBe('10');
  });

  test('returns 72 for invitation TTL regardless of type', () => {
    expect(
      getDefaultPlaceholder(
        { data: { name: PlatformSharingType.FILE } } as never,
        {
          field: 'invitationTtl',
        } as never,
      ),
    ).toBe('72');
  });
});

describe('isResetToDefaultHidden', () => {
  const buildApi = (invitationTtl: unknown, maxAcceptedUsers: unknown) => ({
    getColumn: (key: string) => key,
    getCellValue: ({ colKey }: { colKey: string }) => (colKey === 'invitationTtl' ? invitationTtl : maxAcceptedUsers),
  });

  test('is hidden when neither field has an override', () => {
    expect(isResetToDefaultHidden(buildApi(undefined, undefined) as never, {} as never)).toBe(true);
  });

  test('is shown once either field has an override', () => {
    expect(isResetToDefaultHidden(buildApi('24', undefined) as never, {} as never)).toBe(false);
  });
});
