import { ColDef, ColGroupDef, ColumnState, FilterModel, GridApi } from 'ag-grid-community';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { GRID_COLUMNS_KEY, LEADING_COLUMN_IDS, TRAILING_COLUMN_IDS } from './constants';
import { ColumnWidths } from './models';

export interface GridModel {
  columns: ColumnState[];
  filters: FilterModel;
  // Columns the operator dragged. Other stored widths are an automatic fit saved with a sort or filter.
  sizedColIds?: string[];
}

// `flex: 0` because a column with `flex` ignores `width`; `suppressSizeToFit` keeps the grid's own fit off it.
export const withColumnWidths = (columnDefs: ColDef[], widths: ColumnWidths | undefined): ColDef[] => {
  if (!widths || Object.keys(widths).length === 0) {
    return columnDefs;
  }

  return columnDefs.map((col) => {
    const children = (col as ColGroupDef).children;
    if (Array.isArray(children)) {
      return { ...col, children: withColumnWidths(children as ColDef[], widths) } as ColDef;
    }

    const width = widths[(col.colId ?? col.field) as string];
    return width == null ? col : { ...col, width, flex: 0, suppressSizeToFit: true };
  });
};

export const getRowIdById = <T extends { id: string }>({ data }: { data: T }): string => data.id;

export const saveColumnsStateToStorage = (storageKey: string, model: GridModel) => {
  setToLocalStorage(`${GRID_COLUMNS_KEY}${storageKey}`, JSON.stringify(model));
};

const parseStoredModel = (stored: string): Partial<GridModel> => {
  try {
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // A corrupted entry starts the grid from its defaults instead of failing its render.
    return {};
  }
};

export const getColumnsStateFromStorage = (storageKey: string, defaultSorts: ColumnState[]): GridModel => {
  const parsed = parseStoredModel(getFromLocalStorage(`${GRID_COLUMNS_KEY}${storageKey}`) || '{}');
  // `filters` must stay an object: `applyGridState` hands it straight to `setFilterModel`, which
  // reads it as a colId -> model map.
  return Object.values(parsed).length > 0 ? (parsed as GridModel) : { columns: defaultSorts, filters: {} };
};

export const getDefaultSorts = (columnDefs: ColDef[] | undefined): ColumnState[] =>
  toColumnLeaves(columnDefs ?? [])
    .filter((col) => col.sort)
    .map((col) => ({ colId: col.field, sort: col.sort }) as ColumnState);

export const loadPersistedModel = (storageKey: string | undefined, defaultSorts: ColumnState[]): GridModel | null =>
  storageKey ? getColumnsStateFromStorage(storageKey, defaultSorts) : null;

const withoutStoredWidth = ({ width: __width, ...column }: ColumnState): ColumnState => column;

const pickFields = (column: ColumnState, fields: (keyof ColumnState)[]): ColumnState => ({
  ...Object.fromEntries(fields.filter((field) => field in column).map((field) => [field, column[field]])),
  colId: column.colId,
});

export const columnStateToStore = (
  columns: ColumnState[],
  sizedColIds: ReadonlySet<string>,
  persistedFields?: (keyof ColumnState)[],
): ColumnState[] =>
  columns.map((column) => {
    const picked = persistedFields ? pickFields(column, persistedFields) : column;
    return column.colId && sizedColIds.has(column.colId) ? picked : withoutStoredWidth(picked);
  });

// A column the grid is not showing right now (compact view, a folder with fewer columns) keeps its stored
// slot; the shown columns fill the slots shown columns held, in their current order; new ones go last.
export const mergeColumnOrder = (current: ColumnState[], stored: ColumnState[]): ColumnState[] => {
  const currentIds = new Set(current.map((column) => column.colId));
  const pending = [...current];
  const slotted = stored.map((column) => (currentIds.has(column.colId) ? pending.shift() : column));
  return withUtilityColumnsAtEdges([
    ...slotted.filter((column): column is ColumnState => column !== undefined),
    ...pending,
  ]);
};

const columnRank = ({ colId }: ColumnState): number => {
  if (LEADING_COLUMN_IDS.includes(colId)) return 0;
  return TRAILING_COLUMN_IDS.includes(colId) ? 2 : 1;
};

// The select column stays first and the actions column last, whatever slot a stored order or a rebuild with
// another column set (a folder showing fewer columns) left them in.
export const withUtilityColumnsAtEdges = (columns: ColumnState[]): ColumnState[] =>
  [...columns].sort((a, b) => columnRank(a) - columnRank(b));

// Works on the grid's own order: a column the applied state does not list stays where `maintainColumnOrder`
// slotted it, which for a re-added utility column is next to the surviving data column.
const keepUtilityColumnsAtEdges = (gridApi: GridApi) => {
  const current = gridApi.getColumnState();
  const ordered = withUtilityColumnsAtEdges(current);
  if (ordered.some((column, index) => column.colId !== current[index].colId)) {
    gridApi.applyColumnState({ state: ordered.map(({ colId }) => ({ colId })), applyOrder: true });
  }
};

// ag-Grid lets `flex` win over `width`, so a dragged column drops its flex share to keep the stored width.
const columnStateToApply = (model: GridModel): ColumnState[] => {
  const sized = new Set(model.sizedColIds ?? []);
  return model.columns.map((column) =>
    column.colId && sized.has(column.colId) ? { ...column, flex: null } : withoutStoredWidth(column),
  );
};

export const applyGridState = (
  gridApi: GridApi,
  model: GridModel | null,
  defaultSorts: ColumnState[],
  shouldApplyOrder = false,
) => {
  if (model) {
    gridApi.setFilterModel(model.filters);
    const state = columnStateToApply(model);
    gridApi.applyColumnState(shouldApplyOrder ? { state, applyOrder: true } : { state });
  } else {
    gridApi.applyColumnState({ state: defaultSorts });
  }
  if (shouldApplyOrder) {
    keepUtilityColumnsAtEdges(gridApi);
  }
};

type ColumnFactory = (...args: unknown[]) => ColDef;

// The file-manager list hands the grid column factories typed as `ColDef`, and its library calls them on
// every column rebuild — so a factory's definition is unknown until then.
const isColumnFactory = (col: unknown): col is ColumnFactory => typeof col === 'function';

const mergeStoredColumnDef = (col: ColDef, stored: ColumnState[], sized: ReadonlySet<string>): ColDef => {
  const id = col.colId ?? col.field;
  const fromStorage = stored?.find((s) => s.colId === id);
  if (!fromStorage) return { ...col, sort: undefined };
  // `sortType` is column state only; as a column definition property ag-Grid reports it as invalid.
  const { width, sortType: __sortType, ...stateWithoutWidth } = fromStorage;
  const keepWidth = typeof width === 'number' && sized.has(fromStorage.colId);
  return {
    ...stateWithoutWidth,
    ...col,
    sort: undefined,
    // `null`, not `undefined`: a merged definition skips undefined values, so `defaultColDef.flex` would win.
    ...(keepWidth ? { suppressSizeToFit: true, width, flex: null } : {}),
  } as ColDef;
};

export const mergeStoredColumnDefs = (columnDefs: ColDef[], stored: ColumnState[], sizedColIds: string[]): ColDef[] => {
  const sized = new Set(sizedColIds);
  return columnDefs.map((col) =>
    // Wrapped rather than skipped: a rebuild re-applies the definition's own `flex`, which would put a
    // dragged width restored only through the grid api back to a flex share.
    isColumnFactory(col)
      ? (((...args: unknown[]) => mergeStoredColumnDef(col(...args), stored, sized)) as unknown as ColDef)
      : mergeStoredColumnDef(col, stored, sized),
  );
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

const groupChildren = (col: ColDef): ColDef[] | null => {
  const children = (col as ColGroupDef).children;
  return Array.isArray(children) ? (children as ColDef[]) : null;
};

export const applyColumnStateOrderToTreeColDefs = (columnDefs: ColDef[], columnState: ColumnState[]): ColDef[] => {
  const colIdToIndex = new Map(columnState.map((state, i) => [state.colId, i]));

  const leafPosition = (col: ColDef): number => {
    const id = (col.colId ?? col.field) as string | undefined;
    return id !== undefined ? (colIdToIndex.get(id) ?? Infinity) : Infinity;
  };

  const position = (col: ColDef): number => {
    const children = groupChildren(col);
    if (!children?.length) {
      return leafPosition(col);
    }

    return Math.min(...children.map(position));
  };

  const sortLevel = (nodes: ColDef[]): ColDef[] => {
    const withSortedChildren = nodes.map((node) => {
      const children = groupChildren(node);
      if (!children?.length) {
        return node;
      }

      const sortedChildren = sortLevel(children);
      const unchanged = sortedChildren.every((child, index) => child === children[index]);
      return unchanged ? node : { ...node, children: sortedChildren };
    });

    return [...withSortedChildren].sort((a, b) => position(a) - position(b));
  };

  return sortLevel(columnDefs);
};

const sameTreeOrder = (columnDefs: ColDef[], nextColumnDefs: ColDef[]): boolean =>
  columnDefs.length === nextColumnDefs.length &&
  columnDefs.every((col, index) => {
    const next = nextColumnDefs[index];
    if (getFirstLeafColId(col) !== getFirstLeafColId(next)) {
      return false;
    }

    const children = groupChildren(col);
    const nextChildren = groupChildren(next);
    if (!children?.length && !nextChildren?.length) {
      return true;
    }

    return !!children?.length && !!nextChildren?.length && sameTreeOrder(children, nextChildren);
  });

export const haveTreeColDefsSamePanelState = (columnDefs: ColDef[], nextColumnDefs: ColDef[]): boolean =>
  sameTreeOrder(columnDefs, nextColumnDefs);

export interface ColumnLeaf {
  field: string;
  headerName?: ColDef['headerName'];
  hide?: ColDef['hide'];
  sort?: ColDef['sort'];
  groupId?: string;
  groupName?: ColDef['headerName'];
  suppressColumnsToolPanel?: ColDef['suppressColumnsToolPanel'];
}

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

// Stored entries that match a leaf are re-slotted into the leaves' order, and leaves the grid has not
// saved yet are appended, so the panel's order survives even before the grid first writes its state.
const withLeafOrderAndVisibility = (columns: ColumnState[], colDefs: ColDef[]): ColumnState[] => {
  const leaves = toColumnLeaves(colDefs).filter((leaf) => leaf.field);
  const leafIndex = new Map(leaves.map((leaf, index) => [leaf.field, index]));
  const indexOf = (col: ColumnState) => leafIndex.get(col.colId) ?? -1;
  const ordered = columns.filter((col) => indexOf(col) >= 0).sort((a, b) => indexOf(a) - indexOf(b));

  let next = 0;
  const slotted = columns.map((col) => {
    if (indexOf(col) < 0) {
      return col;
    }
    const target = ordered[next++];
    return { ...target, hide: leaves[indexOf(target)].hide };
  });

  const storedIds = new Set(columns.map((col) => col.colId));
  const unsaved = leaves
    .filter((leaf) => !storedIds.has(leaf.field))
    .map((leaf) => ({ colId: leaf.field, hide: leaf.hide }));

  return [...slotted, ...unsaved];
};

export const updateColumnPanelStateInStorage = (storageKey: string, colDefs: ColDef[]) => {
  const stored = getFromLocalStorage(`${GRID_COLUMNS_KEY}${storageKey}`) || '{}';
  const model: GridModel = JSON.parse(stored);
  const columns = withLeafOrderAndVisibility(model.columns || [], colDefs);
  saveColumnsStateToStorage(storageKey, { ...model, filters: model.filters ?? {}, columns });
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
