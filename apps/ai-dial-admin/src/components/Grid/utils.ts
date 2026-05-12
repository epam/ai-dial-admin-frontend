import { ColDef, ColumnState, FilterModel } from 'ag-grid-community';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { GRID_COLUMNS_KEY } from './constants';

export interface GridModel {
  columns: ColumnState[];
  filters: FilterModel;
}

export const getRowIdById = <T extends { id: string }>({ data }: { data: T }): string => data.id;

export const saveColumnsStateToStorage = (storageKey: string, model: GridModel) => {
  setToLocalStorage(`${GRID_COLUMNS_KEY}${storageKey}`, JSON.stringify(model));
};

export const getColumnsStateFromStorage = (storageKey: string, defaultSorts: ColumnState[]): GridModel => {
  const model = getFromLocalStorage(`${GRID_COLUMNS_KEY}${storageKey}`) || '{}';
  const parsed = JSON.parse(model);
  return Object.values(parsed).length > 0 ? parsed : { columns: defaultSorts, filters: [] };
};

export const applyColumnStateOrderToColDefs = (columnDefs: ColDef[], columnState: ColumnState[]): ColDef[] => {
  const byColId = new Map(columnDefs.map((col) => [(col.field ?? col.colId) as string, col]));
  const ordered: ColDef[] = [];

  columnState.forEach((state) => {
    const col = byColId.get(state.colId);
    if (!col) {
      return;
    }

    byColId.delete(state.colId);
    ordered.push(state.hide !== undefined ? { ...col, hide: state.hide } : col);
  });

  byColId.forEach((col) => ordered.push(col));

  return ordered;
};

export const haveColDefsSamePanelState = (columnDefs: ColDef[], nextColumnDefs: ColDef[]) =>
  columnDefs.length === nextColumnDefs.length &&
  columnDefs.every(
    (col, index) => col.field === nextColumnDefs[index].field && col.hide === nextColumnDefs[index].hide,
  );

export const updateColumnVisibilityInStorage = (storageKey: string, colDefs: ColDef[]) => {
  const stored = getFromLocalStorage(`${GRID_COLUMNS_KEY}${storageKey}`) || '{}';
  const model: GridModel = JSON.parse(stored);
  const columns = (model.columns || []).map((col) => {
    const def = colDefs.find((d) => d.field === col.colId);
    return def ? { ...col, hide: def.hide } : col;
  });
  saveColumnsStateToStorage(storageKey, { ...model, columns });
};

export const getColumnVisibilityFromGridState = (storageKey: string, columnDefs: ColDef[]): ColDef[] | null => {
  const stored = getFromLocalStorage(`${GRID_COLUMNS_KEY}${storageKey}`);
  if (!stored) {
    return null;
  }
  const model: GridModel = JSON.parse(stored);
  if (!model.columns || model.columns.length === 0) {
    return null;
  }
  return applyColumnStateOrderToColDefs(columnDefs, model.columns);
};
