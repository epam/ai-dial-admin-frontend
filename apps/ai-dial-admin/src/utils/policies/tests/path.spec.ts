import { describe, expect, test } from 'vitest';

import {
  getCostObjectFromFolder,
  getCostObjectOfRecord,
  getPolicyRecordPath,
  isPolicyPathElementValid,
} from '@/src/utils/policies/path';

describe('isPolicyPathElementValid', () => {
  test.each(['team-a', 'a', 'a.b_c:d@e[1](x)'])('accepts the Core path element %s', (value) => {
    expect(isPolicyPathElementValid(value)).toBe(true);
  });

  test.each(['', undefined, 'team/a', 'team%20a', 'team a', 'team#a', 'team+a', 'team\na'])('rejects %j', (value) => {
    expect(isPolicyPathElementValid(value)).toBe(false);
  });
});

describe('getCostObjectFromFolder', () => {
  test.each([
    ['platform/team-a/', 'team-a'],
    ['team-a/', 'team-a'],
    ['team-a', 'team-a'],
  ])('reads the cost object out of %s', (folderId, expected) => {
    expect(getCostObjectFromFolder(folderId)).toBe(expected);
  });

  test.each([['platform/'], ['platform'], [''], [undefined]])(
    'gives no cost object for the root form %s',
    (folderId) => {
      expect(getCostObjectFromFolder(folderId)).toBe('');
    },
  );
});

describe('getPolicyRecordPath', () => {
  test('puts a project record under its cost object', () => {
    expect(getPolicyRecordPath('team-cap', 'platform/team-a/')).toBe('team-a/team-cap');
  });

  test('leaves a global policy as a bare name', () => {
    expect(getPolicyRecordPath('daily-cap', 'platform/')).toBe('daily-cap');
    expect(getPolicyRecordPath('daily-cap')).toBe('daily-cap');
  });
});

describe('getCostObjectOfRecord', () => {
  test.each([
    ['platform/team-a/name', 'team-a'],
    ['team-a/name', 'team-a'],
    ['platform/a/b/name', 'a/b'],
  ])('reads the cost object out of the record path %s', (path, expected) => {
    expect(getCostObjectOfRecord(path)).toBe(expected);
  });

  test.each([['platform/name'], ['name'], [''], [undefined]])(
    'gives no cost object for the global record %s',
    (path) => {
      expect(getCostObjectOfRecord(path)).toBe('');
    },
  );
});
