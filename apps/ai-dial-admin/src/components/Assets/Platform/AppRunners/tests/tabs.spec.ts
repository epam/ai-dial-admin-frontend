import { describe, expect, test } from 'vitest';

import { MENU_CONFIGURATION } from '@/src/components/Menu/menu-configuration';
import { MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';

const t = (key: string) => key;

describe('App runner asset :: tab set', () => {
  test('Should expose exactly Properties, Features, Parameters, AppRoutes and Interceptors', () => {
    const tabs = getTabsForAsset(t, ApplicationRoute.PlatformAppRunners);

    expect(tabs.map((tab) => tab.id)).toEqual([
      EntityViewTab.Properties,
      EntityViewTab.Features,
      EntityViewTab.Parameters,
      EntityViewTab.AppRoutes,
      EntityViewTab.Interceptors,
    ]);
  });

  test.each([EntityViewTab.Applications, EntityViewTab.Audit, EntityViewTab.Dependencies])(
    'Should not expose the %s tab',
    (tab) => {
      const tabs = getTabsForAsset(t, ApplicationRoute.PlatformAppRunners);

      expect(tabs.map((item) => item.id)).not.toContain(tab);
    },
  );
});
