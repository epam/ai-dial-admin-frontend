import { TabsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';
import {
  applicationRunnersTab,
  applicationsTab,
  appRouteTab,
  attachmentsTab,
  auditTab,
  conversationsTab,
  dependenciesTab,
  deploymentsToolsTab,
  entitiesTab,
  eventsTab,
  executionLogTab,
  featuresTab,
  filesTab,
  firewallTab,
  getAdapterTabs,
  getAppRunnerTabs,
  getAuditTabs,
  getDeploymentsViewTabs,
  getInterceptorTabs,
  getInterceptorTemplateTabs,
  getKeyTabs,
  getPublicationTabs,
  getRoleTabs,
  getRouteTabs,
  getSystemPropertiesTabs,
  getTabsForAsset,
  getToolsetTabs,
  getUsageLogTabs,
  getViewTabs,
  globalInterceptorsTab,
  interceptorsTab,
  installationLogTab,
  keysTab,
  modelsTab,
  parameterSchemaTab,
  parametersTab,
  promptsTab,
  propertiesTab,
  relatedContainersTab,
  resourcesTab,
  rolesTab,
  toolsTab,
  tracesTab,
} from '../utils';

import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';

const t = vi.fn((id) => id);

describe('Entities :: tabs', () => {
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

  test('returns dashboard and activities tabs if dashboardEnabled and view is Models', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: true }, ApplicationRoute.Models);
    expect(tabs).toEqual([
      { id: 'Dashboard', label: TabsI18nKey.Dashboard },
      { id: 'Traces', label: TabsI18nKey.Traces },
      { id: 'Conversations', label: TabsI18nKey.Conversations },
      { id: 'Activities', label: TabsI18nKey.Activities },
    ]);
  });

  test('returns dashboard and activities tabs if dashboardEnabled and view is Applications', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: true }, ApplicationRoute.Applications);
    expect(tabs).toEqual([
      { id: 'Dashboard', label: TabsI18nKey.Dashboard },
      { id: 'Traces', label: TabsI18nKey.Traces },
      { id: 'Conversations', label: TabsI18nKey.Conversations },
      { id: 'Activities', label: TabsI18nKey.Activities },
    ]);
  });

  test('returns only activities tab if dashboardEnabled is false', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: false }, ApplicationRoute.Models);
    expect(tabs).toEqual([{ id: 'Activities', label: TabsI18nKey.Activities }]);
  });

  test('returns only activities tab for other views', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: true }, ApplicationRoute.Home);
    expect(tabs).toEqual([{ id: 'Activities', label: TabsI18nKey.Activities }]);
  });
  test('returns correct tabs for AssetsApplications', () => {
    expect(getTabsForAsset(t, ApplicationRoute.AssetsApplications)).toEqual([
      propertiesTab(t),
      featuresTab(t),
      parametersTab(t),
      interceptorsTab(t),
      dependenciesTab(t),
    ]);
  });

  test('returns correct tabs for AssetsToolsets', () => {
    expect(getTabsForAsset(t, ApplicationRoute.AssetsToolsets)).toEqual([propertiesTab(t), toolsTab(t)]);
  });

  test('returns correct tabs for toolset', () => {
    const tabs = getTabsForAsset(t, ApplicationRoute.ActivityAudit);
    expect(tabs).toEqual([propertiesTab(t)]);
  });

  test('returns correct tabs for key', () => {
    expect(getKeyTabs(t)).toEqual([propertiesTab(t), rolesTab(t), auditTab(t)]);
  });

  test('returns correct tabs for publication', () => {
    expect(getPublicationTabs(t)).toEqual([propertiesTab(t), parametersTab(t), filesTab(t)]);
  });

  test('returns correct tabs for routes', () => {
    expect(getRouteTabs(t)).toEqual([propertiesTab(t), attachmentsTab(t), rolesTab(t)]);
  });

  test('returns correct tabs for roles', () => {
    expect(getRoleTabs(t)).toEqual([propertiesTab(t), entitiesTab(t), keysTab(t), auditTab(t)]);
  });

  test('returns correct tabs for usage log', () => {
    expect(getUsageLogTabs(t)).toEqual([tracesTab(t), conversationsTab(t)]);
  });

  test('returns correct tabs for interceptor template', () => {
    expect(getInterceptorTemplateTabs(t)).toEqual([propertiesTab(t), interceptorsTab(t), auditTab(t)]);
  });

  test('returns correct tabs for toolsets', () => {
    expect(getToolsetTabs(t)).toEqual([propertiesTab(t), toolsTab(t), rolesTab(t), auditTab(t)]);
  });

  test('returns correct tabs for adapter', () => {
    expect(getAdapterTabs(t)).toEqual([propertiesTab(t), modelsTab(t), auditTab(t)]);
  });

  test('returns correct tabs for app runner', () => {
    expect(getAppRunnerTabs(t)).toEqual([
      propertiesTab(t),
      featuresTab(t),
      parametersTab(t),
      interceptorsTab(t),
      applicationsTab(t),
      appRouteTab(t),
      auditTab(t),
    ]);
  });

  test('returns correct tabs for system properties', () => {
    expect(getSystemPropertiesTabs(t)).toEqual([globalInterceptorsTab(t)]);
  });

  test('returns correct tabs for interceptor', () => {
    expect(getInterceptorTabs(t)).toEqual([
      propertiesTab(t),
      parameterSchemaTab(t),
      entitiesTab(t),
      applicationRunnersTab(t),
      auditTab(t),
    ]);
  });

  test('returns correct tabs for deployment images', () => {
    const status = IMAGE_STATUS.BUILT;

    expect(getDeploymentsViewTabs(ApplicationRoute.Images, t, status)).toEqual([
      propertiesTab(t),
      firewallTab(t),
      relatedContainersTab(t, status),
      installationLogTab(t, status),
    ]);
  });
  test('returns correct tabs for deployment mcp containers', () => {
    const status = CONTAINER_STATUS.RUNNING;

    expect(getDeploymentsViewTabs(ApplicationRoute.McpContainers, t, status)).toEqual([
      propertiesTab(t),
      firewallTab(t),
      deploymentsToolsTab(t, status),
      resourcesTab(t, status),
      promptsTab(t, status),
      executionLogTab(t),
      eventsTab(t),
    ]);
  });

  test('returns correct tabs for model containers', () => {
    const status = CONTAINER_STATUS.RUNNING;

    expect(getDeploymentsViewTabs(ApplicationRoute.ModelServings, t, status)).toEqual([
      propertiesTab(t),
      firewallTab(t),
      executionLogTab(t),
      eventsTab(t),
    ]);
  });
});
