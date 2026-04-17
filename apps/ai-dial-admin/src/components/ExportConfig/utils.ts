import { ColDef, ICellRendererParams } from 'ag-grid-community';

import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import {
  DESCRIPTION_COLUMN,
  DISPLAY_NAME_COLUMN_WITH_SORT,
  DISPLAY_VERSION_COLUMN,
  NAME_COLUMN,
} from '@/src/constants/grid-columns/base-columns';
import { BASE_COLUMNS, BASE_KEYS_COLUMNS, LIST_RUNNER_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportDependenciesConfig, ExportRequestComponent } from '@/src/models/export';
import { EntityType } from '@/src/types/entity-type';
import { ExportFormat, ExportType } from '@/src/types/export';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

export const fulDependenciesConfig: ExportDependenciesConfig = {
  applications: true,
  interceptorsTemplates: true,
  models: true,
  routes: true,
  toolSets: true,
  roles: true,
  interceptors: true,
  keys: true,
  runners: true,
  adapters: true,
};

/**
 * Generate column definitions for each EntityType
 *
 * @param {string} type - EntityType
 * @param {(v: string) => string} t - translate function
 * @param {?(entity: EntitiesGridData) => void} [remove] - remove action
 * @returns {ColDef[]} - column definitions
 */
export const getActualColDefs = (
  type: string,
  t: (v: string) => string,
  remove?: (entity?: EntitiesGridData) => void,
): ColDef[] => {
  let columns: ColDef[] = [...BASE_COLUMNS];
  if (type === EntityType.MODEL) {
    columns = [DISPLAY_NAME_COLUMN_WITH_SORT, DISPLAY_VERSION_COLUMN, DESCRIPTION_COLUMN, NAME_COLUMN];
  }

  if (
    type === EntityType.ROLE ||
    type === EntityType.INTERCEPTOR ||
    type === EntityType.TOOLSET ||
    type === EntityType.ROUTE ||
    type === EntityType.INTERCEPTOR_RUNNER
  ) {
    columns = [...BASE_COLUMNS];
  }
  if (type === EntityType.KEY) {
    columns = [...BASE_KEYS_COLUMNS];
  }
  if (type === EntityType.APPLICATION_TYPE_SCHEMA) {
    columns = [...LIST_RUNNER_COLUMNS].filter((col) => col.field !== 'updatedAt');
  }
  if (type === EntityType.ADAPTER) {
    columns = [...BASE_COLUMNS];
  }

  if (remove && isEntityWithDependency(type)) {
    columns.push({
      field: 'dependencies',
      headerName: 'Dependencies',
      cellRenderer: (params: ICellRendererParams) => {
        return params.value && params.value.length ? t(ExportI18nKey.Included) : '';
      },
      tooltipValueGetter: (params) => (params.value && params.value.length ? t(ExportI18nKey.Included) : ''),
    });
  }

  const actions = [getOpenInNewTabOperation(openInNewTab)];
  if (remove) {
    actions.push(getRemoveOperation(remove));
  }

  return [...columns, ACTION_COLUMN(actions)];
};

/**
 * Filter export grid data by topics
 *
 * @param {(Record<string, EntitiesGridData[]> | undefined)} data - initial data
 * @param {string} entity - entity type
 * @param {string[]} selectedTopics - list of selected topics
 * @returns {EntitiesGridData[]} - filtered data
 */
export const getFilteredData = (
  data: Record<string, EntitiesGridData[]> | undefined,
  entity: string,
  selectedTopics?: string[],
): EntitiesGridData[] => {
  if (!selectedTopics || selectedTopics?.length === 0) {
    return data?.[entity] || [];
  } else {
    return (
      data?.[entity]?.filter((entity) =>
        selectedTopics.some((topic) => entity?.topics?.includes(topic) || entity?.descriptionKeywords?.includes(topic)),
      ) || []
    );
  }
};

/**
 * Open in new tab action for grid
 *
 * @param {EntitiesGridData} row - row related to selected entity
 */
const openInNewTab = (row?: EntitiesGridData) => {
  onOpenInNewTab(row?.route, row);
};

/**
 * Generate components for export
 *
 * @param {ExportType} selectedExportType - selected export type
 * @param {Record<string, EntitiesGridData[]>} data - EntityType data map
 * @returns {ExportRequestComponent[]} - correct component data with dependencies
 */
export const getComponents = (
  selectedExportType: ExportType,
  data: Record<string, EntitiesGridData[]>,
): ExportRequestComponent[] => {
  if (selectedExportType === ExportType.Full) {
    return [];
  }

  const components: ExportRequestComponent[] = [];

  Object.entries(data).forEach(([key, data]) => {
    data.forEach((entity) => {
      const dependencies = (entity.dependencies?.flatMap((d) => [d]) as EntityType[]) || [];
      components.push({
        dependencies,
        name: entity.$id || entity.name,
        type: getComponentKey(entity, key),
      });
    });
  });
  return components;
};

/**
 * Generate correct component key based on data type
 *
 * @param {EntitiesGridData} data - grid data
 * @param {string} key - entity key
 * @returns {string} - correct key
 */
const getComponentKey = (data: EntitiesGridData, key: string): string => {
  if (data.type === MenuI18nKey.Models) {
    return EntityType.MODEL;
  }
  if (data.type === MenuI18nKey.Applications) {
    return EntityType.APPLICATION;
  }
  if (data.type === MenuI18nKey.Routes) {
    return EntityType.ROUTE;
  }

  if (data.type === MenuI18nKey.Toolsets) {
    return EntityType.TOOLSET;
  }

  return key;
};

/**
 * Generate export types array
 *
 * @param {ExportDependenciesConfig} config - dependencies config
 * @param {ExportFormat} selectedFormat - export format
 * @param {ExportType} selectedExportType - export type
 * @returns {EntityType[]} - correct EntityType array
 */
export const getComponentTypes = (
  config: ExportDependenciesConfig,
  selectedFormat: ExportFormat,
  selectedExportType: ExportType,
): EntityType[] => {
  if (selectedExportType === ExportType.Custom) {
    return [];
  }
  const isCoreFormat = selectedFormat === ExportFormat.CORE;
  const types: EntityType[] = [];
  if (config.models) {
    types.push(EntityType.MODEL);
  }

  if (config.applications) {
    types.push(EntityType.APPLICATION);
  }

  if (config.toolSets) {
    types.push(EntityType.TOOLSET);
  }

  if (config.routes) {
    types.push(EntityType.ROUTE);
  }

  if (config.roles) {
    types.push(EntityType.ROLE);
  }

  if (config.keys) {
    types.push(EntityType.KEY);
  }

  if (config.runners) {
    types.push(EntityType.APPLICATION_TYPE_SCHEMA);
  }

  if (config.interceptors) {
    types.push(EntityType.INTERCEPTOR);
  }

  if (!isCoreFormat) {
    if (config.adapters) {
      types.push(EntityType.ADAPTER);
    }

    if (config.interceptorsTemplates) {
      types.push(EntityType.INTERCEPTOR_RUNNER);
    }
  }

  return types;
};

/**
 * Check if entity can be exported with dependencies
 *
 * @param {string} entity - EntityType
 * @returns {boolean} - true if EntityType have dependencies
 */
export const isEntityWithDependency = (entity: string): boolean => {
  return (
    entity === EntityType.MODEL ||
    entity === EntityType.APPLICATION ||
    entity === EntityType.TOOLSET ||
    entity === EntityType.ROLE ||
    entity === EntityType.KEY ||
    entity === EntityType.APPLICATION_TYPE_SCHEMA
  );
};
