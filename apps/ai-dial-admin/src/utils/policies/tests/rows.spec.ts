import { describe, expect, test } from 'vitest';

import { DialFileNodeType } from '@/src/models/dial/file';
import { getItemPaths } from '@/src/utils/policies/rows';

describe('getItemPaths', () => {
  test('keeps record rows and drops cost object folder rows', () => {
    expect(
      getItemPaths([
        { path: 'daily-cap', nodeType: DialFileNodeType.ITEM },
        { path: 'team-a/', nodeType: DialFileNodeType.FOLDER },
        { path: 'team-a/team-cap', nodeType: DialFileNodeType.ITEM },
      ]),
    ).toEqual(['daily-cap', 'team-a/team-cap']);
  });

  test('gives an empty list for an empty listing and ignores rows with no node type', () => {
    expect(getItemPaths([])).toEqual([]);
    expect(getItemPaths([{ path: 'x' }])).toEqual([]);
  });
});
