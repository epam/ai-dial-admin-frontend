import { describe, expect, test } from 'vitest';

import { MenuI18nKey } from '@/src/constants/i18n';
import { FeatureFlags } from '@/src/models/feature-flags';
import { ApplicationRoute } from '@/src/types/routes';

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

  test('Skills links to the assets-skills route', () => {
    const group = findAssetsGroup(baseFlags);
    const skillsItem = group?.items.find((item) => item.key === MenuI18nKey.Skills);

    expect(skillsItem?.href).toBe(ApplicationRoute.AssetsSkills);
  });

  test('Interceptors follows App Runners', () => {
    const group = findAssetsGroup(baseFlags);
    const keys = group?.items.map((item) => item.key) || [];
    const appRunnersIndex = keys.indexOf(MenuI18nKey.AppRunners);

    expect(keys[appRunnersIndex + 1]).toBe(MenuI18nKey.AssetsInterceptors);
  });

  test('Interceptors links to the assets-interceptors route', () => {
    const group = findAssetsGroup(baseFlags);
    const interceptorsItem = group?.items.find(
      (item) => item.key === MenuI18nKey.AssetsInterceptors && item.href === ApplicationRoute.AssetsInterceptors,
    );

    expect(interceptorsItem).toBeDefined();
  });
});

describe('MENU_CONFIGURATION — Analytics group', () => {
  const findAnalyticsGroup = (flags: FeatureFlags) =>
    MENU_CONFIGURATION(ICON_SIZE, flags).find((group) => group.key === MenuI18nKey.Analytics);

  test('shows the Analytics group with Tables + Enrichment rules + Queries + Conversations when the flag is enabled', () => {
    const group = findAnalyticsGroup({ ...baseFlags, analyticsEnabled: true });

    expect(group).toBeDefined();
    expect(group?.isPreview).toBe(true);
    expect(group?.items.map((item) => item.key)).toEqual([
      MenuI18nKey.Tables,
      MenuI18nKey.EnrichmentRules,
      MenuI18nKey.Queries,
      MenuI18nKey.AnalyticsConversations,
    ]);
    expect(group?.items.map((item) => item.href)).toEqual([
      ApplicationRoute.AnalyticsTables,
      ApplicationRoute.AnalyticsEnrichmentRules,
      ApplicationRoute.AnalyticsQueries,
      ApplicationRoute.ConversationsTrace,
    ]);
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
