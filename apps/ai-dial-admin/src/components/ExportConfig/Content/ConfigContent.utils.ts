import { fulDependenciesConfig } from '@/src/components/ExportConfig/ExportConfig.utils';
import { MenuI18nKey } from '@/src/constants/i18n';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportDependenciesConfig } from '@/src/models/export';
import { TabModel } from '@/src/models/tab';
import { ExportComponentType, ExportFormat, ExportType } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';

/**
 * Correctly remove item from EntitiesGridData based on type
 *
 * @param {EntitiesGridData[]} data - EntitiesGridData array
 * @param {EntitiesGridData} itemToDelete - item which need to remove
 * @param {string} currentTab - ExportComponentType
 * @returns {EntitiesGridData[]} - filtered EntitiesGridData array
 */
export const getDataWithoutItem = (
  data: EntitiesGridData[],
  itemToDelete: EntitiesGridData,
  currentTab: string,
): EntitiesGridData[] => {
  switch (currentTab) {
    case ApplicationRoute.ApplicationRunners:
      return data.filter((d) => (d as DialApplicationScheme).$id !== (itemToDelete as DialApplicationScheme).$id);

    case ApplicationRoute.Prompts:
    case ApplicationRoute.Files:
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
    tabs.push({ id: ExportComponentType.ENTITIES, name: t(MenuI18nKey.Entities) });
  }

  if (dependencies.roles) {
    tabs.push({ id: ExportComponentType.ROLE, name: t(MenuI18nKey.Roles) });
  }

  if (dependencies.keys) {
    tabs.push({ id: ExportComponentType.KEY, name: t(MenuI18nKey.Keys) });
  }

  if (dependencies.runners) {
    tabs.push({ id: ExportComponentType.APPLICATION_TYPE_SCHEMA, name: t(MenuI18nKey.ApplicationRunners) });
  }

  if (dependencies.interceptors) {
    tabs.push({ id: ExportComponentType.INTERCEPTOR, name: t(MenuI18nKey.Interceptors) });
  }

  // until BE implement
  if (!isCoreFormat) {
    // if (dependencies.prompts) {
    //   tabs.push({ id: ExportComponentType.PROMPT, name: t(MenuI18nKey.Prompts) });
    // }
    // if (dependencies.files) {
    //   tabs.push({ id: ExportComponentType.FILE, name: t(MenuI18nKey.Files) });
    // }
  }

  return tabs;
};
