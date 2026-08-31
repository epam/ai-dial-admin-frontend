import { describe, expect, test } from 'vitest';

import { DialRoleResource } from '@/src/models/dial/resource';
import { applySharingChange, getAssetSharingData, toCoreShareField } from '../utils';

describe('toCoreShareField', () => {
  test("maps invitationTtl to Core's snake_case invitation_ttl", () => {
    expect(toCoreShareField('invitationTtl')).toBe('invitation_ttl');
  });

  test("maps maxAcceptedUsers to Core's snake_case max_accepted_users", () => {
    expect(toCoreShareField('maxAcceptedUsers')).toBe('max_accepted_users');
  });
});

describe('getAssetSharingData', () => {
  test('reads invitation_ttl/max_accepted_users directly, with no ms<->hours conversion', () => {
    const role = {
      share: { application: { invitation_ttl: 24, max_accepted_users: 5 } },
    } as DialRoleResource;

    const row = getAssetSharingData(role).find((r) => r.name === 'application');

    expect(row?.invitationTtl).toBe('24');
    expect(row?.maxAcceptedUsers).toBe('5');
  });

  test('lists all five sharing types even when the role has no share entries', () => {
    const rows = getAssetSharingData({} as DialRoleResource);

    expect(rows).toHaveLength(5);
    expect(rows.every((row) => row.invitationTtl === undefined && row.maxAcceptedUsers === undefined)).toBe(true);
  });

  test('leaves a type with no share entry as undefined rather than "0"', () => {
    const role = { share: { application: { invitation_ttl: 24 } } } as DialRoleResource;

    const applicationRow = getAssetSharingData(role).find((r) => r.name === 'application');
    const toolsetRow = getAssetSharingData(role).find((r) => r.name === 'tool_set');

    expect(applicationRow?.maxAcceptedUsers).toBeUndefined();
    expect(toolsetRow?.invitationTtl).toBeUndefined();
  });
});

describe('applySharingChange', () => {
  test('writes the raw value to invitation_ttl with no ms<->hours conversion', () => {
    const role = {} as DialRoleResource;

    const result = applySharingChange(role, 'application', 'invitationTtl', 24);

    // Not `24 * 60 * 60 * 1000` — Core's own field is already in hours.
    expect(result.share?.application?.invitation_ttl).toBe(24);
  });

  test('writes the raw value to max_accepted_users', () => {
    const role = {} as DialRoleResource;

    const result = applySharingChange(role, 'application', 'maxAcceptedUsers', 5);

    expect(result.share?.application?.max_accepted_users).toBe(5);
  });

  test('preserves the other field on the same sharing type when only one is edited', () => {
    const role = { share: { application: { max_accepted_users: 5 } } } as DialRoleResource;

    const result = applySharingChange(role, 'application', 'invitationTtl', 24);

    expect(result.share?.application).toEqual({ max_accepted_users: 5, invitation_ttl: 24 });
  });

  test('drops the sharing type entry once every field on it is empty', () => {
    const role = { share: { application: { invitation_ttl: 24 } } } as DialRoleResource;

    const result = applySharingChange(role, 'application', 'invitationTtl', 0 as unknown as number);
    // A falsy-but-present value ('' from the grid) clears the entry; 0 is a legitimate value for a
    // numeric field, so exercise the actual "every field empty" path with '' instead.
    const cleared = applySharingChange(role, 'application', 'invitationTtl', '' as unknown as number);

    expect(result.share?.application).toBeDefined();
    expect(cleared.share?.application).toBeUndefined();
  });

  test('leaves other sharing types untouched', () => {
    const role = { share: { conversation: { invitation_ttl: 72 } } } as DialRoleResource;

    const result = applySharingChange(role, 'application', 'invitationTtl', 24);

    expect(result.share?.conversation).toEqual({ invitation_ttl: 72 });
  });
});
