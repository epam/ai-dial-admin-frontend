import { IconActivity } from '@tabler/icons-react';
import { describe, expect, test } from 'vitest';

import { MENU_CONFIGURATION } from '@/src/components/Menu/menu-configuration';
import { MENU_ITEM_ICONS } from '@/src/components/Menu/menu-item-icons';
import { MenuI18nKey } from '@/src/constants/i18n';
import { FeatureFlags } from '@/src/models/feature-flags';

const ALL_FLAGS: FeatureFlags = {
  adminApiEnabled: true,
  dashboardEnabled: true,
  deploymentsEnabled: true,
  evaluationEnabled: true,
  mcpRegistryEnabled: false,
  hfEnabled: false,
  analyticsEnabled: false,
  analyticsSessionsEnabled: false,
  analyticsUsageEnabled: false,
  queryAssistantEnabled: false,
  policiesEnabled: false,
  analyticsCustomDashboardsEnabled: false,
};

describe('MENU_ITEM_ICONS', () => {
  test('gives System Health the activity icon', () => {
    expect(MENU_ITEM_ICONS[MenuI18nKey.SystemHealth]).toBe(IconActivity);
  });

  test('gives every Evaluation item an icon', () => {
    const evaluation = MENU_CONFIGURATION(16, ALL_FLAGS).find((group) => group.key === MenuI18nKey.Evaluation);

    expect(evaluation?.items.every((item) => MENU_ITEM_ICONS[item.key] != null)).toBe(true);
  });
});
