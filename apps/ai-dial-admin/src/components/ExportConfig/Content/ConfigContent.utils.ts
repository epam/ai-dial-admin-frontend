import { fulDependenciesConfig } from '@/src/components/ExportConfig/ExportConfig.utils';
import { MenuI18nKey } from '@/src/constants/i18n';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportDependenciesConfig } from '@/src/models/export';
import { TabModel } from '@/src/models/tab';
import { ExportFormat, ExportType } from '@/src/types/export';
import { EntityType } from '@/src/types/entity-type';

/**
 * Correctly remove item from EntitiesGridData based on type
 *
 * @param {EntitiesGridData[]} data - EntitiesGridData array
 * @param {EntitiesGridData} itemToDelete - item which need to remove
 * @param {EntityType} currentTab - EntityType
 * @returns {EntitiesGridData[]} - filtered EntitiesGridData array
 */
export const getDataWithoutItem = (
  data: EntitiesGridData[],
  itemToDelete: EntitiesGridData,
  currentTab: EntityType,
): EntitiesGridData[] => {
  switch (currentTab) {
    case EntityType.APPLICATION_TYPE_SCHEMA:
      return data.filter((d) => (d as DialApplicationScheme).$id !== (itemToDelete as DialApplicationScheme).$id);

    case EntityType.PROMPT:
    case EntityType.FILE:
      return data.filter((d) => d.path !== itemToDelete.path);

    default:
      return data.filter((d) => d.name !== itemToDelete.name);
  }
};

/**
 * Generate tabs based on export type format
 *
 * @param {ExportType} exportType - export type
 * @param {ExportFormat} selectedFormat - export format
 * @param {ExportDependenciesConfig} config - dependencies config
 * @param {(v: string) => string} t - translate function
 * @returns {TabModel[]} - correct export grid tabs
 */
export const getActualTabs = (
  exportType: ExportType,
  selectedFormat: ExportFormat,
  config: ExportDependenciesConfig,
  t: (v: string) => string,
): TabModel[] => {
  const dependencies = exportType === ExportType.Custom ? fulDependenciesConfig : config;
  const isCoreFormat = selectedFormat === ExportFormat.CORE;
  const tabs: TabModel[] = [];
  if (dependencies.entities) {
    tabs.push({ id: EntityType.ENTITIES, name: t(MenuI18nKey.Entities) });
  }

  if (dependencies.roles) {
    tabs.push({ id: EntityType.ROLE, name: t(MenuI18nKey.Roles) });
  }

  if (dependencies.keys) {
    tabs.push({ id: EntityType.KEY, name: t(MenuI18nKey.Keys) });
  }

  if (dependencies.runners) {
    tabs.push({ id: EntityType.APPLICATION_TYPE_SCHEMA, name: t(MenuI18nKey.ApplicationRunners) });
  }

  if (dependencies.interceptors) {
    tabs.push({ id: EntityType.INTERCEPTOR, name: t(MenuI18nKey.Interceptors) });
  }

  if (!isCoreFormat) {
    if (dependencies.adapters) {
      tabs.push({ id: EntityType.ADAPTER, name: t(MenuI18nKey.Adapters) });
    }

    //todo when BE implement

    // if (dependencies.prompts) {
    //   tabs.push({ id: EntityType.PROMPT, name: t(MenuI18nKey.Prompts) });
    // }
    // if (dependencies.files) {
    //   tabs.push({ id: EntityType.FILE, name: t(MenuI18nKey.Files) });
    // }
  }

  return tabs;
};
