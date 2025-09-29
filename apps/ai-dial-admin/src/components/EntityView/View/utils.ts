import { TabsI18nKey } from '@/src/constants/i18n';
import { TabModel } from '@/src/models/tab';
import { ApplicationRoute } from '@/src/types/routes';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialAssetApp } from '@/src/models/dial/asset-app';

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

export const dependenciesTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Dependencies,
  name: t(TabsI18nKey.Dependencies),
});

export const appRouteTab = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Routes,
  name: t(TabsI18nKey.Routes),
});

export const tracesTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Traces,
  name: t(TabsI18nKey.Traces),
});

export const conversationsTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Conversations,
  name: t(TabsI18nKey.Conversations),
});

export const attachmentsTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Attachments,
  name: t(TabsI18nKey.Attachments),
});

export const toolsTabs = (t: (stringToTranslate: string) => string) => ({
  id: EntityViewTab.Tools,
  name: t(TabsI18nKey.Tools),
});

export const getViewTabs = (
  t: (stringToTranslate: string) => string,
  view: ApplicationRoute,
  isParametersTabAvailable: boolean,
): TabModel[] => {
  if (view === ApplicationRoute.Routes) {
    return [propertiesTabs(t), rolesTabs(t), auditTabs(t)];
  }

  const tabs: TabModel[] = [propertiesTabs(t), featuresTabs(t), rolesTabs(t), interceptorsTabs(t)];

  if (view === ApplicationRoute.Applications) {
    tabs.push(dependenciesTabs(t));

    if (isParametersTabAvailable) {
      tabs.splice(2, 0, parametersTabs(t));
    }

    tabs.push(appRouteTab(t));
  }

  tabs.push(auditTabs(t));

  return tabs;
};

export const getIsParametersTabAvailable = (
  application: DialApplication | DialAssetApp,
  appRunners?: DialApplicationScheme[] | null,
) => {
  return (
    (!!application.customAppSchemaId &&
      !!appRunners?.find((s) => s.$id === application.customAppSchemaId)?.['dial:applicationTypeEditorUrl']) ||
    !!application.editorUrl ||
    (!!(application as DialAssetApp).applicationTypeSchemaId &&
      !!appRunners?.find((s) => s.$id === (application as DialAssetApp).applicationTypeSchemaId)?.[
        'dial:applicationTypeEditorUrl'
      ])
  );
};
