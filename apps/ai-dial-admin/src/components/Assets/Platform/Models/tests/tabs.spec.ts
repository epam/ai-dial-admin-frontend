import { describe, expect, test } from 'vitest';

import { FeatureFlags } from '@/src/models/feature-flags';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';

const t = (key: string) => key;

const flags = (overrides: Partial<FeatureFlags> = {}): FeatureFlags => ({
  dashboardEnabled: false,
  deploymentsEnabled: false,
  evaluationEnabled: false,
  mcpRegistryEnabled: false,
  nimEnabled: false,
  hfEnabled: false,
  analyticsEnabled: false,
  analyticsConversationsEnabled: false,
  queryAssistantEnabled: false,
  ...overrides,
});

const dashboardFlags = flags({ dashboardEnabled: true });

const tabIds = (featureFlags?: FeatureFlags) =>
  getTabsForAsset(t, ApplicationRoute.PlatformModels, featureFlags).map((tab) => tab.id);

describe('Model asset :: detail view tab set', () => {
  test('Should expose exactly Properties, Features, Roles and Interceptors in order', () => {
    expect(tabIds()).toEqual([
      EntityViewTab.Properties,
      EntityViewTab.Features,
      EntityViewTab.Roles,
      EntityViewTab.Interceptors,
    ]);
  });

  test('Should append Audit as the fifth and last tab when the dashboard feature is enabled', () => {
    expect(tabIds(dashboardFlags)).toEqual([
      EntityViewTab.Properties,
      EntityViewTab.Features,
      EntityViewTab.Roles,
      EntityViewTab.Interceptors,
      EntityViewTab.Audit,
    ]);
  });

  test.each([EntityViewTab.Audit, EntityViewTab.Parameters, EntityViewTab.AppRoutes, EntityViewTab.Dependencies])(
    'Should not offer the %s tab, which has no Core counterpart for a config resource',
    (tab) => {
      expect(tabIds()).not.toContain(tab);
    },
  );

  test.each([EntityViewTab.Parameters, EntityViewTab.AppRoutes, EntityViewTab.Dependencies])(
    'Should not offer the %s tab with the dashboard feature enabled either',
    (tab) => {
      expect(tabIds(dashboardFlags)).not.toContain(tab);
    },
  );

  test.each([
    ApplicationRoute.PlatformAppRunners,
    ApplicationRoute.PlatformInterceptors,
    ApplicationRoute.PlatformRoutes,
    ApplicationRoute.PlatformKeys,
    ApplicationRoute.PlatformRoles,
  ])('Should leave the %s detail view without an Audit tab when the dashboard feature is enabled', (view) => {
    const siblingTabIds = getTabsForAsset(t, view, dashboardFlags).map((tab) => tab.id);
    expect(siblingTabIds).not.toContain(EntityViewTab.Audit);
    expect(siblingTabIds).toContain(EntityViewTab.Properties);
  });
});
