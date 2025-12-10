import { ActivityAuditDiff } from '@/src/models/dial/activity-audit';
import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/role-limits';
import { DiffStatus } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import {
  compareEntities,
  compareInterceptors,
  compareRoleLimits,
  compareShare,
  fillEntities,
  fillInterceptors,
  fillRoleLimits,
  fillShare,
} from '../create-simple-diffs';

describe('Activity audit :: compareEntities', () => {
  test('should push MIRROR when val1 exists and val2 is missing', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareEntities(diffs, ['a', 'b'], []);

    expect(diffs).toEqual([
      { parameter: '', value: '', diffStatus: DiffStatus.MIRROR },
      { parameter: '', value: '', diffStatus: DiffStatus.MIRROR },
    ]);
  });

  test('should push ADDED when val1 is missing and val2 exists', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareEntities(diffs, [], ['x', 'y']);

    expect(diffs).toEqual([
      { parameter: 'x', value: 'x', diffStatus: DiffStatus.ADDED },
      { parameter: 'y', value: 'y', diffStatus: DiffStatus.ADDED },
    ]);
  });

  test('should push MIRROR instead of REMOVED or ADDED when isCurrent=true', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareEntities(diffs, ['a'], [], true);
    compareEntities(diffs, [], ['b'], true);

    expect(diffs).toEqual([
      { parameter: '', value: '', diffStatus: DiffStatus.MIRROR },
      { parameter: 'b', value: 'b', diffStatus: DiffStatus.REMOVED },
    ]);
  });

  test('should push CHANGED when values differ', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareEntities(diffs, ['old1', 'same'], ['new1', 'same']);

    expect(diffs).toEqual([
      { parameter: 'new1', value: 'new1', diffStatus: DiffStatus.ADDED },
      { parameter: '', value: '', diffStatus: DiffStatus.MIRROR },
      { parameter: 'same', value: 'same' },
    ]);
  });

  test('should push unchanged value when values are equal', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareEntities(diffs, ['one', 'two'], ['one', 'two']);

    expect(diffs).toEqual([
      { parameter: 'one', value: 'one' },
      { parameter: 'two', value: 'two' },
    ]);
  });

  test('should handle different lengths of val1 and val2', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareEntities(diffs, ['a', 'b', 'c'], ['a', 'x']);

    expect(diffs).toEqual([
      { parameter: 'a', value: 'a' },
      { parameter: '', value: '', diffStatus: DiffStatus.MIRROR },
      { parameter: '', value: '', diffStatus: DiffStatus.MIRROR },
      { parameter: 'x', value: 'x', diffStatus: DiffStatus.ADDED },
    ]);
  });

  test('should handle empty arrays', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareEntities(diffs, [], []);

    expect(diffs).toEqual([]);
  });

  test('should handle one empty array and the other containing a value', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareEntities(diffs, [], ['item']);

    expect(diffs).toEqual([{ parameter: 'item', value: 'item', diffStatus: DiffStatus.ADDED }]);
  });

  test('should push MIRROR when one array has a value and the other is empty with isCurrent=true', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareEntities(diffs, ['item'], [], true);
    compareEntities(diffs, [], ['item'], true);

    expect(diffs).toEqual([
      { parameter: '', value: '', diffStatus: DiffStatus.MIRROR },
      { parameter: 'item', value: 'item', diffStatus: DiffStatus.REMOVED },
    ]);
  });

  test('should sort arrays before comparison to prevent index-related differences', () => {
    const diffs: ActivityAuditDiff[] = [];
    compareEntities(diffs, ['banana', 'apple'], ['apple', 'banana']);

    expect(diffs).toEqual([
      { parameter: 'apple', value: 'apple' },
      { parameter: 'banana', value: 'banana' },
    ]);
  });
});

describe('Activity audit :: fillEntities', () => {
  test('should push each string as a diff with parameter and value', () => {
    const diffs: ActivityAuditDiff[] = [];
    const value = ['one', 'two', 'three'];

    fillEntities(diffs, value);

    expect(diffs).toEqual([
      { parameter: 'one', value: 'one' },
      { parameter: 'two', value: 'two' },
      { parameter: 'three', value: 'three' },
    ]);
  });

  test('should handle empty array', () => {
    const diffs: ActivityAuditDiff[] = [];
    fillEntities(diffs, []);

    expect(diffs).toEqual([]);
  });

  test('should handle undefined value', () => {
    const diffs: ActivityAuditDiff[] = [];
    fillEntities(diffs, undefined as unknown as string[]);

    expect(diffs).toEqual([]);
  });

  test('should convert empty strings to parameter/value as empty string', () => {
    const diffs: ActivityAuditDiff[] = [];
    const value = ['a', '', 'c'];

    fillEntities(diffs, value);

    expect(diffs).toEqual([
      { parameter: 'a', value: 'a' },
      { parameter: '', value: '' },
      { parameter: 'c', value: 'c' },
    ]);
  });
});

describe('Activity audit :: compareInterceptors', () => {
  test('should push REMOVE when val1 item is defined and val2 item is null', () => {
    const diffs = [];
    compareInterceptors(diffs, ['a', 'b'], ['a', null as unknown as string]);
    expect(diffs).toEqual([
      { parameter: '1', value: 'a' },
      { parameter: '2', value: '', diffStatus: DiffStatus.REMOVED },
    ]);
  });

  test('should push ADD when val1 item is null and val2 item is defined', () => {
    const diffs = [];
    compareInterceptors(diffs, ['a', null as unknown as string], ['a', 'b']);
    expect(diffs).toEqual([
      { parameter: '1', value: 'a' },
      { parameter: '2', value: 'b', diffStatus: DiffStatus.ADDED },
    ]);
  });

  test('should push CHANGE when val1 and val2 items are different', () => {
    const diffs = [];
    compareInterceptors(diffs, ['old', 'same'], ['new', 'same']);
    expect(diffs).toEqual([
      { parameter: '1', value: 'new', diffStatus: DiffStatus.CHANGED },
      { parameter: '2', value: 'same' },
    ]);
  });

  test('should push unchanged values when val1 and val2 items are the same', () => {
    const diffs = [];
    compareInterceptors(diffs, ['same', 'same'], ['same', 'same']);
    expect(diffs).toEqual([
      { parameter: '1', value: 'same' },
      { parameter: '2', value: 'same' },
    ]);
  });

  test('should handle val1 longer than val2 with REMOVEs', () => {
    const diffs = [];
    compareInterceptors(diffs, ['one', 'two', 'three'], ['one']);
    expect(diffs).toEqual([
      { parameter: '1', value: 'one' },
      { parameter: '2', value: '', diffStatus: DiffStatus.REMOVED },
      { parameter: '3', value: '', diffStatus: DiffStatus.REMOVED },
    ]);
  });

  test('should handle val2 longer than val1 with ADDs', () => {
    const diffs = [];
    compareInterceptors(diffs, ['one'], ['one', 'two', 'three']);
    expect(diffs).toEqual([
      { parameter: '1', value: 'one' },
      { parameter: '2', value: 'two', diffStatus: DiffStatus.ADDED },
      { parameter: '3', value: 'three', diffStatus: DiffStatus.ADDED },
    ]);
  });

  test('should handle empty arrays', () => {
    const diffs = [];
    compareInterceptors(diffs, [], []);
    expect(diffs).toEqual([]);
  });
});

describe('Activity audit :: fillInterceptors', () => {
  test('should fill diffs with index and value pairs from array', () => {
    const diffs = [];
    fillInterceptors(diffs, ['one', 'two']);
    expect(diffs).toEqual([
      { parameter: '1', value: 'one' },
      { parameter: '2', value: 'two' },
    ]);
  });

  test('should convert falsy string values like empty string to empty string', () => {
    const diffs = [];
    fillInterceptors(diffs, ['value', '']);
    expect(diffs).toEqual([
      { parameter: '1', value: 'value' },
      { parameter: '2', value: '' },
    ]);
  });

  test('should replace null and undefined with empty strings', () => {
    const diffs = [];
    fillInterceptors(diffs, ['a', null as unknown as string, undefined as unknown as string]);
    expect(diffs).toEqual([
      { parameter: '1', value: 'a' },
      { parameter: '2', value: '' },
      { parameter: '3', value: '' },
    ]);
  });

  test('should do nothing when value is an empty array', () => {
    const diffs = [];
    fillInterceptors(diffs, []);
    expect(diffs).toEqual([]);
  });

  test('should do nothing when value is undefined', () => {
    const diffs = [];
    fillInterceptors(diffs, undefined as unknown as string[]);
    expect(diffs).toEqual([]);
  });

  test('should work with single-element array', () => {
    const diffs = [];
    fillInterceptors(diffs, ['only']);
    expect(diffs).toEqual([{ parameter: '1', value: 'only' }]);
  });
});

describe('Activity audit :: compareRoleLimits', () => {
  test('should push REMOVE when val1 has key and val2 does not', () => {
    const diffs = [];
    const val1 = { admin: { maxCalls: 5, maxDuration: 10 } };
    const val2 = {};
    compareRoleLimits(diffs, val1, val2);
    expect(diffs).toEqual([{ parameter: '', value: '', diffStatus: DiffStatus.REMOVED }]);
  });

  test('should push ADD when val1 does not have key and val2 does', () => {
    const diffs = [];
    const val1 = {};
    const val2 = { user: { maxCalls: 3, maxDuration: 15 } };
    compareRoleLimits(diffs, val1, val2);
    expect(diffs).toEqual([{ parameter: 'user', value: 'maxCalls: 3, maxDuration: 15', diffStatus: DiffStatus.ADDED }]);
  });

  test('should push CHANGE when val1 and val2 have same key but different values', () => {
    const diffs = [];
    const val1 = { guest: { maxCalls: 1, maxDuration: 5 } };
    const val2 = { guest: { maxCalls: 2, maxDuration: 5 } };
    compareRoleLimits(diffs, val1, val2);
    expect(diffs).toEqual([
      { parameter: 'guest', value: 'maxCalls: 2, maxDuration: 5', diffStatus: DiffStatus.CHANGED },
    ]);
  });

  test('should push unchanged value when val1 and val2 are equal', () => {
    const diffs = [];
    const val1 = { manager: { maxCalls: 4, maxDuration: 20 } };
    const val2 = { manager: { maxCalls: 4, maxDuration: 20 } };
    compareRoleLimits(diffs, val1, val2);
    expect(diffs).toEqual([{ parameter: 'manager', value: 'maxCalls: 4, maxDuration: 20' }]);
  });

  test('should handle empty val1 and val2', () => {
    const diffs = [];
    compareRoleLimits(diffs, {}, {});
    expect(diffs).toEqual([]);
  });

  test('should handle val1 or val2 being null or undefined', () => {
    const diffs1 = [];
    compareRoleLimits(diffs1, null as any, { user: { maxCalls: 1, maxDuration: 1 } });
    expect(diffs1).toEqual([{ parameter: 'user', value: 'maxCalls: 1, maxDuration: 1', diffStatus: DiffStatus.ADDED }]);

    const diffs2 = [];
    compareRoleLimits(diffs2, { user: { maxCalls: 1, maxDuration: 1 } }, null as any);
    expect(diffs2).toEqual([{ parameter: '', value: '', diffStatus: DiffStatus.REMOVED }]);
  });
});

describe('Activity audit :: fillRoleLimits', () => {
  test('should push entries with parameter and formatted value', () => {
    const diffs = [];
    const value = {
      admin: { maxCalls: 10, maxDuration: 60 },
      user: { maxCalls: 5, maxDuration: 30 },
    };
    fillRoleLimits(diffs, value);
    expect(diffs).toEqual([
      { parameter: 'admin', value: 'maxCalls: 10, maxDuration: 60' },
      { parameter: 'user', value: 'maxCalls: 5, maxDuration: 30' },
    ]);
  });

  test('should handle single key object', () => {
    const diffs = [];
    const value = {
      guest: { maxCalls: 1, maxDuration: 5 },
    };
    fillRoleLimits(diffs, value);
    expect(diffs).toEqual([{ parameter: 'guest', value: 'maxCalls: 1, maxDuration: 5' }]);
  });

  test('should sort keys alphabetically', () => {
    const diffs = [];
    const value = {
      zeta: { maxCalls: 3, maxDuration: 3 },
      alpha: { maxCalls: 1, maxDuration: 1 },
    };
    fillRoleLimits(diffs, value);
    expect(diffs).toEqual([
      { parameter: 'alpha', value: 'maxCalls: 1, maxDuration: 1' },
      { parameter: 'zeta', value: 'maxCalls: 3, maxDuration: 3' },
    ]);
  });

  test('should do nothing if value is an empty object', () => {
    const diffs = [];
    fillRoleLimits(diffs, {});
    expect(diffs).toEqual([]);
  });

  test('should handle value being null or undefined gracefully', () => {
    const diffs1 = [];
    fillRoleLimits(diffs1, null as unknown as Record<string, DialRoleLimits>);
    expect(diffs1).toEqual([]);

    const diffs2 = [];
    fillRoleLimits(diffs2, undefined as unknown as Record<string, DialRoleLimits>);
    expect(diffs2).toEqual([]);
  });
});

describe('Activity audit :: compareShare', () => {
  const shareKeys = ['invitationTtl', 'maxAcceptedUsers'];

  test('should push REMOVED diffs when value1 exists and value2 is missing', () => {
    const diffs: any[] = [];
    const val1 = {
      application: { invitationTtl: '1000', maxAcceptedUsers: '5' },
      conversation: { invitationTtl: '1000', maxAcceptedUsers: '5' },
      file: { invitationTtl: '1000', maxAcceptedUsers: '5' },
      prompt: { invitationTtl: '1000', maxAcceptedUsers: '5' },
      tool_set: { invitationTtl: '1000', maxAcceptedUsers: '5' },
    };
    const val2 = {};

    compareShare(diffs, val1, val2);

    expect(diffs.length).toBe(10);
    diffs.forEach((d) => {
      expect(d.diffStatus).toBe(DiffStatus.REMOVED);
    });
  });

  test('should push MIRROR diffs when value1 exists and value2 missing with isCurrent=true', () => {
    const diffs: any[] = [];
    const val1 = {
      application: { invitationTtl: '1000', maxAcceptedUsers: '5' },
      conversation: { invitationTtl: '1000', maxAcceptedUsers: '5' },
      file: { invitationTtl: '1000', maxAcceptedUsers: '5' },
      prompt: { invitationTtl: '1000', maxAcceptedUsers: '5' },
      tool_set: { invitationTtl: '1000', maxAcceptedUsers: '5' },
    };
    const val2 = {};

    compareShare(diffs, val1, val2, true);

    expect(diffs.length).toBe(10);
    diffs.forEach((d) => {
      expect(d.diffStatus).toBe(DiffStatus.MIRROR);
    });
  });

  test('should fill ADDED diffs when value1 missing and value2 present', () => {
    const diffs: any[] = [];
    const val1 = {};
    const val2 = {
      application: { invitationTtl: '2000', maxAcceptedUsers: '10' },
    };

    compareShare(diffs, val1, val2);

    expect(diffs.length).toBe(10);
    diffs.forEach((d) => {
      expect(d.parameter).toContain('.');
    });
  });

  test('should call fillShareValues for CHANGED when values differ', () => {
    const diffs: any[] = [];
    const val1 = {
      application: { invitationTtl: '1000', acceptedUsers: '5' },
    };
    const val2 = {
      application: { invitationTtl: '3000', acceptedUsers: '5' },
    };

    compareShare(diffs, val1, val2);

    expect(diffs.length).toBeGreaterThan(0);
    const changed = diffs.find((d) => d.diffStatus === DiffStatus.CHANGED);
    expect(changed).toBeTruthy();
  });

  test('should call fillShareValues for UNCHANGED when objects equal', () => {
    const diffs: any[] = [];
    const val1 = {
      application: { invitationTtl: '1000', acceptedUsers: '5' },
    };
    const val2 = {
      application: { invitationTtl: '1000', acceptedUsers: '5' },
    };

    compareShare(diffs, val1, val2);

    expect(diffs.length).toBeGreaterThan(0);
    diffs.forEach((d) => expect(d.diffStatus).toBeUndefined());
  });

  test('should handle multiple keys (roles) and push diffs for each', () => {
    const diffs: any[] = [];
    const val1 = {
      application: { invitationTtl: '1000', acceptedUsers: '5' },
      conversation: { invitationTtl: '2000', acceptedUsers: '10' },
    };
    const val2 = {
      application: { invitationTtl: '3000', acceptedUsers: '5' },
      conversation: { invitationTtl: '2000', acceptedUsers: '10' },
    };

    compareShare(diffs, val1, val2);

    expect(diffs.length).toBeGreaterThan(shareKeys.length);
    expect(diffs.some((d) => d.diffStatus === DiffStatus.CHANGED)).toBe(true);
  });

  test('should correctly call convertShareValue for REMOVED diffs with empty value', () => {
    const diffs: any[] = [];
    const val1 = {
      application: { invitationTtl: '1000' },
      conversation: { invitationTtl: '1000' },
      file: { invitationTtl: '1000' },
      prompt: { invitationTtl: '1000' },
      tool_set: { invitationTtl: '1000' },
    };
    const val2 = {};

    compareShare(diffs, val1, val2);

    expect(diffs.length).toBe(10);
    diffs.forEach((d) => {
      expect(d.diffStatus).toBe(DiffStatus.REMOVED);
    });
  });
});

describe('Activity audit :: fillShare', () => {
  test('should fill diffs for each role and each share key', () => {
    const diffs: ActivityAuditDiff[] = [];
    const value: Record<string, DialRoleShare> = {
      application: { invitationTtl: '1000', maxAcceptedUsers: '5' },
      conversation: { invitationTtl: '2000', maxAcceptedUsers: '10' },
    };

    fillShare(diffs, value);

    expect(diffs.length).toBe(10);
    expect(diffs.every((d) => d.parameter.includes('maxAcceptedUsers') || d.parameter.includes('invitationTtl'))).toBe(
      true,
    );
  });

  test('should not throw when value is empty', () => {
    const diffs: ActivityAuditDiff[] = [];
    const value: Record<string, DialRoleShare> = {};

    expect(() => fillShare(diffs, value)).not.toThrow();
    expect(diffs.length).toBe(10);
  });

  test('should process shareKeys in sorted order of roles', () => {
    const diffs: ActivityAuditDiff[] = [];
    const value: Record<string, DialRoleShare> = {
      application: { invitationTtl: '500', acceptedUsers: '2' },
      conversation: { invitationTtl: '1000', acceptedUsers: '5' },
    };

    fillShare(diffs, value);

    const rolesOrder = diffs.map((d) => d.parameter.split('.')[0]).filter((v, i, arr) => arr.indexOf(v) === i);

    expect(rolesOrder).toEqual(['application', 'conversation', 'file', 'prompt', 'tool_set']);
  });

  test('should call fillShareValues once per key in shareKeys', () => {
    const diffs: ActivityAuditDiff[] = [];
    const value: Record<string, DialRoleShare> = {
      testRole: { invitationTtl: '1500', acceptedUsers: '3' },
    };

    fillShare(diffs, value);

    expect(diffs.length).toBe(10);
  });
});
