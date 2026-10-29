import { describe, expect, test } from 'vitest';

import { MenuI18nKey } from '@/src/constants/i18n';
import { FeatureFlags } from '@/src/models/feature-flags';
import { ApplicationRoute } from '@/src/types/routes';
import { getActualMenuItems } from '@/src/utils/env/get-menu-items';

import { MENU_CONFIGURATION, MenuBadge } from '../menu-configuration';

const ICON_SIZE = 16;

const baseFlags: FeatureFlags = {
  adminApiEnabled: true,
  catalogEnabled: true,
  dashboardEnabled: true,
  deploymentsEnabled: true,
  evaluationEnabled: true,
  mcpRegistryEnabled: false,
  hfEnabled: false,
  analyticsEnabled: false,
  analyticsSessionsEnabled: false,
  analyticsUsageEnabled: false,
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

  test('omits Model Servings when hfEnabled is false', () => {
    const group = findDeploymentsGroup(baseFlags);
    const keys = group?.items.map((item) => item.key);

    expect(keys).not.toContain(MenuI18nKey.ModelServings);
  });

  test('keeps other Deployments entries regardless of Model Servings flags', () => {
    const group = findDeploymentsGroup(baseFlags);
    const keys = group?.items.map((item) => item.key);

    expect(keys).toEqual(expect.arrayContaining([MenuI18nKey.Containers, MenuI18nKey.Images]));
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

describe('MENU_CONFIGURATION — admin API gating', () => {
  const findAuditGroup = (flags: FeatureFlags) =>
    MENU_CONFIGURATION(ICON_SIZE, flags).find((group) => group.key === MenuI18nKey.Audit);

  test('hides Entities, Builders, Access Management, and Audit when adminApiEnabled is false', () => {
    const keys = groupKeys({ ...baseFlags, adminApiEnabled: false });

    expect(keys).not.toContain(MenuI18nKey.Entities);
    expect(keys).not.toContain(MenuI18nKey.Builders);
    expect(keys).not.toContain(MenuI18nKey.AccessManagement);
    expect(keys).not.toContain(MenuI18nKey.Audit);
  });

  test('hides the whole Audit group (not just Activity) when adminApiEnabled is false', () => {
    const group = findAuditGroup({ ...baseFlags, adminApiEnabled: false });

    expect(group).toBeUndefined();
  });

  test('shows Entities, Builders, Access Management, and the Activity item when adminApiEnabled is true', () => {
    const keys = groupKeys(baseFlags);
    const auditKeys = findAuditGroup(baseFlags)?.items.map((item) => item.key);

    expect(keys).toContain(MenuI18nKey.Entities);
    expect(keys).toContain(MenuI18nKey.Builders);
    expect(keys).toContain(MenuI18nKey.AccessManagement);
    expect(auditKeys).toContain(MenuI18nKey.ActivityAudit);
  });

  test('gating composes independently of Deployments and Evaluation', () => {
    const keys = groupKeys({
      ...baseFlags,
      adminApiEnabled: false,
      deploymentsEnabled: true,
      evaluationEnabled: true,
    });

    expect(keys).not.toContain(MenuI18nKey.Entities);
    expect(keys).toContain(MenuI18nKey.Deployments);
    expect(keys).toContain(MenuI18nKey.Evaluation);
  });
});

describe('MENU_CONFIGURATION — group order', () => {
  test('lists the groups in the navigation order', () => {
    const flags = {
      ...baseFlags,
      adminApiEnabled: true,
      deploymentsEnabled: true,
      evaluationEnabled: true,
      analyticsEnabled: true,
    };

    expect(groupKeys(flags)).toEqual([
      MenuI18nKey.Entities,
      MenuI18nKey.AiGateway,
      MenuI18nKey.Artifacts,
      MenuI18nKey.Builders,
      MenuI18nKey.AccessManagement,
      MenuI18nKey.Deployments,
      MenuI18nKey.Evaluation,
      MenuI18nKey.Analytics,
      MenuI18nKey.Governance,
      MenuI18nKey.Audit,
    ]);
  });

  test('no longer has the Catalog, Assets, or Approvals groups', () => {
    const keys = groupKeys(baseFlags) as string[];

    expect(keys).not.toContain('Menu.Catalog');
    expect(keys).not.toContain('Menu.Assets');
    expect(keys).not.toContain('Menu.Approvals');
  });
});

describe('MENU_CONFIGURATION — AI Gateway group', () => {
  const findGroup = (flags: FeatureFlags) =>
    MENU_CONFIGURATION(ICON_SIZE, flags).find((group) => group.key === MenuI18nKey.AiGateway);

  test('lists models, toolsets, translators, routes, applications, application runners, catalog schemas', () => {
    expect(findGroup(baseFlags)?.items.map((item) => item.key)).toEqual([
      MenuI18nKey.PlatformModels,
      MenuI18nKey.Toolsets,
      MenuI18nKey.PlatformTranslators,
      MenuI18nKey.PlatformRoutes,
      MenuI18nKey.Applications,
      MenuI18nKey.PlatformAppRunners,
      MenuI18nKey.PlatformCatalogSchemas,
    ]);
  });

  test('links Toolsets and Applications to the asset routes', () => {
    const items = findGroup(baseFlags)?.items ?? [];

    expect(items.find((item) => item.key === MenuI18nKey.Toolsets)?.href).toBe(ApplicationRoute.AssetsToolsets);
    expect(items.find((item) => item.key === MenuI18nKey.Applications)?.href).toBe(ApplicationRoute.AssetsApplications);
  });

  test('carries no badge on any item', () => {
    const items = findGroup(baseFlags)?.items ?? [];

    expect(items.every((item) => item.badge === undefined)).toBe(true);
  });
});

describe('MENU_CONFIGURATION — group badges', () => {
  const DEPRECATED_GROUPS = [
    MenuI18nKey.Entities,
    MenuI18nKey.Builders,
    MenuI18nKey.AccessManagement,
    MenuI18nKey.Audit,
  ];
  const allFlags: FeatureFlags = {
    ...baseFlags,
    analyticsEnabled: true,
    analyticsSessionsEnabled: true,
    analyticsUsageEnabled: true,
  };

  test('marks the legacy admin groups as Deprecated without tagging their items', () => {
    const groups = MENU_CONFIGURATION(ICON_SIZE, allFlags).filter((group) => DEPRECATED_GROUPS.includes(group.key));

    expect(groups.map((group) => group.key)).toEqual(DEPRECATED_GROUPS);
    expect(groups.every((group) => group.badge === MenuBadge.Deprecated)).toBe(true);
    expect(groups.every((group) => group.items.every((item) => item.badge === undefined))).toBe(true);
  });

  test('carries no badge on any other group except Analytics', () => {
    const others = MENU_CONFIGURATION(ICON_SIZE, allFlags).filter(
      (group) => !DEPRECATED_GROUPS.includes(group.key) && group.key !== MenuI18nKey.Analytics,
    );

    expect(others.length).toBeGreaterThan(0);
    expect(others.every((group) => group.badge === undefined)).toBe(true);
  });

  test('shows no Deprecated group when the admin API is disabled', () => {
    const groups = MENU_CONFIGURATION(ICON_SIZE, { ...allFlags, adminApiEnabled: false });

    expect(groups.some((group) => group.badge === MenuBadge.Deprecated)).toBe(false);
  });
});

describe('MENU_CONFIGURATION — Artifacts group', () => {
  test('lists skills, projects, files, conversations, prompts', () => {
    const group = MENU_CONFIGURATION(ICON_SIZE, baseFlags).find((item) => item.key === MenuI18nKey.Artifacts);

    expect(group?.items.map((item) => item.key)).toEqual([
      MenuI18nKey.Skills,
      MenuI18nKey.Projects,
      MenuI18nKey.Files,
      MenuI18nKey.Conversations,
      MenuI18nKey.Prompts,
    ]);
  });
});

describe('MENU_CONFIGURATION — Governance group', () => {
  const findGroup = (flags: FeatureFlags) =>
    MENU_CONFIGURATION(ICON_SIZE, flags).find((group) => group.key === MenuI18nKey.Governance);

  test('lists roles, keys, folder permissions, interceptors, then Approvals', () => {
    expect(findGroup(baseFlags)?.items.map((item) => item.key)).toEqual([
      MenuI18nKey.PlatformRoles,
      MenuI18nKey.PlatformKeys,
      MenuI18nKey.FoldersStorage,
      MenuI18nKey.PlatformInterceptors,
      MenuI18nKey.Approvals,
    ]);
  });

  test('Approvals links to the merged publications route', () => {
    const approvals = findGroup(baseFlags)?.items.find((item) => item.key === MenuI18nKey.Approvals);

    expect(approvals?.href).toBe(ApplicationRoute.Publications);
  });
});

describe('MENU_CONFIGURATION — catalog token', () => {
  const coreDirectKeys = [
    MenuI18nKey.PlatformModels,
    MenuI18nKey.PlatformTranslators,
    MenuI18nKey.PlatformRoutes,
    MenuI18nKey.PlatformAppRunners,
    MenuI18nKey.PlatformCatalogSchemas,
    MenuI18nKey.PlatformRoles,
    MenuI18nKey.PlatformKeys,
    MenuI18nKey.PlatformInterceptors,
  ];
  const allKeys = (flags: FeatureFlags) =>
    MENU_CONFIGURATION(ICON_SIZE, flags).flatMap((group) => group.items.map((item) => item.key));

  test('keeps every Core-direct item while catalog is enabled', () => {
    const keys = allKeys({ ...baseFlags, catalogEnabled: true });

    for (const key of coreDirectKeys) {
      expect(keys).toContain(key);
    }
  });

  test('drops every Core-direct item, in any group, when catalog is disabled', () => {
    const keys = allKeys({ ...baseFlags, catalogEnabled: false });

    for (const key of coreDirectKeys) {
      expect(keys).not.toContain(key);
    }
    expect(keys).toContain(MenuI18nKey.Skills);
    expect(keys).toContain(MenuI18nKey.Projects);
    expect(keys).toContain(MenuI18nKey.FoldersStorage);
    expect(keys).toContain(MenuI18nKey.Approvals);
  });
});

describe('MENU_CONFIGURATION — Analytics group', () => {
  const findAnalyticsGroup = (flags: FeatureFlags) =>
    MENU_CONFIGURATION(ICON_SIZE, flags).find((group) => group.key === MenuI18nKey.Analytics);

  test('shows the Analytics group with Tables + Pipelines + Queries + Sessions when both flags are enabled', () => {
    const group = findAnalyticsGroup({ ...baseFlags, analyticsEnabled: true, analyticsSessionsEnabled: true });

    expect(group).toBeDefined();
    expect(group?.badge).toBe(MenuBadge.Preview);
    expect(group?.items.map((item) => item.key)).toEqual([
      MenuI18nKey.Queries,
      MenuI18nKey.AnalyticsSessions,
      MenuI18nKey.Tables,
      MenuI18nKey.Pipelines,
    ]);
    expect(group?.items.map((item) => item.href)).toEqual([
      ApplicationRoute.AnalyticsQueries,
      ApplicationRoute.SessionsTrace,
      ApplicationRoute.AnalyticsTables,
      ApplicationRoute.AnalyticsPipelines,
    ]);
  });

  // The transform an evaluator used to carry is declared on the pipeline, so the pair the menu kept
  // adjacent is one object and there is no second item to order.
  test('offers no Evaluators sub-item at all', () => {
    const allItems = MENU_CONFIGURATION(ICON_SIZE, { ...baseFlags, analyticsEnabled: true }).flatMap((group) =>
      group.items.map((item) => item.href),
    );

    expect(allItems).not.toContain('/evaluators');
  });

  test('the Analytics Conversations item does not reuse the DIAL Core conversations key', () => {
    const group = findAnalyticsGroup({ ...baseFlags, analyticsEnabled: true, analyticsSessionsEnabled: true });

    expect(group?.items.map((item) => item.key)).not.toContain(MenuI18nKey.Conversations);
  });

  test('hides the Analytics group and all its sub-items when the flag is disabled', () => {
    expect(findAnalyticsGroup({ ...baseFlags, analyticsEnabled: false })).toBeUndefined();

    const allItems = MENU_CONFIGURATION(ICON_SIZE, { ...baseFlags, analyticsEnabled: false }).flatMap((group) =>
      group.items.map((item) => item.href),
    );
    expect(allItems).not.toContain(ApplicationRoute.SessionsTrace);
  });

  test('hides only the Conversations sub-item when its flag is disabled', () => {
    const group = findAnalyticsGroup({ ...baseFlags, analyticsEnabled: true, analyticsSessionsEnabled: false });

    expect(group).toBeDefined();
    expect(group?.items.map((item) => item.key)).toEqual([
      MenuI18nKey.Queries,
      MenuI18nKey.Tables,
      MenuI18nKey.Pipelines,
    ]);
    expect(group?.items.map((item) => item.href)).not.toContain(ApplicationRoute.SessionsTrace);
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

describe('MENU_CONFIGURATION — Dashboards item', () => {
  const analyticsOn: FeatureFlags = { ...baseFlags, analyticsEnabled: true, analyticsUsageEnabled: true };

  const dashboardsGroups = (flags: FeatureFlags, disabled: string[] = []) =>
    getActualMenuItems(MENU_CONFIGURATION(ICON_SIZE, flags), disabled)
      .filter((group) => group.items.some((item) => item.key === MenuI18nKey.Dashboard))
      .map((group) => group.key);

  test('is the first Analytics item, pointing at /dashboards, while the analytics page is on', () => {
    const group = MENU_CONFIGURATION(ICON_SIZE, analyticsOn).find((g) => g.key === MenuI18nKey.Analytics);

    expect(group?.items[0]).toEqual({ key: MenuI18nKey.Dashboard, href: '/dashboards' });
    expect(dashboardsGroups(analyticsOn)).toEqual([MenuI18nKey.Analytics]);
  });

  test('stays in Audit while the usage flag is off', () => {
    expect(dashboardsGroups({ ...baseFlags, analyticsEnabled: true })).toEqual([MenuI18nKey.Audit]);
  });

  // The usage flag without the analytics flag is a misconfiguration: no analytics, the telemetry item.
  test('stays in Audit while the analytics flag is off', () => {
    expect(dashboardsGroups({ ...baseFlags, analyticsUsageEnabled: true })).toEqual([MenuI18nKey.Audit]);
  });

  test('is absent from Audit when the telemetry dashboard is disabled', () => {
    expect(dashboardsGroups({ ...baseFlags, dashboardEnabled: false })).toEqual([]);
  });

  test('stays in Analytics when only the telemetry dashboard is disabled', () => {
    expect(dashboardsGroups({ ...analyticsOn, dashboardEnabled: false })).toEqual([MenuI18nKey.Analytics]);
  });

  test('sits in Analytics without the admin API', () => {
    expect(dashboardsGroups({ ...analyticsOn, adminApiEnabled: false })).toEqual([MenuI18nKey.Analytics]);
  });

  test('is absent when neither page can render', () => {
    expect(dashboardsGroups({ ...baseFlags, adminApiEnabled: false })).toEqual([]);
  });

  test('is hidden by the dashboard token in either group', () => {
    expect(dashboardsGroups(analyticsOn, ['dashboard'])).toEqual([]);
    expect(dashboardsGroups(baseFlags, ['dashboard'])).toEqual([]);
  });
});
