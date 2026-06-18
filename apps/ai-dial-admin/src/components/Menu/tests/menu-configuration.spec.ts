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
  runsCompareEnabled: false,
};

const findDeploymentsGroup = (flags: FeatureFlags) =>
  MENU_CONFIGURATION(ICON_SIZE, flags).find((group) => group.key === MenuI18nKey.Deployments);

const groupKeys = (flags: FeatureFlags) => MENU_CONFIGURATION(ICON_SIZE, flags).map((group) => group.key);

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

describe('MENU_CONFIGURATION — group visibility flags compose independently', () => {
  test('both flags enabled keeps both groups', () => {
    const keys = groupKeys({ ...baseFlags, deploymentsEnabled: true, evaluationEnabled: true });

    expect(keys).toContain(MenuI18nKey.Deployments);
    expect(keys).toContain(MenuI18nKey.Evaluation);
  });

  test('Deployments off, Evaluation on hides only Deployments', () => {
    const keys = groupKeys({ ...baseFlags, deploymentsEnabled: false, evaluationEnabled: true });

    expect(keys).not.toContain(MenuI18nKey.Deployments);
    expect(keys).toContain(MenuI18nKey.Evaluation);
  });

  test('Deployments on, Evaluation off hides only Evaluation', () => {
    const keys = groupKeys({ ...baseFlags, deploymentsEnabled: true, evaluationEnabled: false });

    expect(keys).toContain(MenuI18nKey.Deployments);
    expect(keys).not.toContain(MenuI18nKey.Evaluation);
  });

  test('both flags off hides both groups (regression — issue #3589)', () => {
    const keys = groupKeys({ ...baseFlags, deploymentsEnabled: false, evaluationEnabled: false });

    expect(keys).not.toContain(MenuI18nKey.Deployments);
    expect(keys).not.toContain(MenuI18nKey.Evaluation);
  });
});
