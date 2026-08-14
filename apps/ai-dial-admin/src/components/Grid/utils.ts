import { ColDef, ColGroupDef, ColumnState, FilterModel } from 'ag-grid-community';
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

const getFirstLeafColId = (col: ColDef): string | undefined => {
  const children = 'children' in col && col.children ? (col.children as ColDef[]) : [];
  if (children.length > 0) {
    for (const child of children) {
      const id = getFirstLeafColId(child);
      if (id != null) return id;
    }
    return undefined;
  }
  return (col.colId ?? col.field) as string | undefined;
};

export const applyColumnStateOrderToTreeColDefs = (columnDefs: ColDef[], columnState: ColumnState[]): ColDef[] => {
  const colIdToIndex = new Map(columnState.map((state, i) => [state.colId, i]));

  const getPosition = (col: ColDef): number => {
    const leafId = getFirstLeafColId(col);
    return leafId !== undefined ? (colIdToIndex.get(leafId) ?? Infinity) : Infinity;
  };

  return [...columnDefs].sort((a, b) => getPosition(a) - getPosition(b));
};

export const haveTreeColDefsSamePanelState = (columnDefs: ColDef[], nextColumnDefs: ColDef[]): boolean =>
  columnDefs.length === nextColumnDefs.length &&
  columnDefs.every((col, index) => getFirstLeafColId(col) === getFirstLeafColId(nextColumnDefs[index]));

export interface ColumnLeaf {
  field: string;
  headerName?: ColDef['headerName'];
  hide?: ColDef['hide'];
  sort?: ColDef['sort'];
  groupId?: string;
  groupName?: ColDef['headerName'];
  suppressColumnsToolPanel?: ColDef['suppressColumnsToolPanel'];
}

const groupChildren = (col: ColDef): ColDef[] | null => {
  const children = (col as ColGroupDef).children;
  return Array.isArray(children) ? (children as ColDef[]) : null;
};

const toLeaf = (col: ColDef, group?: ColGroupDef): ColumnLeaf => ({
  field: (col.field ?? col.colId ?? '') as string,
  headerName: col.headerName,
  hide: col.hide,
  sort: col.sort,
  suppressColumnsToolPanel: col.suppressColumnsToolPanel,
  ...(group?.groupId ? { groupId: group.groupId } : {}),
  ...(group?.headerName ? { groupName: group.headerName } : {}),
});

export const isGroupedColDefs = (columnDefs: ColDef[] | undefined): boolean =>
  !!columnDefs?.some((col) => groupChildren(col) !== null);

export const toColumnLeaves = (columnDefs: ColDef[]): ColumnLeaf[] =>
  columnDefs.flatMap((col) => {
    const children = groupChildren(col);
    return children ? children.map((child) => toLeaf(child, col as ColGroupDef)) : [toLeaf(col)];
  });

const mapLeafGroups = (columnDefs: ColDef[], transform: (children: ColDef[]) => ColDef[]): ColDef[] =>
  columnDefs.map((col) => {
    const children = groupChildren(col);
    if (!children) {
      const [next] = transform([col]);
      return next ?? col;
    }
    const next = transform(children);
    const isUnchanged = next.length === children.length && next.every((child, index) => child === children[index]);
    return isUnchanged ? col : { ...col, children: next };
  });

export const withLeafVisibility = (columnDefs: ColDef[], field: string, hide: boolean): ColDef[] => {
  if (!isGroupedColDefs(columnDefs)) {
    return columnDefs.map((col) => (col.field === field ? { ...col, hide } : col));
  }

  return mapLeafGroups(columnDefs, (children) =>
    children.map((child) => (child.field === field ? { ...child, hide } : child)),
  );
};

const reorder = (items: ColDef[], from: number, to: number): ColDef[] => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

export const withLeafMoved = (columnDefs: ColDef[], field: string, atIndex: number): ColDef[] => {
  const leaves = toColumnLeaves(columnDefs);
  const from = leaves.findIndex((leaf) => leaf.field === field);
  const target = leaves[atIndex];

  if (from < 0 || !target || from === atIndex) {
    return columnDefs;
  }

  if (!isGroupedColDefs(columnDefs)) {
    return reorder(columnDefs, from, atIndex);
  }

  if (leaves[from].groupId !== target.groupId) {
    return columnDefs;
  }

  return mapLeafGroups(columnDefs, (children) => {
    const localFrom = children.findIndex((child) => child.field === field);
    const localTo = children.findIndex((child) => child.field === target.field);
    return localFrom < 0 || localTo < 0 ? children : reorder(children, localFrom, localTo);
  });
};

export const applyColumnStateOrderToGroupedColDefs = (columnDefs: ColDef[], columnState: ColumnState[]): ColDef[] => {
  const stateByColId = new Map(columnState.map((state) => [state.colId, state]));
  const orderOf = new Map(columnState.map((state, index) => [state.colId, index]));

  return mapLeafGroups(columnDefs, (children) =>
    [...children]
      .sort((a, b) => {
        const aOrder = orderOf.get((a.field ?? a.colId) as string) ?? Infinity;
        const bOrder = orderOf.get((b.field ?? b.colId) as string) ?? Infinity;
        return aOrder - bOrder;
      })
      .map((child) => {
        const state = stateByColId.get((child.field ?? child.colId) as string);
        return state?.hide !== undefined ? { ...child, hide: state.hide } : child;
      }),
  );
};

export const haveGroupedColDefsSamePanelState = (columnDefs: ColDef[], nextColumnDefs: ColDef[]): boolean => {
  const current = toColumnLeaves(columnDefs);
  const next = toColumnLeaves(nextColumnDefs);

  return (
    current.length === next.length &&
    current.every((leaf, index) => leaf.field === next[index].field && !!leaf.hide === !!next[index].hide)
  );
};

export const updateGroupedColumnVisibilityInStorage = (storageKey: string, colDefs: ColDef[]) => {
  const stored = getFromLocalStorage(`${GRID_COLUMNS_KEY}${storageKey}`) || '{}';
  const model: GridModel = JSON.parse(stored);
  const leafByField = new Map(toColumnLeaves(colDefs).map((leaf) => [leaf.field, leaf]));
  const columns = (model.columns || []).map((col) => {
    const leaf = leafByField.get(col.colId);
    return leaf ? { ...col, hide: leaf.hide } : col;
  });
  saveColumnsStateToStorage(storageKey, { ...model, columns });
};

export const getGroupedColumnVisibilityFromGridState = (storageKey: string, columnDefs: ColDef[]): ColDef[] | null => {
  const stored = getFromLocalStorage(`${GRID_COLUMNS_KEY}${storageKey}`);
  if (!stored) {
    return null;
  }
  const model: GridModel = JSON.parse(stored);
  if (!model.columns || model.columns.length === 0) {
    return null;
  }
  return applyColumnStateOrderToGroupedColDefs(columnDefs, model.columns);
};

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
