import { ColDef, ICellRendererParams } from 'ag-grid-community';

import { getEntityPath } from '@/src/components/EntityListView/entity-list-view';
import {
  KEY_ENTITY_COLUMNS,
  ENTITY_BASE_COLUMNS,
  RUNNERS_COLUMNS,
  SIMPLE_ENTITY_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportDependenciesConfig, ExportRequestComponent } from '@/src/models/export';
import { ExportFormat, ExportType } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getOpenInNewTabOperation, getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { EntityType } from '@/src/types/entity-type';

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
  remove?: (entity: EntitiesGridData) => void,
): ColDef[] => {
  let columns: ColDef[] = [...ENTITY_BASE_COLUMNS];
  if (type === EntityType.ENTITIES) {
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
  if (type === EntityType.ROLE || type === EntityType.INTERCEPTOR) {
    columns = [...SIMPLE_ENTITY_COLUMNS];
  }
  if (type === EntityType.KEY) {
    columns = [...KEY_ENTITY_COLUMNS];
  }
  if (type === EntityType.APPLICATION_TYPE_SCHEMA) {
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
      const dependencies =
        entity.dependencies?.flatMap((d) =>
          d === EntityType.ENTITIES ? [EntityType.APPLICATION, EntityType.MODEL, EntityType.ROUTE] : [d],
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
    return EntityType.MODEL;
  }
  if (data.type === MenuI18nKey.Applications) {
    return EntityType.APPLICATION;
  }
  if (data.type === MenuI18nKey.Routes) {
    return EntityType.ROUTE;
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
  if (config.entities) {
    types.push(...[EntityType.APPLICATION, EntityType.MODEL, EntityType.ROUTE]);
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
  // until BE implement
  if (!isCoreFormat) {
    // if (config.prompts) {
    //   types.push(EntityType.PROMPT);
    // }
    // if (config.files) {
    //   types.push(EntityType.FILE);
    // }
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
  return entity === EntityType.ENTITIES || entity === EntityType.ROLE || entity === EntityType.KEY;
};
