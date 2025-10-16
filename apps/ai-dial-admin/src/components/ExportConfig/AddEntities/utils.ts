import { getAvailableEntities } from '@/src/components/AddEntitiesTab/utils';
import { ButtonsI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { EntityType } from '@/src/types/entity-type';

export const getButtonTitle = (t: (v: string) => string, selectedTab?: EntityType, full?: boolean) => {
  let entity = '';

  if (selectedTab === EntityType.ROLE) {
    entity = t(MenuI18nKey.Roles);
  }
  if (selectedTab === EntityType.KEY) {
    entity = t(MenuI18nKey.Keys);
  }
  if (selectedTab === EntityType.APPLICATION_TYPE_SCHEMA) {
    entity = t(MenuI18nKey.ApplicationRunners);
  }
  if (selectedTab === EntityType.INTERCEPTOR) {
    entity = t(MenuI18nKey.Interceptors);
  }
  if (selectedTab === EntityType.PROMPT) {
    entity = t(MenuI18nKey.Prompts);
  }
  if (selectedTab === EntityType.FILE) {
    entity = t(MenuI18nKey.Files);
  }
  if (selectedTab === EntityType.MODEL) {
    entity = t(MenuI18nKey.Models);
  }
  if (selectedTab === EntityType.APPLICATION) {
    entity = t(MenuI18nKey.Applications);
  }
  if (selectedTab === EntityType.ROUTE) {
    entity = t(MenuI18nKey.Routes);
  }
  if (selectedTab === EntityType.ADAPTER) {
    entity = t(MenuI18nKey.Adapters);
  }
  if (selectedTab === EntityType.TOOLSET) {
    entity = t(MenuI18nKey.Toolsets);
  }

  if (selectedTab === EntityType.INTERCEPTOR_RUNNER) {
    entity = t(MenuI18nKey.InterceptorTemplates);
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
  if (id === EntityType.MODEL) {
    entityData = entityData.filter((data) => data.type === MenuI18nKey.Models);
    existingData = existingData.filter((data) => data.type === MenuI18nKey.Models);
  }
  if (id === EntityType.APPLICATION) {
    entityData = entityData.filter((data) => data.type === MenuI18nKey.Applications);
    existingData = existingData.filter((data) => data.type === MenuI18nKey.Applications);
  }
  if (id === EntityType.ROUTE) {
    entityData = entityData.filter((data) => data.type === MenuI18nKey.Routes);
    existingData = existingData.filter((data) => data.type === MenuI18nKey.Routes);
  }

  if (id === EntityType.TOOLSET) {
    entityData = entityData.filter((data) => data.type === MenuI18nKey.Toolsets);
    existingData = existingData.filter((data) => data.type === MenuI18nKey.Toolsets);
  }
  return getAvailableEntities(existingData, entityData);
};
