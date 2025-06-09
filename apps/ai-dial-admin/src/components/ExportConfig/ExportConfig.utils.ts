import { ColDef, ICellRendererParams } from 'ag-grid-community';

import {
  ENTITY_BASE_COLUMNS,
  getEntityPath,
  KEY_ENTITY_COLUMNS,
  RUNNERS_COLUMNS,
  SIMPLE_ENTITY_COLUMNS,
} from '@/src/components/EntityListView/entity-list-view';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { BasicI18nKey, EntitiesI18nKey, ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportDependenciesConfig, ExportRequestComponent } from '@/src/models/export';
import { ExportComponentType, ExportFormat, ExportType } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/utils/entities/entity-operations';

// until BE implement
export const fulDependenciesConfig = {
  entities: true,
  roles: true,
  // files: true,
  interceptors: true,
  keys: true,
  // prompts: true,
  runners: true,
};

/**
 * Generate title key for empty grid of each ExportComponentType
 *
 * @param {?ExportComponentType} [selectedTab] - current component type
 * @returns {string} - key string for translate
 */
export const getEmptyDataTitleI18nKey = (selectedTab?: ExportComponentType): string => {
  if (selectedTab === ExportComponentType.ROLE) {
    return EntitiesI18nKey.NoRoles;
  }

  if (selectedTab === ExportComponentType.KEY) {
    return EntitiesI18nKey.NoKeys;
  }

  if (selectedTab === ExportComponentType.APPLICATION_TYPE_SCHEMA) {
    return EntitiesI18nKey.NoApplicationRunners;
  }

  if (selectedTab === ExportComponentType.INTERCEPTOR) {
    return EntitiesI18nKey.NoInterceptors;
  }

  if (selectedTab === ExportComponentType.PROMPT) {
    return EntitiesI18nKey.NoPrompts;
  }

  if (selectedTab === ExportComponentType.FILE) {
    return EntitiesI18nKey.NoFiles;
  }

  if (selectedTab === ExportComponentType.MODEL) {
    return EntitiesI18nKey.NoModels;
  }

  if (selectedTab === ExportComponentType.APPLICATION) {
    return EntitiesI18nKey.NoApplications;
  }

  if (selectedTab === ExportComponentType.ROUTE) {
    return EntitiesI18nKey.NoRoutes;
  }

  if (selectedTab === ExportComponentType.ENTITIES) {
    return EntitiesI18nKey.NoEntities;
  }

  return BasicI18nKey.NoData;
};

/**
 * Generate column definitions for each ExportComponentType
 *
 * @param {string} type - ExportComponentType
 * @param {(v: string) => string} t - translate function
 * @param {?(entity: EntitiesGridData) => void} [remove] - remove action
 * @returns {ColDef[]} - column definitions
 */
export const getActualColDefs = (
  type: string,
  t: (v: string) => string,
  remove?: (entity: EntitiesGridData) => void,
): ColDef[] => {
  let columns: ColDef[] = [...ENTITY_BASE_COLUMNS];
  if (type === ExportComponentType.ENTITIES) {
    columns = [
      {
        field: 'type',
        headerName: 'Entity type',
        valueFormatter: (params) => t(params.value),
        tooltipValueGetter: (params) => t(params.value),
      },
      ...ENTITY_BASE_COLUMNS,
    ];
  }
  if (type === ExportComponentType.ROLE || type === ExportComponentType.INTERCEPTOR) {
    columns = [...SIMPLE_ENTITY_COLUMNS];
  }
  if (type === ExportComponentType.KEY) {
    columns = [...KEY_ENTITY_COLUMNS];
  }
  if (type === ExportComponentType.APPLICATION_TYPE_SCHEMA) {
    columns = [...RUNNERS_COLUMNS];
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
 * Open in new tab action for grid
 *
 * @param {EntitiesGridData} row - row related to selected entity
 */
const openInNewTab = (row: EntitiesGridData) => {
  window.open(`${row.route}/${getEntityPath(row.route as ApplicationRoute, row)}`, '_blank');
};

/**
 * Generate components for export
 *
 * @param {ExportType} selectedExportType - selected export type
 * @param {Record<string, EntitiesGridData[]>} data - ExportComponentType data map
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
      const dependencies =
        entity.dependencies?.flatMap((d) =>
          d === ExportComponentType.ENTITIES
            ? [ExportComponentType.APPLICATION, ExportComponentType.MODEL, ExportComponentType.ROUTE]
            : [d],
        ) || [];
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
    return ExportComponentType.MODEL;
  }
  if (data.type === MenuI18nKey.Applications) {
    return ExportComponentType.APPLICATION;
  }
  if (data.type === MenuI18nKey.Routes) {
    return ExportComponentType.ROUTE;
  }

  return key;
};

/**
 * Generate export types array
 *
 * @param {ExportDependenciesConfig} config - dependencies config
 * @param {ExportFormat} selectedFormat - export format
 * @param {ExportType} selectedExportType - export type
 * @returns {ExportComponentType[]} - correct ExportComponentType array
 */
export const getComponentTypes = (
  config: ExportDependenciesConfig,
  selectedFormat: ExportFormat,
  selectedExportType: ExportType,
): ExportComponentType[] => {
  if (selectedExportType === ExportType.Custom) {
    return [];
  }
  const isCoreFormat = selectedFormat === ExportFormat.CORE;
  const types: ExportComponentType[] = [];
  if (config.entities) {
    types.push(...[ExportComponentType.APPLICATION, ExportComponentType.MODEL, ExportComponentType.ROUTE]);
  }

  if (config.roles) {
    types.push(ExportComponentType.ROLE);
  }

  if (config.keys) {
    types.push(ExportComponentType.KEY);
  }

  if (config.runners) {
    types.push(ExportComponentType.APPLICATION_TYPE_SCHEMA);
  }

  if (config.interceptors) {
    types.push(ExportComponentType.INTERCEPTOR);
  }
  // until BE implement
  if (!isCoreFormat) {
    // if (config.prompts) {
    //   types.push(ExportComponentType.PROMPT);
    // }
    // if (config.files) {
    //   types.push(ExportComponentType.FILE);
    // }
  }

  return types;
};

/**
 * Check if entity can be exported with dependencies
 *
 * @param {string} entity - ExportComponentType
 * @returns {boolean} - true if ExportComponentType have dependencies
 */
export const isEntityWithDependency = (entity: string): boolean => {
  return (
    entity === ExportComponentType.ENTITIES || entity === ExportComponentType.ROLE || entity === ExportComponentType.KEY
  );
};
