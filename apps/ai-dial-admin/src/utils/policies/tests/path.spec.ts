import { describe, expect, test } from 'vitest';

import {
  excludeRecordsInFolders,
  getCostObjectFolderPath,
  getCostObjectFromFolder,
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

describe('getCostObjectFolderPath', () => {
  // Core lists a folder only when the path ends with a slash; `team-a` would be read as a record name.
  test.each([
    ['team-a', 'team-a/'],
    ['team-a/', 'team-a/'],
    ['platform/team-a/', 'team-a/'],
    ['platform/team-a', 'team-a/'],
  ])('lists %s as %s', (folder, expected) => {
    expect(getCostObjectFolderPath(folder)).toBe(expected);
  });

  test.each([['platform/'], ['platform'], [''], [undefined]])('gives nothing for the root form %s', (folder) => {
    expect(getCostObjectFolderPath(folder)).toBe('');
  });
});

describe('excludeRecordsInFolders', () => {
  const records = [
    { path: 'team-a/one' },
    { path: 'platform/team-a/two' },
    { path: 'team-b/three' },
    { path: 'global' },
  ];

  test('drops the records under a deleted folder, whichever path shape they carry', () => {
    expect(excludeRecordsInFolders(records, ['team-a/'])).toEqual([{ path: 'team-b/three' }, { path: 'global' }]);
  });

  test('matches the folder with or without its slash or bucket prefix', () => {
    expect(excludeRecordsInFolders(records, ['team-a'])).toEqual(
      excludeRecordsInFolders(records, ['platform/team-a/']),
    );
  });

  test('does not mistake a folder whose name starts the same for the folder', () => {
    expect(excludeRecordsInFolders([{ path: 'team-ab/x' }], ['team-a/'])).toEqual([{ path: 'team-ab/x' }]);
  });

  test('keeps everything when no folder is deleted, and ignores the root', () => {
    expect(excludeRecordsInFolders(records, [])).toEqual(records);
    expect(excludeRecordsInFolders(records, ['platform/'])).toEqual(records);
  });
});
