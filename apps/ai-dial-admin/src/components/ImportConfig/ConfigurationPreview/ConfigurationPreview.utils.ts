import { TabModel } from '@epam/ai-dial-ui-kit';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { isNull, startCase } from 'lodash';

import StatusCellRenderer from '@/src/components/Grid/CellRenderers/StatusCellRenderer';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getCompareChangesOperation } from '@/src/constants/grid-columns/actions';
import {
  APPLICATIONS_COLUMNS,
  KEYS_COLUMNS,
  LIST_RUNNER_COLUMNS,
  MODELS_COLUMNS,
  BASE_COLUMNS,
} from '@/src/constants/grid-columns/grid-columns';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity, ChatEntity } from '@/src/models/dial/base-entity';
import { FileComponentItem, FileConfiguration } from '@/src/models/import';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { EntityType } from '@/src/types/entity-type';
import { ImportConfigurationAction } from '@/src/types/import';
import { getEntitiesList } from '@/src/utils/entities/get-entities-list';

const getConfigurationItems = (componentItems: FileComponentItem[], t: (v: string) => string) => {
  return componentItems?.map((componentItem) => ({
    action: t(`Import.${startCase(componentItem?.importAction)}`),
    ...componentItem?.next,
  }));
};

const getPrevItems = (componentItems: FileComponentItem[]) => {
  return componentItems?.map((componentItem) => componentItem?.prev).filter(Boolean);
};

const getConfigurationTabs = (preview: Record<string, BaseEntity[]>, t: (v: string) => string): TabModel[] => {
  return getEntitiesList(t)
    ?.map((entityTab) => {
      const previewItem = preview[entityTab.id];

      if (previewItem && previewItem.length) {
        return {
          ...entityTab,
          label: `${entityTab.name} (${previewItem.length})`,
        };
      }
      return null;
    })
    .filter((entityTab) => !isNull(entityTab));
};

export const getConfigurationPreview = (configuration: FileConfiguration, t: (v: string) => string) => {
  const previewData: Record<string, BaseEntity[]> = {};
  const prevData: Record<string, (BaseEntity | undefined)[]> = {};

  Object.keys(configuration).forEach((configurationKey) => {
    if (configuration[configurationKey]) {
      const configurationItems = getConfigurationItems(configuration[configurationKey], t);
      const prevItems = getPrevItems(configuration[configurationKey]);

      if (configurationKey === 'models') {
        previewData[EntityType.MODEL] = configurationItems;
        prevData[EntityType.MODEL] = prevItems;
      }

      if (configurationKey === 'adapters') {
        previewData[EntityType.ADAPTER] = configurationItems;
        prevData[EntityType.ADAPTER] = prevItems;
      }

      if (configurationKey === 'applications') {
        previewData[EntityType.APPLICATION] = configurationItems;
        prevData[EntityType.APPLICATION] = prevItems;
      }

      if (configurationKey === 'routes') {
        previewData[EntityType.ROUTE] = configurationItems;
        prevData[EntityType.ROUTE] = prevItems;
      }

      if (configurationKey === 'roles') {
        previewData[EntityType.ROLE] = configurationItems;
        prevData[EntityType.ROLE] = prevItems;
      }

      if (configurationKey === 'keys') {
        previewData[EntityType.KEY] = configurationItems;
        prevData[EntityType.KEY] = prevItems;
      }

      if (configurationKey === 'applicationRunners') {
        previewData[EntityType.APPLICATION_TYPE_SCHEMA] = configurationItems;
        prevData[EntityType.APPLICATION_TYPE_SCHEMA] = prevItems;
      }

      if (configurationKey === 'interceptors') {
        previewData[EntityType.INTERCEPTOR] = configurationItems;
        prevData[EntityType.INTERCEPTOR] = prevItems;
      }

      if (configurationKey === 'prompts') {
        previewData[EntityType.PROMPT] = configurationItems;
        prevData[EntityType.PROMPT] = prevItems;
      }

      if (configurationKey === 'files') {
        previewData[EntityType.FILE] = configurationItems;
        prevData[EntityType.FILE] = prevItems;
      }

      if (configurationKey === 'toolSets') {
        previewData[EntityType.TOOLSET] = configurationItems;
        prevData[EntityType.TOOLSET] = prevItems;
      }
    }
  });

  return { previewData, prevData, tabs: getConfigurationTabs(previewData, t) };
};

export const getActionClassName = (action: string): string => {
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
        statusClassName: getActionClassName(params.value),
      };
    },
  };
};

export const getComponentColDefs = (
  type: string,
  t: (v: string) => string,
  compare: (entity?: BaseEntity) => void,
): ColDef[] => {
  const actionColumn = ACTION_COLUMN([getCompareChangesOperation(compare)]);
  if (type === EntityType.MODEL) {
    return [getComponentActionColumn(), ...MODELS_COLUMNS(t), actionColumn];
  }

  if (type === EntityType.APPLICATION) {
    return [getComponentActionColumn(), ...APPLICATIONS_COLUMNS(t), actionColumn];
  }

  if (type === EntityType.APPLICATION_TYPE_SCHEMA) {
    return [getComponentActionColumn(), ...LIST_RUNNER_COLUMNS, actionColumn];
  }

  if (type === EntityType.KEY) {
    return [getComponentActionColumn(), ...KEYS_COLUMNS(t), actionColumn];
  }

  return [getComponentActionColumn(), ...BASE_COLUMNS, actionColumn];
};

export const getEntityByIdentifier = (allEntities: ActivityAuditEntity[], entity?: BaseEntity): ActivityAuditEntity => {
  return allEntities.find(
    (e) => e?.name === (entity as ChatEntity)?.name || (e?.$id && e?.$id === (entity as DialApplicationScheme)?.$id),
  ) as ActivityAuditEntity;
};
