import { fulDependenciesConfig } from '@/src/components/ExportConfig/utils';
import { MenuI18nKey } from '@/src/constants/i18n';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportDependenciesConfig } from '@/src/models/export';
import { TabModel } from '@epam/ai-dial-ui-kit';
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
  itemToDelete: EntitiesGridData | undefined,
  currentTab: EntityType,
): EntitiesGridData[] => {
  switch (currentTab) {
    case EntityType.APPLICATION_TYPE_SCHEMA:
      return data.filter((d) => (d as DialApplicationScheme).$id !== (itemToDelete as DialApplicationScheme)?.$id);

    case EntityType.PROMPT:
    case EntityType.FILE:
      return data.filter((d) => d.path !== itemToDelete?.path);

    default:
      return data.filter((d) => d.name !== itemToDelete?.name);
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
  if (dependencies.models) {
    tabs.push({ id: EntityType.MODEL, label: t(MenuI18nKey.Models) });
  }

  if (dependencies.applications) {
    tabs.push({ id: EntityType.APPLICATION, label: t(MenuI18nKey.Applications) });
  }

  if (dependencies.toolSets) {
    tabs.push({ id: EntityType.TOOLSET, label: t(MenuI18nKey.Toolsets) });
  }

  if (dependencies.interceptors) {
    tabs.push({ id: EntityType.INTERCEPTOR, label: t(MenuI18nKey.Interceptors) });
  }

  if (dependencies.routes) {
    tabs.push({ id: EntityType.ROUTE, label: t(MenuI18nKey.Routes) });
  }

  if (dependencies.runners) {
    tabs.push({ id: EntityType.APPLICATION_TYPE_SCHEMA, label: t(MenuI18nKey.ApplicationRunners) });
  }

  if (!isCoreFormat) {
    if (dependencies.adapters) {
      tabs.push({ id: EntityType.ADAPTER, label: t(MenuI18nKey.Adapters) });
    }

    if (dependencies.interceptorsTemplates) {
      tabs.push({ id: EntityType.INTERCEPTOR_RUNNER, label: t(MenuI18nKey.InterceptorTemplates) });
    }
  }

  if (dependencies.roles) {
    tabs.push({ id: EntityType.ROLE, label: t(MenuI18nKey.Roles) });
  }

  if (dependencies.keys) {
    tabs.push({ id: EntityType.KEY, label: t(MenuI18nKey.Keys) });
  }

  return tabs;
};
