import { TabModel } from '@epam/ai-dial-ui-kit';

import { ALLOW_ALL_DOMAINS } from '@/src/components/Deployments/Common/Whitelists/Whitelists';
import { TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { FeatureFlags } from '@/src/models/feature-flags';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';

export enum EntityViewTab {
  Properties = 'Properties',
  Features = 'Features',
  Parameters = 'Parameters',
  Roles = 'Roles',
  Interceptors = 'Interceptors',
  GlobalInterceptors = 'GlobalInterceptors',
  ErrorCodes = 'ErrorCodes',
  Keys = 'Keys',
  Entities = 'Entities',
  Applications = 'Applications',
  Models = 'Models',
  Audit = 'Audit',
  Activities = 'Activities',
  Dashboard = 'Dashboard',
  Dependencies = 'Dependencies',
  AppRoutes = 'AppRoutes',
  Routes = 'Routes',
  Traces = 'Traces',
  Conversations = 'Conversations',
  Conversation = 'Conversation',
  Attachments = 'Attachments',
  Tools = 'Tools',
  ParameterSchema = 'ParameterSchema',
  Files = 'Files',
  ApplicationRunners = 'ApplicationRunners',
  Images = 'Images',
  Containers = 'Containers',
  InstallationLog = 'Installation log',
  Instances = 'Instances',
  Resources = 'Resources',
  Prompts = 'Prompts',
  Metrics = 'Metrics',
  ExecutionLog = 'Execution log',
  RelatedContainers = 'Related Containers',
  Events = 'Events',
  Firewall = 'Firewall',
  TestCases = 'TestCases',
  Runs = 'Runs',
  Summary = 'Summary',
  ExtractionResult = 'ExtractionResult',
  Trends = 'Trends',
  Permissions = 'Permissions',
  Body = 'Body',
  Headers = 'Headers',
  RequestSchema = 'RequestSchema',
  ResponseSchema = 'ResponseSchema',
  Response = 'Response',
  Columns = 'Columns',
  TestSuiteMethod = 'TestSuiteMethod',
  Analytics = 'Analytics',
  Validations = 'Validations',
  MCP = 'MCP',
  Public = 'Public',
  Application = 'Application',
  InputSchema = 'InputSchema',
  OutputSchema = 'OutputSchema',
  Schema = 'Schema',
}

export const propertiesTab = (t: (key: string) => string, warning?: boolean) => ({
  id: EntityViewTab.Properties,
  label: t(TabsI18nKey.Properties),
  warning,
});

export const featuresTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Features,
  label: t(TabsI18nKey.Features),
});

export const rolesTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Roles,
  label: t(TabsI18nKey.Roles),
});

export const interceptorsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Interceptors,
  label: t(TabsI18nKey.Interceptors),
});

export const globalInterceptorsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.GlobalInterceptors,
  label: t(TabsI18nKey.GlobalInterceptors),
});

export const parametersTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Parameters,
  label: t(TabsI18nKey.Parameters),
});

export const auditTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Audit,
  label: t(TabsI18nKey.Audit),
});

export const modelsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Models,
  label: t(TabsI18nKey.Models),
});

export const dashboardTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Dashboard,
  label: t(TabsI18nKey.Dashboard),
});

export const activitiesTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Activities,
  label: t(TabsI18nKey.Activities),
});

export const dependenciesTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Dependencies,
  label: t(TabsI18nKey.Dependencies),
});

export const appRouteTab = (t: (key: string) => string) => ({
  id: EntityViewTab.AppRoutes,
  label: t(TabsI18nKey.AppRoutes),
});

export const tracesTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Traces,
  label: t(TabsI18nKey.Traces),
});

export const conversationsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Conversations,
  label: t(TabsI18nKey.Conversations),
});

export const mcpTab = (t: (key: string) => string) => ({
  id: EntityViewTab.MCP,
  label: t(TabsI18nKey.MCP),
});

export const routesTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Routes,
  label: t(TabsI18nKey.Routes),
});

export const attachmentsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Attachments,
  label: t(TabsI18nKey.Attachments),
});

export const toolsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Tools,
  label: t(TabsI18nKey.Tools),
});

export const parameterSchemaTab = (t: (key: string) => string) => ({
  id: EntityViewTab.ParameterSchema,
  label: t(TabsI18nKey.ParameterSchema),
});

export const entitiesTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Entities,
  label: t(TabsI18nKey.Entities),
});

export const keysTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Keys,
  label: t(TabsI18nKey.Keys),
});

export const filesTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Files,
  label: t(TabsI18nKey.Files),
});

export const applicationsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Applications,
  label: t(TabsI18nKey.Applications),
});

export const applicationRunnersTab = (t: (key: string) => string) => ({
  id: EntityViewTab.ApplicationRunners,
  label: t(TabsI18nKey.ApplicationRunners),
});

export const installationLogTab = (t: (key: string) => string, status?: IMAGE_STATUS) => ({
  id: EntityViewTab.InstallationLog,
  label: t(TabsI18nKey.InstallationLog),
  disabled: status === IMAGE_STATUS.NOT_BUILT,
});

export const deploymentsToolsTab = (t: (key: string) => string, status?: CONTAINER_STATUS) => ({
  id: EntityViewTab.Tools,
  label: t(TabsI18nKey.Tools),
  disabled: status !== CONTAINER_STATUS.RUNNING,
});

export const resourcesTab = (t: (key: string) => string, status?: CONTAINER_STATUS) => ({
  id: EntityViewTab.Resources,
  label: t(TabsI18nKey.Resources),
  disabled: status !== CONTAINER_STATUS.RUNNING,
});

export const promptsTab = (t: (key: string) => string, status?: CONTAINER_STATUS) => ({
  id: EntityViewTab.Prompts,
  label: t(TabsI18nKey.Prompts),
  disabled: status !== CONTAINER_STATUS.RUNNING,
});

export const metricsTab = (t: (key: string) => string, status?: CONTAINER_STATUS) => ({
  id: EntityViewTab.Metrics,
  label: t(TabsI18nKey.Metrics),
  disabled: status && status !== CONTAINER_STATUS.RUNNING,
});

export const executionLogTab = (t: (key: string) => string) => ({
  id: EntityViewTab.ExecutionLog,
  label: t(TabsI18nKey.ExecutionLog),
});

export const eventsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Events,
  label: t(TabsI18nKey.Events),
});

export const firewallTab = (t: (key: string) => string, allAllowed: boolean) => ({
  id: EntityViewTab.Firewall,
  label: t(TabsI18nKey.Firewall),
  warning: allAllowed,
});

export const relatedContainersTab = (t: (key: string) => string, status?: IMAGE_STATUS) => ({
  id: EntityViewTab.RelatedContainers,
  label: t(TabsI18nKey.RelatedContainers),
  disabled: status === IMAGE_STATUS.NOT_BUILT,
});

export const testSuiteMethodTab = (t: (key: string) => string) => ({
  id: EntityViewTab.TestSuiteMethod,
  label: t(TestSuitesI18nKey.Method),
});

export const testCasesTab = (t: (key: string) => string) => ({
  id: EntityViewTab.TestCases,
  label: t(TabsI18nKey.TestCases),
});

export const trendsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Trends,
  label: t(TabsI18nKey.Trends),
});

export const runsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Runs,
  label: t(TabsI18nKey.Runs),
});

export const summaryTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Summary,
  label: t(TabsI18nKey.Summary),
});

export const extractionResultTab = (t: (key: string) => string) => ({
  id: EntityViewTab.ExtractionResult,
  label: t(TabsI18nKey.ExtractionResult),
});

export const analyticsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Analytics,
  label: t(TabsI18nKey.Analytics),
});

export const permissionsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Permissions,
  label: t(TabsI18nKey.Permissions),
});

export const conversationTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Conversation,
  label: t(TabsI18nKey.Conversation),
});

export const bodyTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Body,
  label: t(TabsI18nKey.Body),
});

export const headersTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Headers,
  label: t(TabsI18nKey.Headers),
});

export const requestSchemaTab = (t: (key: string) => string) => ({
  id: EntityViewTab.RequestSchema,
  label: t(TabsI18nKey.RequestSchema),
});

export const responseSchemaTab = (t: (key: string) => string) => ({
  id: EntityViewTab.ResponseSchema,
  label: t(TabsI18nKey.ResponseSchema),
});

export const columnsTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Columns,
  label: t(TabsI18nKey.Columns),
});

export const inputSchemaTab = (t: (key: string) => string) => ({
  id: EntityViewTab.InputSchema,
  label: t(TabsI18nKey.InputSchema),
});

export const outputSchemaTab = (t: (key: string) => string) => ({
  id: EntityViewTab.OutputSchema,
  label: t(TabsI18nKey.OutputSchema),
});

export const responseTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Response,
  label: t(TabsI18nKey.Response),
});

export const publicTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Public,
  label: t(TabsI18nKey.Public),
});

export const applicationTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Application,
  label: t(TabsI18nKey.Application),
});

export const schemaTab = (t: (key: string) => string) => ({
  id: EntityViewTab.Schema,
  label: t(TabsI18nKey.Schema),
});

export const getRouteTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), rolesTab(t), auditTab(t)];
};

export const getApplicationTabs = (t: (key: string) => string): TabModel[] => {
  return [
    propertiesTab(t),
    featuresTab(t),
    parametersTab(t),
    dependenciesTab(t),
    appRouteTab(t),
    rolesTab(t),
    interceptorsTab(t),
    auditTab(t),
  ];
};

export const getModelsTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), featuresTab(t), rolesTab(t), interceptorsTab(t), auditTab(t)];
};

export const getAdapterTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), modelsTab(t), auditTab(t)];
};

export const getAppRunnerTabs = (t: (key: string) => string): TabModel[] => {
  return [
    propertiesTab(t),
    featuresTab(t),
    parametersTab(t),
    interceptorsTab(t),
    applicationsTab(t),
    appRouteTab(t),
    auditTab(t),
  ];
};

export const getAppRouteTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), attachmentsTab(t), rolesTab(t)];
};

export const getRoleTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), entitiesTab(t), keysTab(t), auditTab(t)];
};

export const getInterceptorTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), parameterSchemaTab(t), entitiesTab(t), applicationRunnersTab(t), auditTab(t)];
};

export const getToolsetTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), toolsTab(t), rolesTab(t), auditTab(t)];
};

export const getInterceptorTemplateTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), interceptorsTab(t), auditTab(t)];
};

export const getKeyTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), rolesTab(t), auditTab(t)];
};

export const getPublicationTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), parametersTab(t), filesTab(t)];
};

export const getUsageLogTabs = (t: (key: string) => string): TabModel[] => {
  return [tracesTab(t), conversationsTab(t), mcpTab(t), routesTab(t)];
};

export const getTabsForAsset = (
  t: (key: string) => string,
  view: ApplicationRoute,
  featureFlags?: FeatureFlags,
): TabModel[] => {
  if (view === ApplicationRoute.AssetsApplications) {
    return [propertiesTab(t), featuresTab(t), parametersTab(t), interceptorsTab(t), dependenciesTab(t)];
  }
  if (view === ApplicationRoute.AssetsToolsets) {
    const tabs = [propertiesTab(t), toolsTab(t)];
    if (featureFlags?.dashboardEnabled) {
      tabs.push(auditTab(t));
    }
    return tabs;
  }
  if (view === ApplicationRoute.Conversations) {
    return [propertiesTab(t), conversationTab(t)];
  }
  return [propertiesTab(t)];
};

export const getAuditTabs = (
  t: (key: string) => string,
  featureFlags: FeatureFlags,
  view: ApplicationRoute,
): TabModel[] => {
  const tabs: TabModel[] = [];

  if (featureFlags.dashboardEnabled) {
    if (view === ApplicationRoute.AssetsToolsets) {
      return [dashboardTab(t), tracesTab(t)];
    }

    if (view === ApplicationRoute.Models || view === ApplicationRoute.Applications) {
      tabs.push(dashboardTab(t), tracesTab(t), conversationsTab(t));
    } else if (view === ApplicationRoute.Toolsets) {
      tabs.push(dashboardTab(t), tracesTab(t));
    }
  }

  tabs.push(activitiesTab(t));

  return tabs;
};

export const getDeploymentsViewTabs = (
  route: ApplicationRoute,
  t: (key: string) => string,
  status?: CONTAINER_STATUS | IMAGE_STATUS,
  allowedWhitelist?: string[],
  propertiesWarning?: boolean,
): TabModel[] => {
  if (route === ApplicationRoute.Images) {
    return [
      propertiesTab(t),
      firewallTab(t, !!allowedWhitelist?.includes(ALLOW_ALL_DOMAINS)),
      relatedContainersTab(t, status as IMAGE_STATUS),
      installationLogTab(t, status as IMAGE_STATUS),
      auditTab(t),
    ];
  }
  if (route === ApplicationRoute.McpContainers) {
    return [
      propertiesTab(t, propertiesWarning),
      firewallTab(t, !!allowedWhitelist?.includes(ALLOW_ALL_DOMAINS)),
      deploymentsToolsTab(t, status as CONTAINER_STATUS),
      resourcesTab(t, status as CONTAINER_STATUS),
      promptsTab(t, status as CONTAINER_STATUS),
      executionLogTab(t),
      eventsTab(t),
      auditTab(t),
    ];
  }
  return [
    propertiesTab(t, propertiesWarning),
    firewallTab(t, !!allowedWhitelist?.includes(ALLOW_ALL_DOMAINS)),
    executionLogTab(t),
    eventsTab(t),
    auditTab(t),
  ];
};

export const getSystemPropertiesTabs = (t: (key: string) => string): TabModel[] => {
  return [globalInterceptorsTab(t)];
};

export const getTestSuiteTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), testSuiteMethodTab(t), testCasesTab(t), metricsTab(t), runsTab(t)];
};

export const getPublicationViewTabs = (t: (key: string) => string, view: ApplicationRoute): TabModel[] => {
  switch (view) {
    case ApplicationRoute.FilePublications:
      return getFilePublicationTabs(t);
    case ApplicationRoute.PromptPublications:
      return getPromptPublicationTabs(t);
    case ApplicationRoute.ApplicationPublications:
      return getApplicationPublicationTabs(t);
    case ApplicationRoute.ToolsetPublications:
      return getToolsetPublicationTabs(t);
    case ApplicationRoute.ConversationPublications:
      return getConversationPublicationTabs(t);
    default:
      return [];
  }
};

export const getFilePublicationTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), permissionsTab(t)];
};

export const getPromptPublicationTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), permissionsTab(t)];
};

export const getApplicationPublicationTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), parametersTab(t), permissionsTab(t), filesTab(t)];
};

export const getToolsetPublicationTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), toolsTab(t), permissionsTab(t)];
};

export const getConversationPublicationTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), conversationTab(t), filesTab(t), permissionsTab(t)];
};

export const getTestSuiteRequestTemplateTabs = (t: (key: string) => string): TabModel[] => {
  return [bodyTab(t), parametersTab(t), headersTab(t)];
};

export const getRunTabs = (t: (key: string) => string): TabModel[] => {
  return [summaryTab(t), analyticsTab(t), extractionResultTab(t)];
};

export const getDatasetTabs = (t: (key: string) => string): TabModel[] => {
  return [propertiesTab(t), schemaTab(t), testCasesTab(t)];
};

export const getEndpointSchemaTabs = (t: (key: string) => string): TabModel[] => {
  return [requestSchemaTab(t), responseSchemaTab(t), columnsTab(t)];
};

export const getMcpToolSchemaTabs = (t: (key: string) => string): TabModel[] => {
  return [columnsTab(t), inputSchemaTab(t), outputSchemaTab(t)];
};

export const getFileSelectInputTabs = (t: (key: string) => string): TabModel[] => {
  return [publicTab(t), applicationTab(t)];
};
