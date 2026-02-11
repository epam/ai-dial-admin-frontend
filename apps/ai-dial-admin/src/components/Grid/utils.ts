import { ColDef, ColumnState, FilterModel } from 'ag-grid-community';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { keyBy, map } from 'lodash';

const COLUMNS_KEY = 'gridColumns';
const GRID_COLUMNS_KEY = 'gridColumnsState';

export interface GridModel {
  columns: ColumnState[];
  filters: FilterModel;
}

export const saveColumnsStateToStorage = (storageKey: string, model: GridModel) => {
  setToLocalStorage(`${GRID_COLUMNS_KEY}${storageKey}`, JSON.stringify(model));
};

export const getColumnsStateFromStorage = (storageKey: string, defaultSorts: ColumnState[]): GridModel => {
  const model = getFromLocalStorage(`${GRID_COLUMNS_KEY}${storageKey}`) || '{}';
  const parsed = JSON.parse(model);
  return Object.values(parsed).length > 0 ? parsed : { columns: defaultSorts, filters: [] };
};

export const saveColumnVisibilityToStorage = (colDefs: ColDef[], storageKey: string) => {
  const columns = colDefs.map((c) => ({ field: c.field, hide: c.hide }));
  setToLocalStorage(`${COLUMNS_KEY}${storageKey}`, JSON.stringify(columns));
};

export const getColumnVisibilityFromStorage = (colDefs: ColDef[] | undefined, storageKey: string): ColDef[] | null => {
  const columns = getFromLocalStorage(`${COLUMNS_KEY}${storageKey}`);
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
