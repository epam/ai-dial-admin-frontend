import { TabsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';
import {
  appRouteTab,
  auditTab,
  dependenciesTab,
  featuresTab,
  getAuditTabs,
  getTabsForAsset,
  getToolsetTabs,
  getViewTabs,
  interceptorsTab,
  parametersTab,
  propertiesTab,
  getKeyTabs,
  rolesTab,
  toolsTab,
  getPublicationTabs,
  getUsageLogTabs,
  getInterceptorTemplateTabs,
  getInterceptorTabs,
  parameterSchemaTab,
  entitiesTab,
  applicationRunnersTab,
  filesTab,
  conversationsTab,
  tracesTab,
} from '../utils';

const t = vi.fn((id) => id);

describe('getViewTabs', () => {
  test('Should return tabs for models', () => {
    const res = getViewTabs(t, ApplicationRoute.Models);
    expect(res).toEqual([propertiesTab(t), featuresTab(t), rolesTab(t), interceptorsTab(t), auditTab(t)]);
  });

  test('Should return tabs for application', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications);
    expect(res).toEqual([
      propertiesTab(t),
      featuresTab(t),
      parametersTab(t),
      rolesTab(t),
      interceptorsTab(t),
      dependenciesTab(t),
      appRouteTab(t),
      auditTab(t),
    ]);
  });

  test('Should return tabs for application with editor', () => {
    const res = getViewTabs(t, ApplicationRoute.Applications);
    expect(res).toEqual([
      propertiesTab(t),
      featuresTab(t),
      parametersTab(t),
      rolesTab(t),
      interceptorsTab(t),
      dependenciesTab(t),
      appRouteTab(t),
      auditTab(t),
    ]);
  });

  test('Should return tabs for routes', () => {
    const res = getViewTabs(t, ApplicationRoute.Routes);
    expect(res).toEqual([propertiesTab(t), rolesTab(t), auditTab(t)]);
  });
});

describe('getAuditTabs', () => {
  const t = (s: string) => s;

  test('returns dashboard and activities tabs if dashboardEnabled and view is Models', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: true }, ApplicationRoute.Models);
    expect(tabs).toEqual([
      { id: 'Dashboard', name: TabsI18nKey.Dashboard },
      { id: 'Traces', name: TabsI18nKey.Traces },
      { id: 'Conversations', name: TabsI18nKey.Conversations },
      { id: 'Activities', name: TabsI18nKey.Activities },
    ]);
  });

  test('returns dashboard and activities tabs if dashboardEnabled and view is Applications', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: true }, ApplicationRoute.Applications);
    expect(tabs).toEqual([
      { id: 'Dashboard', name: TabsI18nKey.Dashboard },
      { id: 'Traces', name: TabsI18nKey.Traces },
      { id: 'Conversations', name: TabsI18nKey.Conversations },
      { id: 'Activities', name: TabsI18nKey.Activities },
    ]);
  });

  test('returns only activities tab if dashboardEnabled is false', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: false }, ApplicationRoute.Models);
    expect(tabs).toEqual([{ id: 'Activities', name: TabsI18nKey.Activities }]);
  });

  test('returns only activities tab for other views', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: true }, ApplicationRoute.Home);
    expect(tabs).toEqual([{ id: 'Activities', name: TabsI18nKey.Activities }]);
  });
});

describe('getTabsForAsset', () => {
  test('returns correct tabs for AssetsApplications', () => {
    const tabs = getTabsForAsset(t, ApplicationRoute.AssetsApplications);
    expect(tabs).toEqual([propertiesTab(t), featuresTab(t), parametersTab(t), interceptorsTab(t), dependenciesTab(t)]);
  });

  test('returns correct tabs for AssetsToolsets', () => {
    const tabs = getTabsForAsset(t, ApplicationRoute.AssetsToolsets);
    expect(tabs).toEqual([propertiesTab(t), toolsTab(t)]);
  });

  test('returns only properties tab for other routes', () => {
    const tabs = getTabsForAsset(t, ApplicationRoute.ActivityAudit);
    expect(tabs).toEqual([propertiesTab(t)]);
  });
});

describe('getToolsetTabs', () => {
  test('returns correct tabs for toolset', () => {
    const tabs = getToolsetTabs(t);
    expect(tabs).toEqual([propertiesTab(t), toolsTab(t), rolesTab(t), auditTab(t)]);
  });
});

describe('getKeyTabs', () => {
  test('returns correct tabs for key', () => {
    const tabs = getKeyTabs(t);
    expect(tabs).toEqual([propertiesTab(t), rolesTab(t), auditTab(t)]);
  });
});

describe('getPublicationTabs', () => {
  test('returns correct tabs for publication', () => {
    const tabs = getPublicationTabs(t);
    expect(tabs).toEqual([propertiesTab(t), parametersTab(t), filesTab(t)]);
  });
});

describe('getUsageLogTabs', () => {
  test('returns correct tabs for usage log', () => {
    const tabs = getUsageLogTabs(t);
    expect(tabs).toEqual([tracesTab(t), conversationsTab(t)]);
  });
});

describe('getInterceptorTemplateTabs', () => {
  test('returns correct tabs for interceptor template', () => {
    const tabs = getInterceptorTemplateTabs(t);
    expect(tabs).toEqual([propertiesTab(t), interceptorsTab(t), auditTab(t)]);
  });
});

describe('getInterceptorTabs', () => {
  test('returns correct tabs for interceptor', () => {
    const tabs = getInterceptorTabs(t);
    expect(tabs).toEqual([
      propertiesTab(t),
      parameterSchemaTab(t),
      entitiesTab(t),
      applicationRunnersTab(t),
      auditTab(t),
    ]);
  });
});
