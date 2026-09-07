import { describe, expect, test } from 'vitest';

import { MenuI18nKey } from '@/src/constants/i18n';
import { FeatureFlags } from '@/src/models/feature-flags';
import { ApplicationRoute } from '@/src/types/routes';
import { getActualMenuItems } from '@/src/utils/env/get-menu-items';

import { MENU_CONFIGURATION } from '../menu-configuration';

const ICON_SIZE = 16;

const baseFlags: FeatureFlags = {
  dashboardEnabled: true,
  deploymentsEnabled: true,
  evaluationEnabled: true,
  mcpRegistryEnabled: false,
  nimEnabled: false,
  hfEnabled: false,
  analyticsEnabled: false,
  queryAssistantEnabled: false,
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

describe('MENU_CONFIGURATION — Approvals group', () => {
  const findApprovalsGroup = (flags: FeatureFlags) =>
    MENU_CONFIGURATION(ICON_SIZE, flags).find((group) => group.key === MenuI18nKey.Approvals);

  test('lists publication types in order: Application, Toolset, Prompt, Conversation, File, Skill', () => {
    const group = findApprovalsGroup(baseFlags);

    expect(group?.items.map((item) => item.key)).toEqual([
      MenuI18nKey.ApplicationPublications,
      MenuI18nKey.ToolsetPublications,
      MenuI18nKey.PromptPublications,
      MenuI18nKey.ConversationPublications,
      MenuI18nKey.FilePublications,
      MenuI18nKey.SkillPublications,
    ]);
  });

  test('Skill Publications links to the skill-publications route', () => {
    const group = findApprovalsGroup(baseFlags);
    const skillItem = group?.items.find((item) => item.key === MenuI18nKey.SkillPublications);

    expect(skillItem?.href).toBe(ApplicationRoute.SkillPublications);
  });
});

describe('MENU_CONFIGURATION — Assets group', () => {
  const findAssetsGroup = (flags: FeatureFlags) =>
    MENU_CONFIGURATION(ICON_SIZE, flags).find((group) => group.key === MenuI18nKey.Assets);

  test('Skills is the last entry, immediately after Files', () => {
    const group = findAssetsGroup(baseFlags);
    const keys = group?.items.map((item) => item.key) || [];

    expect(keys[keys.length - 1]).toBe(MenuI18nKey.Skills);
    expect(keys[keys.length - 2]).toBe(MenuI18nKey.Files);
  });

  test('Skills links to the /skills route', () => {
    const group = findAssetsGroup(baseFlags);
    const skillsItem = group?.items.find((item) => item.key === MenuI18nKey.Skills);

    expect(skillsItem?.href).toBe(ApplicationRoute.Skills);
  });

  test('does not contain any platform entity items', () => {
    const group = findAssetsGroup(baseFlags);
    const keys = group?.items.map((item) => item.key) || [];

    expect(keys).not.toContain(MenuI18nKey.PlatformModels);
    expect(keys).not.toContain(MenuI18nKey.PlatformAppRunners);
    expect(keys).not.toContain(MenuI18nKey.PlatformInterceptors);
    expect(keys).not.toContain(MenuI18nKey.PlatformRoutes);
    expect(keys).not.toContain(MenuI18nKey.PlatformRoles);
    expect(keys).not.toContain(MenuI18nKey.PlatformKeys);
  });
});

describe('MENU_CONFIGURATION — Catalog group', () => {
  const findCatalogGroup = (flags: FeatureFlags) =>
    MENU_CONFIGURATION(ICON_SIZE, flags).find((group) => group.key === MenuI18nKey.Catalog);

  test('includes a group with key MenuI18nKey.Catalog under any FeatureFlags value', () => {
    const keys = groupKeys(baseFlags);

    expect(keys).toContain(MenuI18nKey.Catalog);
  });

  test('Catalog group appears after Builders and before Assets', () => {
    const keys = groupKeys(baseFlags);
    const buildersIndex = keys.indexOf(MenuI18nKey.Builders);
    const catalogIndex = keys.indexOf(MenuI18nKey.Catalog);
    const assetsIndex = keys.indexOf(MenuI18nKey.Assets);

    expect(catalogIndex).toBeGreaterThan(buildersIndex);
    expect(catalogIndex).toBeLessThan(assetsIndex);
  });

  test('Catalog group carries CatalogDescription as its descriptionKey', () => {
    const catalogGroup = findCatalogGroup(baseFlags);

    expect(catalogGroup?.descriptionKey).toBe(MenuI18nKey.CatalogDescription);
  });

  test('Catalog group has isPreview: true', () => {
    const catalogGroup = findCatalogGroup(baseFlags);

    expect(catalogGroup?.isPreview).toBe(true);
  });

  test('Catalog group contains all six platform entity items', () => {
    const catalogGroup = findCatalogGroup(baseFlags);
    const keys = catalogGroup?.items.map((item) => item.key) || [];

    expect(keys).toContain(MenuI18nKey.PlatformModels);
    expect(keys).toContain(MenuI18nKey.PlatformAppRunners);
    expect(keys).toContain(MenuI18nKey.PlatformInterceptors);
    expect(keys).toContain(MenuI18nKey.PlatformRoutes);
    expect(keys).toContain(MenuI18nKey.PlatformRoles);
    expect(keys).toContain(MenuI18nKey.PlatformKeys);
  });

  test('platform items in Catalog have no individual isPreview flag (preview is on the group)', () => {
    const catalogGroup = findCatalogGroup(baseFlags);
    const platformKeys = [
      MenuI18nKey.PlatformModels,
      MenuI18nKey.PlatformAppRunners,
      MenuI18nKey.PlatformInterceptors,
      MenuI18nKey.PlatformRoutes,
      MenuI18nKey.PlatformRoles,
      MenuI18nKey.PlatformKeys,
    ];

    for (const key of platformKeys) {
      const item = catalogGroup?.items.find((i) => i.key === key);
      expect(item?.isPreview).toBeUndefined();
    }
  });

  test('getActualMenuItems includes the Catalog group when it has platform items', () => {
    const config = MENU_CONFIGURATION(ICON_SIZE, baseFlags);
    const actual = getActualMenuItems(config, []);

    expect(actual.find((group) => group.key === MenuI18nKey.Catalog)).toBeDefined();
  });
});

describe('MENU_CONFIGURATION — Analytics group', () => {
  const findAnalyticsGroup = (flags: FeatureFlags) =>
    MENU_CONFIGURATION(ICON_SIZE, flags).find((group) => group.key === MenuI18nKey.Analytics);

  test('shows the Analytics group with Tables + Enrichment rules + Evaluators + Queries + Conversations when the flag is enabled', () => {
    const group = findAnalyticsGroup({ ...baseFlags, analyticsEnabled: true });

    expect(group).toBeDefined();
    expect(group?.isPreview).toBe(true);
    expect(group?.items.map((item) => item.key)).toEqual([
      MenuI18nKey.Tables,
      MenuI18nKey.Pipelines,
      MenuI18nKey.Evaluators,
      MenuI18nKey.Queries,
      MenuI18nKey.AnalyticsConversations,
    ]);
    expect(group?.items.map((item) => item.href)).toEqual([
      ApplicationRoute.AnalyticsTables,
      ApplicationRoute.AnalyticsPipelines,
      ApplicationRoute.AnalyticsEvaluators,
      ApplicationRoute.AnalyticsQueries,
      ApplicationRoute.ConversationsTrace,
    ]);
  });

  test('orders Evaluators directly after Enrichment rules', () => {
    const keys = findAnalyticsGroup({ ...baseFlags, analyticsEnabled: true })?.items.map((item) => item.key) ?? [];

    expect(keys.indexOf(MenuI18nKey.Evaluators)).toBe(keys.indexOf(MenuI18nKey.Pipelines) + 1);
  });

  test('hides the Evaluators sub-item when the flag is disabled', () => {
    const allItems = MENU_CONFIGURATION(ICON_SIZE, { ...baseFlags, analyticsEnabled: false }).flatMap((group) =>
      group.items.map((item) => item.href),
    );

    expect(allItems).not.toContain(ApplicationRoute.AnalyticsEvaluators);
  });

  test('the Analytics Conversations item does not reuse the DIAL Core conversations key', () => {
    const group = findAnalyticsGroup({ ...baseFlags, analyticsEnabled: true });

    expect(group?.items.map((item) => item.key)).not.toContain(MenuI18nKey.Conversations);
  });

  test('hides the Analytics group and all its sub-items when the flag is disabled', () => {
    expect(findAnalyticsGroup({ ...baseFlags, analyticsEnabled: false })).toBeUndefined();

    const allItems = MENU_CONFIGURATION(ICON_SIZE, { ...baseFlags, analyticsEnabled: false }).flatMap((group) =>
      group.items.map((item) => item.href),
    );
    expect(allItems).not.toContain(ApplicationRoute.ConversationsTrace);
  });

  test('gating composes independently of Deployments and Evaluation', () => {
    const keys = groupKeys({
      ...baseFlags,
      analyticsEnabled: true,
      deploymentsEnabled: false,
      evaluationEnabled: false,
    });

    expect(keys).toContain(MenuI18nKey.Analytics);
    expect(keys).not.toContain(MenuI18nKey.Deployments);
    expect(keys).not.toContain(MenuI18nKey.Evaluation);
  });
});
