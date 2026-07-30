import { describe, expect, test } from 'vitest';

import { MENU_CONFIGURATION } from '@/src/components/Menu/menu-configuration';
import { MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';

const t = (key: string) => key;

describe('App runner asset :: tab set', () => {
  test('Should expose exactly Properties, Features, Parameters, AppRoutes and Interceptors', () => {
    const tabs = getTabsForAsset(t, ApplicationRoute.AssetsAppRunners);

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
      const tabs = getTabsForAsset(t, ApplicationRoute.AssetsAppRunners);

      expect(tabs.map((item) => item.id)).not.toContain(tab);
    },
  );
});

describe('App runner asset :: menu placement', () => {
  test('Should sit directly after Models in the Assets section', () => {
    const assets = MENU_CONFIGURATION(16, {} as never).find((group) => group.key === MenuI18nKey.Assets);
    const hrefs = assets?.items?.map((item) => item.href);

    expect(hrefs?.indexOf(ApplicationRoute.AssetsAppRunners)).toEqual(
      (hrefs?.indexOf(ApplicationRoute.AssetsModels) ?? -1) + 1,
    );
  });
});
