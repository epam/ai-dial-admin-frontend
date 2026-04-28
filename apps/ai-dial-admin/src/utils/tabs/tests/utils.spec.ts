import { TabsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test, vi } from 'vitest';
import {
  analyticsTab,
  applicationRunnersTab,
  applicationsTab,
  appRouteTab,
  attachmentsTab,
  auditTab,
  bodyTab,
  columnsTab,
  conversationsTab,
  dependenciesTab,
  deploymentsToolsTab,
  entitiesTab,
  eventsTab,
  executionLogTab,
  extractionResultTab,
  featuresTab,
  filesTab,
  firewallTab,
  getAdapterTabs,
  getApplicationPublicationTabs,
  getApplicationTabs,
  getAppRouteTabs,
  getAppRunnerTabs,
  getAuditTabs,
  getDeploymentsViewTabs,
  getEndpointSchemaTabs,
  getFilePublicationTabs,
  getFileSelectInputTabs,
  getInterceptorTabs,
  getInterceptorTemplateTabs,
  getKeyTabs,
  getMcpToolSchemaTabs,
  getModelsTabs,
  getPromptPublicationTabs,
  getPublicationTabs,
  getPublicationViewTabs,
  getRoleTabs,
  getRouteTabs,
  getRunTabs,
  getSystemPropertiesTabs,
  getTabsForAsset,
  getTestSuiteRequestTemplateTabs,
  getTestSuiteTabs,
  getToolsetPublicationTabs,
  getToolsetTabs,
  getUsageLogTabs,
  globalInterceptorsTab,
  headersTab,
  inputSchemaTab,
  installationLogTab,
  interceptorsTab,
  keysTab,
  mcpTab,
  metricsTab,
  modelsTab,
  outputSchemaTab,
  parameterSchemaTab,
  parametersTab,
  permissionsTab,
  promptsTab,
  propertiesTab,
  publicTab,
  relatedContainersTab,
  requestSchemaTab,
  responseTab,
  resourcesTab,
  responseSchemaTab,
  rolesTab,
  runsTab,
  summaryTab,
  testCasesTab,
  testSuiteMethodTab,
  toolsTab,
  tracesTab,
  trendsTab,
  applicationTab,
  routesTab,
} from '../utils';

import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';

const t = vi.fn((id) => id);

describe('Entities :: tabs', () => {
  test('Should return tabs for models', () => {
    const res = getModelsTabs(t);
    expect(res).toEqual([propertiesTab(t), featuresTab(t), rolesTab(t), interceptorsTab(t), auditTab(t)]);
  });

  test('Should return tabs for application', () => {
    const res = getApplicationTabs(t);
    expect(res).toEqual([
      propertiesTab(t),
      featuresTab(t),
      parametersTab(t),
      dependenciesTab(t),
      appRouteTab(t),
      rolesTab(t),
      interceptorsTab(t),
      auditTab(t),
    ]);
  });

  test('Should return tabs for routes', () => {
    const res = getRouteTabs(t);
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

  test('returns dashboard and traces tabs for AssetsToolsets when dashboardEnabled is true', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: true }, ApplicationRoute.AssetsToolsets);
    expect(tabs).toEqual([
      { id: 'Dashboard', label: TabsI18nKey.Dashboard },
      { id: 'Traces', label: TabsI18nKey.Traces },
    ]);
  });

  test('returns dashboard, traces and activities tabs for Toolsets when dashboardEnabled is true', () => {
    const tabs = getAuditTabs(t, { dashboardEnabled: true }, ApplicationRoute.Toolsets);
    expect(tabs).toEqual([
      { id: 'Dashboard', label: TabsI18nKey.Dashboard },
      { id: 'Traces', label: TabsI18nKey.Traces },
      { id: 'Activities', label: TabsI18nKey.Activities },
    ]);
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

  test('returns correct tabs for AssetsToolsets without dashboardEnabled', () => {
    expect(getTabsForAsset(t, ApplicationRoute.AssetsToolsets)).toEqual([propertiesTab(t), toolsTab(t)]);
  });

  test('returns correct tabs for AssetsToolsets with dashboardEnabled', () => {
    expect(getTabsForAsset(t, ApplicationRoute.AssetsToolsets, { dashboardEnabled: true })).toEqual([
      propertiesTab(t),
      toolsTab(t),
      auditTab(t),
    ]);
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
    expect(getAppRouteTabs(t)).toEqual([propertiesTab(t), attachmentsTab(t), rolesTab(t)]);
  });

  test('returns correct tabs for roles', () => {
    expect(getRoleTabs(t)).toEqual([propertiesTab(t), entitiesTab(t), keysTab(t), auditTab(t)]);
  });

  test('returns correct tabs for usage log', () => {
    expect(getUsageLogTabs(t)).toEqual([tracesTab(t), conversationsTab(t), mcpTab(t), routesTab(t)]);
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

    expect(getDeploymentsViewTabs(ApplicationRoute.Images, t, status, [])).toEqual([
      propertiesTab(t),
      firewallTab(t, false),
      relatedContainersTab(t, status),
      installationLogTab(t, status),
    ]);
  });
  test('returns correct tabs for deployment mcp containers', () => {
    const status = CONTAINER_STATUS.RUNNING;

    expect(getDeploymentsViewTabs(ApplicationRoute.McpContainers, t, status, ['*'])).toEqual([
      propertiesTab(t),
      firewallTab(t, true),
      deploymentsToolsTab(t, status),
      resourcesTab(t, status),
      promptsTab(t, status),
      executionLogTab(t),
      eventsTab(t),
    ]);
  });

  test('returns correct tabs for test suite', () => {
    expect(getTestSuiteTabs(t)).toEqual([
      propertiesTab(t),
      testSuiteMethodTab(t),
      testCasesTab(t),
      metricsTab(t),
      runsTab(t),
    ]);
  });

  test('returns correct tabs for run', () => {
    expect(getRunTabs(t)).toEqual([summaryTab(t), analyticsTab(t), extractionResultTab(t)]);
  });

  test('returns correct trends tab', () => {
    expect(trendsTab(t)).toEqual({ id: 'Trends', label: TabsI18nKey.Trends });
  });

  test('returns correct response tab', () => {
    expect(responseTab(t)).toEqual({ id: 'Response', label: TabsI18nKey.Response });
  });

  test('returns disabled tabs when statuses are not ready', () => {
    expect(installationLogTab(t, IMAGE_STATUS.NOT_BUILT)).toEqual({
      id: 'Installation log',
      label: TabsI18nKey.InstallationLog,
      disabled: true,
    });

    expect(relatedContainersTab(t, IMAGE_STATUS.NOT_BUILT)).toEqual({
      id: 'Related Containers',
      label: TabsI18nKey.RelatedContainers,
      disabled: true,
    });

    expect(deploymentsToolsTab(t, CONTAINER_STATUS.STOPPED)).toEqual({
      id: 'Tools',
      label: TabsI18nKey.Tools,
      disabled: true,
    });

    expect(resourcesTab(t, CONTAINER_STATUS.STOPPED)).toEqual({
      id: 'Resources',
      label: TabsI18nKey.Resources,
      disabled: true,
    });

    expect(promptsTab(t, CONTAINER_STATUS.STOPPED)).toEqual({
      id: 'Prompts',
      label: TabsI18nKey.Prompts,
      disabled: true,
    });

    expect(metricsTab(t, CONTAINER_STATUS.STOPPED)).toEqual({
      id: 'Metrics',
      label: TabsI18nKey.Metrics,
      disabled: true,
    });
  });

  test('returns correct tabs for model containers', () => {
    const status = CONTAINER_STATUS.RUNNING;

    expect(getDeploymentsViewTabs(ApplicationRoute.ModelServings, t, status, [])).toEqual([
      propertiesTab(t),
      firewallTab(t, false),
      executionLogTab(t),
      eventsTab(t),
    ]);
  });

  test('returns correct tabs for test suite request template', () => {
    expect(getTestSuiteRequestTemplateTabs(t)).toEqual([bodyTab(t), parametersTab(t), headersTab(t)]);
  });

  test('returns correct tabs for test suite request template', () => {
    expect(getEndpointSchemaTabs(t)).toEqual([requestSchemaTab(t), responseSchemaTab(t), columnsTab(t)]);
  });

  test('returns correct tabs for file publication', () => {
    expect(getFilePublicationTabs(t)).toEqual([propertiesTab(t), permissionsTab(t)]);
  });

  test('returns correct tabs for prompt publication', () => {
    expect(getPromptPublicationTabs(t)).toEqual([propertiesTab(t), permissionsTab(t)]);
  });

  test('returns correct tabs for application publication', () => {
    expect(getApplicationPublicationTabs(t)).toEqual([
      propertiesTab(t),
      parametersTab(t),
      permissionsTab(t),
      filesTab(t),
    ]);
  });

  test('returns correct tabs for toolset publication', () => {
    expect(getToolsetPublicationTabs(t)).toEqual([propertiesTab(t), toolsTab(t), permissionsTab(t)]);
  });

  test('returns correct tabs for publication view routes and default', () => {
    expect(getPublicationViewTabs(t, ApplicationRoute.FilePublications)).toEqual([propertiesTab(t), permissionsTab(t)]);
    expect(getPublicationViewTabs(t, ApplicationRoute.PromptPublications)).toEqual([
      propertiesTab(t),
      permissionsTab(t),
    ]);
    expect(getPublicationViewTabs(t, ApplicationRoute.ApplicationPublications)).toEqual([
      propertiesTab(t),
      parametersTab(t),
      permissionsTab(t),
      filesTab(t),
    ]);
    expect(getPublicationViewTabs(t, ApplicationRoute.ToolsetPublications)).toEqual([
      propertiesTab(t),
      toolsTab(t),
      permissionsTab(t),
    ]);
    expect(getPublicationViewTabs(t, ApplicationRoute.Home)).toEqual([]);
  });

  test('returns correct file select input tabs', () => {
    expect(getFileSelectInputTabs(t)).toEqual([publicTab(t), applicationTab(t)]);
  });
});
