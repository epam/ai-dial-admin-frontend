import { getAvailableEntities } from '@/src/components/AddEntitiesTab/AddEntitiesView.utils';
import { ButtonsI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportComponentType } from '@/src/types/export';

export const getAllAvailableDependencies = (selectedTab?: ExportComponentType): ExportComponentType[] => {
  if (selectedTab === ExportComponentType.ROLE) {
    return [ExportComponentType.ENTITIES, ExportComponentType.APPLICATION_TYPE_SCHEMA, ExportComponentType.INTERCEPTOR];
  }
  if (selectedTab === ExportComponentType.KEY) {
    return [
      ExportComponentType.ROLE,
      ExportComponentType.ENTITIES,
      ExportComponentType.APPLICATION_TYPE_SCHEMA,
      ExportComponentType.INTERCEPTOR,
    ];
  }

  if (selectedTab === ExportComponentType.MODEL) {
    return [ExportComponentType.INTERCEPTOR];
  }

  if (selectedTab === ExportComponentType.APPLICATION) {
    return [ExportComponentType.ENTITIES, ExportComponentType.APPLICATION_TYPE_SCHEMA, ExportComponentType.INTERCEPTOR];
  }

  return [];
};

export const getButtonTitle = (t: (v: string) => string, selectedTab?: ExportComponentType, full?: boolean) => {
  let entity = '';
  if (selectedTab === ExportComponentType.ENTITIES) {
    entity = t(MenuI18nKey.Entities);
  }
  if (selectedTab === ExportComponentType.ROLE) {
    entity = t(MenuI18nKey.Roles);
  }
  if (selectedTab === ExportComponentType.KEY) {
    entity = t(MenuI18nKey.Keys);
  }
  if (selectedTab === ExportComponentType.APPLICATION_TYPE_SCHEMA) {
    entity = t(MenuI18nKey.ApplicationRunners);
  }
  if (selectedTab === ExportComponentType.INTERCEPTOR) {
    entity = t(MenuI18nKey.Interceptors);
  }
  if (selectedTab === ExportComponentType.PROMPT) {
    entity = t(MenuI18nKey.Prompts);
  }
  if (selectedTab === ExportComponentType.FILE) {
    entity = t(MenuI18nKey.Files);
  }
  if (selectedTab === ExportComponentType.MODEL) {
    entity = t(MenuI18nKey.Models);
  }
  if (selectedTab === ExportComponentType.APPLICATION) {
    entity = t(MenuI18nKey.Applications);
  }
  if (selectedTab === ExportComponentType.ROUTE) {
    entity = t(MenuI18nKey.Routes);
  }

  return full ? `${t(ButtonsI18nKey.Add)} ${entity.toLowerCase()}` : entity;
};

export const getAvailableData = (
  id: string,
  tabData: Record<string, EntitiesGridData[]>,
  customExportData: Record<string, EntitiesGridData[]>,
  currentTab: string,
) => {
  let entityData = tabData[currentTab] || [];
  let existingData = customExportData[currentTab] || [];
  if (id === ExportComponentType.MODEL) {
    entityData = entityData.filter((data) => data.type === MenuI18nKey.Models);
    existingData = existingData.filter((data) => data.type === MenuI18nKey.Models);
  }
  if (id === ExportComponentType.APPLICATION) {
    entityData = entityData.filter((data) => data.type === MenuI18nKey.Applications);
    existingData = existingData.filter((data) => data.type === MenuI18nKey.Applications);
  }
  if (id === ExportComponentType.ROUTE) {
    entityData = entityData.filter((data) => data.type === MenuI18nKey.Routes);
    existingData = existingData.filter((data) => data.type === MenuI18nKey.Routes);
  }
  return getAvailableEntities(existingData, entityData);
};
