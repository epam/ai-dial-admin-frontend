import { describe, expect, test } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';

const t = (key: string) => key;
const tabIds = () => getTabsForAsset(t, ApplicationRoute.AssetsModels).map((tab) => tab.id);

describe('Model asset :: detail view tab set', () => {
  test('Should expose exactly Properties, Features, Roles and Interceptors in order', () => {
    expect(tabIds()).toEqual([
      EntityViewTab.Properties,
      EntityViewTab.Features,
      EntityViewTab.Roles,
      EntityViewTab.Interceptors,
    ]);
  });

  test.each([EntityViewTab.Audit, EntityViewTab.Parameters, EntityViewTab.AppRoutes, EntityViewTab.Dependencies])(
    'Should not offer the %s tab, which has no Core counterpart for a config resource',
    (tab) => {
      expect(tabIds()).not.toContain(tab);
    },
  );
});
