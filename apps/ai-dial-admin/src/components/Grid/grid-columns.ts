import { ColDef, ColumnState, FilterModel } from 'ag-grid-community';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { ApplicationRoute } from '@/src/types/routes';
import { keyBy, map } from 'lodash';

const COLUMNS_KEY = 'gridColumns';
const GRID_COLUMNS_KEY = 'gridColumnsState';

export interface GridModel {
  columns: ColumnState[];
  filters: FilterModel;
}

export const saveColumnsStateToStorage = (entityType: ApplicationRoute, model: GridModel) => {
  setToLocalStorage(`${GRID_COLUMNS_KEY}${entityType}`, JSON.stringify(model));
};

export const getColumnsStateFromStorage = (entityType: ApplicationRoute): GridModel => {
  const model = getFromLocalStorage(`${GRID_COLUMNS_KEY}${entityType}`) || '{}';
  const parsed = JSON.parse(model);
  return parsed;
};

export const saveColumnVisibilityToStorage = (colDefs: ColDef[], entityType: ApplicationRoute) => {
  const columns = colDefs.map((c) => ({ field: c.field, hide: c.hide }));
  setToLocalStorage(`${COLUMNS_KEY}${entityType}`, JSON.stringify(columns));
};

export const getColumnVisibilityFromStorage = (colDefs: ColDef[], entityType: ApplicationRoute): ColDef[] | null => {
  const columns = getFromLocalStorage(`${COLUMNS_KEY}${entityType}`);
  if (!columns) {
    return null;
  }
  const colDefsMap = keyBy(colDefs, 'field');
  const parsed = JSON.parse(columns);
  const merged = map(parsed, (item) => ({
    ...colDefsMap[item.field],
    ...item,
  }));

  return merged;
};
