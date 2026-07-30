import { describe, expect, test } from 'vitest';

import { getGridActionLabels, getToolbarOptionLabels, getTreeActionLabels } from '@/src/components/Assets/utils';
import { getEmptyAsset } from '@/src/components/Assets/BaseAssetList/utils';
import { ApplicationRoute } from '@/src/types/routes';

const VIEW = ApplicationRoute.AssetsAppRunners;

/**
 * App runners are flat in Core's `platform` bucket. Any surface that offers a folder operation routes
 * into `handleCreateFolder`, which calls `createRunner` with the `getEmptyAsset` shape — no `$id` —
 * and the save fails with an id error the user has no way to act on.
 */
describe('App runner asset :: folder operations', () => {
  test('Should offer no tree actions, since the tree holds only the flat root', () => {
    expect(getTreeActionLabels(false, VIEW)).toEqual([]);
  });

  test.each(['addSibling', 'addChild', 'move', 'rename', 'managePermissions'])(
    'Should not offer %s on the tree',
    (action) => {
      expect(getTreeActionLabels(false, VIEW).map((item) => item.key)).not.toContain(action);
    },
  );

  test('Should offer no folder creation in the toolbar', () => {
    expect(getToolbarOptionLabels(VIEW, false).map((item) => item.key)).toEqual(['newItem']);
  });

  test('Should offer only delete in the grid context menu', () => {
    expect(getGridActionLabels(VIEW, false).map((item) => item.key)).toEqual(['delete']);
  });

  test('Should confirm the empty asset a folder create would send carries no id', () => {
    expect(getEmptyAsset(VIEW, 'platform/')).not.toHaveProperty('$id');
  });
});
