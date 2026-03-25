import { ColDef } from 'ag-grid-community';
import { TabModel } from '@epam/ai-dial-ui-kit';

import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import {
  DESCRIPTION_COLUMN,
  DISPLAY_NAME_COLUMN_WITH_SORT,
  NAME_COLUMN,
  VERSION_COLUMN,
} from '@/src/constants/grid-columns/base-columns';
import { MenuI18nKey } from '@/src/constants/i18n';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { DeploymentExportComponent } from '@/src/models/export';
import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { getDeploymentExportComponentType } from '@/src/utils/deployments/export';
import { IMAGE_TYPE_COLUMN } from '../../constants/grid-columns/grid-columns';

const DEPLOYMENT_ENTITY_TABS: { id: DeploymentExportEntityType; labelKey: string }[] = [
  { id: DeploymentExportEntityType.MODEL_SERVING, labelKey: MenuI18nKey.ModelServings },
  { id: DeploymentExportEntityType.MCP_CONTAINER, labelKey: MenuI18nKey.McpContainers },
  { id: DeploymentExportEntityType.INTERCEPTOR_CONTAINER, labelKey: MenuI18nKey.InterceptorContainers },
  { id: DeploymentExportEntityType.ADAPTER_CONTAINER, labelKey: MenuI18nKey.AdapterContainers },
  { id: DeploymentExportEntityType.IMAGE, labelKey: MenuI18nKey.Images },
];

export const getDeploymentTabs = (t: (v: string) => string): TabModel[] => {
  return DEPLOYMENT_ENTITY_TABS.map(({ id, labelKey }) => ({
    id,
    label: t(labelKey),
  }));
};

export const getDeploymentButtonTitle = (t: (v: string) => string, selectedTab: string): string => {
  const tab = DEPLOYMENT_ENTITY_TABS.find((tab) => tab.id === selectedTab);
  const entity = tab ? t(tab.labelKey) : '';
  return `${t('Buttons.Add')} ${entity}`;
};

const IMAGE_ID_COLUMN: ColDef = { field: 'id', colId: 'id', headerName: 'ID', hide: false };
const IMAGE_NAME_COLUMN: ColDef = {
  field: 'name',
  colId: 'name',
  headerName: 'Display Name',
  hide: false,
  sort: 'asc',
};

const getBaseColumns = (t: (v: string) => string, selectedTab?: string): ColDef[] => {
  if (selectedTab === DeploymentExportEntityType.IMAGE) {
    return [IMAGE_NAME_COLUMN, DESCRIPTION_COLUMN, IMAGE_ID_COLUMN, VERSION_COLUMN, IMAGE_TYPE_COLUMN(t)];
  }
  return [DISPLAY_NAME_COLUMN_WITH_SORT, DESCRIPTION_COLUMN, NAME_COLUMN];
};

export const getDeploymentColDefs = (
  t: (v: string) => string,
  remove?: (entity?: EntitiesGridData) => void,
  selectedTab?: string,
): ColDef[] => {
  const columns = getBaseColumns(t, selectedTab);

  if (remove) {
    const actions = [getRemoveOperation(remove)];
    return [...columns, ACTION_COLUMN(actions)];
  }

  return columns;
};

export const getDeploymentExportComponents = (
  customExportData: Record<string, EntitiesGridData[]>,
): DeploymentExportComponent[] => {
  const components: DeploymentExportComponent[] = [];

  Object.entries(customExportData).forEach(([entityType, entities]) => {
    entities.forEach((entity) => {
      const subType = (entity as Record<string, unknown>).$type as string;
      const id =
        entityType === DeploymentExportEntityType.IMAGE
          ? ((entity as Record<string, unknown>).id as string)
          : entity.name || '';
      components.push({
        name: id,
        type: getDeploymentExportComponentType(entityType, subType),
      });
    });
  });

  return components;
};
