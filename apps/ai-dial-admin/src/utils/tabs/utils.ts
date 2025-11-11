import { TabModel } from '@epam/ai-dial-ui-kit';

import { TabsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

export enum EntityViewTab {
  Properties = 'Properties',
  Features = 'Features',
  Parameters = 'Parameters',
  Roles = 'Roles',
  Interceptors = 'Interceptors',
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
}

export const propertiesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Properties,
  name: t(TabsI18nKey.Properties),
});

export const featuresTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Features,
  name: t(TabsI18nKey.Features),
});

export const rolesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Roles,
  name: t(TabsI18nKey.Roles),
});

export const interceptorsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Interceptors,
  name: t(TabsI18nKey.Interceptors),
});

export const parametersTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Parameters,
  name: t(TabsI18nKey.Parameters),
});

export const auditTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Audit,
  name: t(TabsI18nKey.Audit),
});

export const modelsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Models,
  name: t(TabsI18nKey.Models),
});

export const dashboardTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Dashboard,
  name: t(TabsI18nKey.Dashboard),
});

export const activitiesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Activities,
  name: t(TabsI18nKey.Activities),
});

export const dependenciesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Dependencies,
  name: t(TabsI18nKey.Dependencies),
});

export const appRouteTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Routes,
  name: t(TabsI18nKey.Routes),
});

export const tracesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Traces,
  name: t(TabsI18nKey.Traces),
});

export const conversationsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Conversations,
  name: t(TabsI18nKey.Conversations),
});

export const attachmentsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Attachments,
  name: t(TabsI18nKey.Attachments),
});

export const toolsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Tools,
  name: t(TabsI18nKey.Tools),
});

export const parameterSchemaTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.ParameterSchema,
  name: t(TabsI18nKey.ParameterSchema),
});

export const entitiesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Entities,
  name: t(TabsI18nKey.Entities),
});

export const keysTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Keys,
  name: t(TabsI18nKey.Keys),
});

export const filesTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Files,
  name: t(TabsI18nKey.Files),
});

export const applicationsTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Applications,
  name: t(TabsI18nKey.Applications),
});

export const applicationRunnersTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.ApplicationRunners,
  name: t(TabsI18nKey.ApplicationRunners),
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
  return [propertiesTab(t), parametersTab(t), interceptorsTab(t), applicationsTab(t), appRouteTab(t), auditTab(t)];
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
