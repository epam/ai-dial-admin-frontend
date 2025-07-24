import { TabsI18nKey } from '@/src/constants/i18n';
import { TabModel } from '@/src/models/tab';
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
}

export const propertiesTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Properties,
  name: t(TabsI18nKey.Properties),
});

export const featuresTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Features,
  name: t(TabsI18nKey.Features),
});

export const rolesTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Roles,
  name: t(TabsI18nKey.Roles),
});

export const interceptorsTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Interceptors,
  name: t(TabsI18nKey.Interceptors),
});

export const parametersTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Parameters,
  name: t(TabsI18nKey.Parameters),
});

export const auditTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Audit,
  name: t(TabsI18nKey.Audit),
});

export const modelsTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Models,
  name: t(TabsI18nKey.Models),
});

export const dashboardTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Dashboard,
  name: t(TabsI18nKey.Dashboard),
});

export const activitiesTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Activities,
  name: t(TabsI18nKey.Activities),
});

export const getViewTabs = (
  t: (stringToTranslate: string) => string,
  view: ApplicationRoute,
  isParametersTabAvailable: boolean,
): TabModel[] => {
  if (view === ApplicationRoute.Addons || view === ApplicationRoute.Assistants || view === ApplicationRoute.Routes) {
    return [propertiesTabs(t), rolesTabs(t)];
  }

  const tabs: TabModel[] = [propertiesTabs(t), featuresTabs(t), rolesTabs(t), interceptorsTabs(t)];

  if (view === ApplicationRoute.Applications && isParametersTabAvailable) {
    tabs.splice(2, 0, parametersTabs(t));
  }

  tabs.push(auditTabs(t));

  return tabs;
};
