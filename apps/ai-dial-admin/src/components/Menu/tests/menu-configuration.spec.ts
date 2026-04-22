import { describe, expect, test } from 'vitest';

import { MenuI18nKey } from '@/src/constants/i18n';
import { FeatureFlags } from '@/src/models/feature-flags';

import { MENU_CONFIGURATION } from '../menu-configuration';

const ICON_SIZE = 16;

const baseFlags: FeatureFlags = {
  dashboardEnabled: true,
  deploymentsEnabled: true,
  evaluationEnabled: true,
  mcpRegistryEnabled: false,
  nimEnabled: false,
  hfEnabled: false,
};

const findDeploymentsGroup = (flags: FeatureFlags) =>
  MENU_CONFIGURATION(ICON_SIZE, flags).find((group) => group.key === MenuI18nKey.Deployments);

describe('MENU_CONFIGURATION — Model Servings entry gating', () => {
  test('includes Model Servings when hfEnabled is true', () => {
    const group = findDeploymentsGroup({ ...baseFlags, hfEnabled: true });
    const keys = group?.items.map((item) => item.key);

    expect(keys).toContain(MenuI18nKey.ModelServings);
  });

  test('includes Model Servings when nimEnabled is true', () => {
    const group = findDeploymentsGroup({ ...baseFlags, nimEnabled: true });
    const keys = group?.items.map((item) => item.key);

    expect(keys).toContain(MenuI18nKey.ModelServings);
  });

  test('includes Model Servings when both flags are true', () => {
    const group = findDeploymentsGroup({ ...baseFlags, hfEnabled: true, nimEnabled: true });
    const keys = group?.items.map((item) => item.key);

    expect(keys).toContain(MenuI18nKey.ModelServings);
  });

  test('omits Model Servings when both flags are false', () => {
    const group = findDeploymentsGroup(baseFlags);
    const keys = group?.items.map((item) => item.key);

    expect(keys).not.toContain(MenuI18nKey.ModelServings);
  });

  test('keeps other Deployments entries regardless of Model Servings flags', () => {
    const group = findDeploymentsGroup(baseFlags);
    const keys = group?.items.map((item) => item.key);

    expect(keys).toEqual(
      expect.arrayContaining([
        MenuI18nKey.McpContainers,
        MenuI18nKey.InterceptorContainers,
        MenuI18nKey.AdapterContainers,
        MenuI18nKey.ApplicationContainers,
        MenuI18nKey.Images,
      ]),
    );
  });
});
