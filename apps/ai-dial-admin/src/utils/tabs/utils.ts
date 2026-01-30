import { TabModel } from '@epam/ai-dial-ui-kit';

import { TabsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';

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
  Routes = 'Routes',
  Traces = 'Traces',
  Conversations = 'Conversations',
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
}

export const propertiesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Properties,
  label: t(TabsI18nKey.Properties),
});

export const featuresTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Features,
  label: t(TabsI18nKey.Features),
});

export const rolesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Roles,
  label: t(TabsI18nKey.Roles),
});

export const interceptorsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Interceptors,
  label: t(TabsI18nKey.Interceptors),
});

export const globalInterceptorsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.GlobalInterceptors,
  label: t(TabsI18nKey.GlobalInterceptors),
});

export const parametersTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Parameters,
  label: t(TabsI18nKey.Parameters),
});

export const auditTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Audit,
  label: t(TabsI18nKey.Audit),
});

export const modelsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Models,
  label: t(TabsI18nKey.Models),
});

export const dashboardTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Dashboard,
  label: t(TabsI18nKey.Dashboard),
});

export const activitiesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Activities,
  label: t(TabsI18nKey.Activities),
});

export const dependenciesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Dependencies,
  label: t(TabsI18nKey.Dependencies),
});

export const appRouteTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Routes,
  label: t(TabsI18nKey.Routes),
});

export const tracesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Traces,
  label: t(TabsI18nKey.Traces),
});

export const conversationsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Conversations,
  label: t(TabsI18nKey.Conversations),
});

export const attachmentsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Attachments,
  label: t(TabsI18nKey.Attachments),
});

export const toolsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Tools,
  label: t(TabsI18nKey.Tools),
});

export const parameterSchemaTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.ParameterSchema,
  label: t(TabsI18nKey.ParameterSchema),
});

export const entitiesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Entities,
  label: t(TabsI18nKey.Entities),
});

export const keysTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Keys,
  label: t(TabsI18nKey.Keys),
});

export const filesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Files,
  label: t(TabsI18nKey.Files),
});

export const applicationsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Applications,
  label: t(TabsI18nKey.Applications),
});

export const applicationRunnersTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.ApplicationRunners,
  label: t(TabsI18nKey.ApplicationRunners),
});

export const installationLogTab = (t: (stringToTranslate: string) => string, status?: IMAGE_STATUS) => ({
  id: EntityViewTab.InstallationLog,
  label: t(TabsI18nKey.InstallationLog),
  disabled: status === IMAGE_STATUS.NOT_BUILT,
});

export const deploymentsToolsTab = (t: (stringToTranslate: string) => string, status?: CONTAINER_STATUS) => ({
  id: EntityViewTab.Tools,
  label: t(TabsI18nKey.Tools),
  disabled: status !== CONTAINER_STATUS.RUNNING,
});

export const resourcesTab = (t: (stringToTranslate: string) => string, status?: CONTAINER_STATUS) => ({
  id: EntityViewTab.Resources,
  label: t(TabsI18nKey.Resources),
  disabled: status !== CONTAINER_STATUS.RUNNING,
});

export const promptsTab = (t: (stringToTranslate: string) => string, status?: CONTAINER_STATUS) => ({
  id: EntityViewTab.Prompts,
  label: t(TabsI18nKey.Prompts),
  disabled: status !== CONTAINER_STATUS.RUNNING,
});

export const metricsTab = (t: (stringToTranslate: string) => string, status?: CONTAINER_STATUS) => ({
  id: EntityViewTab.Metrics,
  label: t(TabsI18nKey.Metrics),
  disabled: status !== CONTAINER_STATUS.RUNNING,
});

export const executionLogTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.ExecutionLog,
  label: t(TabsI18nKey.ExecutionLog),
});

export const eventsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Events,
  label: t(TabsI18nKey.Events),
});

export const firewallTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Firewall,
  label: t(TabsI18nKey.Firewall),
});

export const relatedContainersTab = (t: (stringToTranslate: string) => string, status?: IMAGE_STATUS) => ({
  id: EntityViewTab.RelatedContainers,
  label: t(TabsI18nKey.RelatedContainers),
  disabled: status === IMAGE_STATUS.NOT_BUILT,
});

export const getViewTabs = (t: (stringToTranslate: string) => string, view: ApplicationRoute): TabModel[] => {
  if (view === ApplicationRoute.Routes) {
    return [propertiesTab(t), rolesTab(t), auditTab(t)];
  }

  const tabs: TabModel[] = [propertiesTab(t), featuresTab(t), rolesTab(t), interceptorsTab(t)];

  if (view === ApplicationRoute.Applications) {
    tabs.splice(2, 0, parametersTab(t));
    tabs.push(dependenciesTab(t));
    tabs.push(appRouteTab(t));
  }

  tabs.push(auditTab(t));

  return tabs;
};

export const getAdapterTabs = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [propertiesTab(t), modelsTab(t), auditTab(t)];
};

export const getAppRunnerTabs = (t: (stringToTranslate: string) => string): TabModel[] => {
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

export const getRouteTabs = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [propertiesTab(t), attachmentsTab(t), rolesTab(t)];
};

export const getRoleTabs = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [propertiesTab(t), entitiesTab(t), keysTab(t), auditTab(t)];
};

export const getInterceptorTabs = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [propertiesTab(t), parameterSchemaTab(t), entitiesTab(t), applicationRunnersTab(t), auditTab(t)];
};

export const getToolsetTabs = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [propertiesTab(t), toolsTab(t), rolesTab(t), auditTab(t)];
};

export const getInterceptorTemplateTabs = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [propertiesTab(t), interceptorsTab(t), auditTab(t)];
};

export const getKeyTabs = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [propertiesTab(t), rolesTab(t), auditTab(t)];
};

export const getPublicationTabs = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [propertiesTab(t), parametersTab(t), filesTab(t)];
};

export const getUsageLogTabs = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [tracesTab(t), conversationsTab(t)];
};

export const getTabsForAsset = (t: (stringToTranslate: string) => string, view: ApplicationRoute): TabModel[] => {
  if (view === ApplicationRoute.AssetsApplications) {
    return [propertiesTab(t), featuresTab(t), parametersTab(t), interceptorsTab(t), dependenciesTab(t)];
  }
  if (view === ApplicationRoute.AssetsToolsets) {
    return [propertiesTab(t), toolsTab(t)];
  }
  return [propertiesTab(t)];
};

export const getAuditTabs = (
  t: (stringToTranslate: string) => string,
  featureFlags: Record<string, boolean>,
  view: ApplicationRoute,
): TabModel[] => {
  const tabs: TabModel[] = [];

  if (featureFlags.dashboardEnabled && (view === ApplicationRoute.Models || view === ApplicationRoute.Applications)) {
    tabs.push(dashboardTab(t), tracesTab(t), conversationsTab(t));
  }

  tabs.push(activitiesTab(t));

  return tabs;
};

export const getDeploymentsViewTabs = (
  route: ApplicationRoute,
  t: (stringToTranslate: string) => string,
  status?: CONTAINER_STATUS | IMAGE_STATUS,
): TabModel[] => {
  if (route === ApplicationRoute.Images) {
    return [
      propertiesTab(t),
      firewallTab(t),
      relatedContainersTab(t, status as IMAGE_STATUS),
      installationLogTab(t, status as IMAGE_STATUS),
    ];
  } else {
    if (route === ApplicationRoute.InterceptorContainers || route === ApplicationRoute.ModelServings) {
      return [propertiesTab(t), firewallTab(t), executionLogTab(t), eventsTab(t)];
    } else {
      return [
        propertiesTab(t),
        firewallTab(t),
        deploymentsToolsTab(t, status as CONTAINER_STATUS),
        resourcesTab(t, status as CONTAINER_STATUS),
        promptsTab(t, status as CONTAINER_STATUS),
        executionLogTab(t),
        eventsTab(t),
      ];
    }
  }
};

export const getSystemPropertiesTabs = (t: (stringToTranslate: string) => string): TabModel[] => {
  return [globalInterceptorsTab(t)];
};
