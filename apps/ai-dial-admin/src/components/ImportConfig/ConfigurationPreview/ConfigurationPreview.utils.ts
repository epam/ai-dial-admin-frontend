import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { isNull, startCase } from 'lodash';
import { TabModel } from '@/src/models/tab';
import { FileComponentItem, FileConfiguration } from '@/src/models/import';
import { ImportConfigurationAction } from '@/src/types/import';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import {
  ENTITY_WITH_VERSION_COLUMNS,
  KEY_ENTITY_COLUMNS,
  RUNNERS_COLUMNS,
  ENTITY_BASE_COLUMNS,
  SIMPLE_ENTITY_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import StatusCellRenderer from '@/src/components/Grid/CellRenderers/StatusCellRenderer';
import { DialAdapter } from '@/src/models/dial/adapter';
import { EntityType } from '@/src/types/entity-type';
import { getEntitiesList } from '@/src/utils/entities/get-entities-list';

const getConfigurationItems = (componentItems: FileComponentItem[], t: (v: string) => string) => {
  return componentItems?.map((componentItem) => ({
    action: t(`Import.${startCase(componentItem?.importAction)}`),
    ...componentItem?.value,
  }));
};

const setFileConfiguration = (fileConfiguration: FileConfiguration): FileConfiguration => {
  return {
    models: fileConfiguration.models || [],
    applications: fileConfiguration.applications || [],
    routes: fileConfiguration.routes || [],
    roles: fileConfiguration.roles || [],
    keys: fileConfiguration.keys || [],
    applicationRunners: fileConfiguration.applicationRunners || [],
    interceptors: fileConfiguration.interceptors || [],
    prompts: fileConfiguration.prompts || [],
    files: fileConfiguration.files || [],
  };
};

const getConfigurationTabs = (preview: Record<string, DialBaseEntity[]>, t: (v: string) => string): TabModel[] => {
  return getEntitiesList(t)
    ?.map((entityTab) => {
      const previewItem = preview[entityTab.id];

      if (previewItem && previewItem.length) {
        return {
          ...entityTab,
          name: `${entityTab.name} (${previewItem.length})`,
        };
      }
      return null;
    })
    .filter((entityTab) => !isNull(entityTab));
};

export const getConfigurationPreview = (configuration: FileConfiguration, t: (v: string) => string) => {
  const fileConfiguration = setFileConfiguration(configuration);
  const previewData: Record<string, DialBaseEntity[]> = {};

  Object.keys(fileConfiguration).forEach((configurationKey) => {
    if (fileConfiguration[configurationKey].length) {
      const configurationItems = getConfigurationItems(fileConfiguration[configurationKey], t);
      if (configurationKey === 'models') {
        previewData[EntityType.MODEL] = configurationItems;
      }

      if (configurationKey === 'applications') {
        previewData[EntityType.APPLICATION] = configurationItems;
      }

      if (configurationKey === 'routes') {
        previewData[EntityType.ROUTE] = configurationItems;
      }

      if (configurationKey === 'roles') {
        previewData[EntityType.ROLE] = configurationItems;
      }

      if (configurationKey === 'keys') {
        previewData[EntityType.KEY] = configurationItems;
      }

      if (configurationKey === 'applicationRunners') {
        previewData[EntityType.APPLICATION_TYPE_SCHEMA] = configurationItems;
      }

      if (configurationKey === 'interceptors') {
        previewData[EntityType.INTERCEPTOR] = configurationItems;
      }

      if (configurationKey === 'prompts') {
        previewData[EntityType.PROMPT] = configurationItems;
      }

      if (configurationKey === 'files') {
        previewData[EntityType.FILE] = configurationItems;
      }
    }
  });

  return { previewData, tabs: getConfigurationTabs(previewData, t) };
};

export const getActionClass = (action: string): string => {
  if (action === ImportConfigurationAction.CREATE) {
    return 'bg-accent-primary';
  }
  if (action === ImportConfigurationAction.UPDATE) {
    return 'bg-orange-400';
  }
  return 'bg-controls-disable';
};

const getComponentActionColumn = (): ColDef => {
  return {
    field: 'action',
    headerName: 'Action',
    cellRenderer: StatusCellRenderer,
    cellRendererParams: (params: ICellRendererParams) => {
      return {
        statusClass: getActionClass(params.value),
      };
    },
  };
};

export const getComponentColDefs = (type: string, adapters: DialAdapter[], t: (v: string) => string): ColDef[] => {
  if (type === EntityType.MODEL) {
    return [getComponentActionColumn(), ...ENTITY_WITH_VERSION_COLUMNS(t, adapters)];
  }

  if (type === EntityType.APPLICATION) {
    return [getComponentActionColumn(), ...ENTITY_WITH_VERSION_COLUMNS(t)];
  }

  if (type === EntityType.ROUTE || type === EntityType.ROLE || type === EntityType.INTERCEPTOR) {
    return [getComponentActionColumn(), ...SIMPLE_ENTITY_COLUMNS];
  }

  if (type === EntityType.APPLICATION_TYPE_SCHEMA) {
    return [getComponentActionColumn(), ...RUNNERS_COLUMNS];
  }

  if (type === EntityType.KEY) {
    return [getComponentActionColumn(), ...KEY_ENTITY_COLUMNS];
  }

  return [getComponentActionColumn(), ...ENTITY_BASE_COLUMNS];
};
