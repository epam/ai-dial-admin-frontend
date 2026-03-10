import { getAvailableEntities } from '@/src/components/AddEntitiesTab/utils';
import { ButtonsI18nKey, ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { EntityType } from '@/src/types/entity-type';
import { DEPLOYMENT_IMAGE_DEP } from '@/src/utils/entities/get-export-deps';

const entityTypeToMenuKey: Record<string, string> = {
  [EntityType.ROLE]: MenuI18nKey.Roles,
  [EntityType.KEY]: MenuI18nKey.Keys,
  [EntityType.APPLICATION_TYPE_SCHEMA]: MenuI18nKey.ApplicationRunners,
  [EntityType.INTERCEPTOR]: MenuI18nKey.Interceptors,
  [EntityType.PROMPT]: MenuI18nKey.Prompts,
  [EntityType.FILE]: MenuI18nKey.Files,
  [EntityType.MODEL]: MenuI18nKey.Models,
  [EntityType.APPLICATION]: MenuI18nKey.Applications,
  [EntityType.ROUTE]: MenuI18nKey.Routes,
  [EntityType.ADAPTER]: MenuI18nKey.Adapters,
  [EntityType.TOOLSET]: MenuI18nKey.Toolsets,
  [EntityType.INTERCEPTOR_RUNNER]: MenuI18nKey.InterceptorTemplates,
  [DeploymentExportEntityType.MODEL_SERVING]: MenuI18nKey.ModelServings,
  [DeploymentExportEntityType.MCP_CONTAINER]: MenuI18nKey.McpContainers,
  [DeploymentExportEntityType.INTERCEPTOR_CONTAINER]: MenuI18nKey.InterceptorContainers,
  [DeploymentExportEntityType.ADAPTER_CONTAINER]: MenuI18nKey.AdapterContainers,
  [DeploymentExportEntityType.IMAGE]: MenuI18nKey.Images,
  [DEPLOYMENT_IMAGE_DEP.MCP]: ExportI18nKey.McpImage,
  [DEPLOYMENT_IMAGE_DEP.INTERCEPTOR]: ExportI18nKey.InterceptorImage,
  [DEPLOYMENT_IMAGE_DEP.ADAPTER]: ExportI18nKey.AdapterImage,
};

export const getButtonTitle = (t: (v: string) => string, selectedTab?: EntityType, full?: boolean) => {
  const menuKey = selectedTab ? entityTypeToMenuKey[selectedTab] : undefined;
  const entity = menuKey ? t(menuKey) : '';
  return full ? `${t(ButtonsI18nKey.Add)} ${entity}` : entity;
};

export const getAvailableData = (
  id: string,
  tabData: Record<string, EntitiesGridData[]>,
  customExportData: Record<string, EntitiesGridData[]>,
  currentTab: string,
  selectedTopics: string[],
) => {
  let entityData = tabData[currentTab] || [];
  let existingData = customExportData[currentTab] || [];

  const menuKey = entityTypeToMenuKey[id];
  if (menuKey) {
    entityData = entityData.filter(
      (data) =>
        data.type === menuKey && isEntityWithTopicsMatches(selectedTopics, data?.topics || data?.descriptionKeywords),
    );
    existingData = existingData.filter((data) => data.type === menuKey);
  }

  return getAvailableEntities(existingData, entityData);
};

const isEntityWithTopicsMatches = (selectedTopics?: string[], entityTopics?: string[]) =>
  selectedTopics?.length ? selectedTopics?.some((topic) => entityTopics?.includes(topic)) : true;
