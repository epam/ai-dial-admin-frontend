import { ColDef, ColumnResizedEvent, ColumnState, GridApi } from 'ag-grid-community';

export interface GridStatePersistenceOptions {
  // Column-state keys to store. Omitted, the whole column state is stored; `width` is stored only for
  // columns the operator dragged either way.
  persistedFields?: (keyof ColumnState)[];
  // When set, only a finished resize from one of these sources counts as the operator's. Otherwise every
  // source but the grid's own sizing does.
  userResizeSources?: ColumnResizedEvent['source'][];
  // The hook owns column order: it is restored through the grid api, and a save keeps the slots of columns
  // the grid is not showing at the moment. Off, column order comes from the column definitions.
  shouldRestoreOrder?: boolean;
}

export interface GridStatePersistenceProps extends GridStatePersistenceOptions {
  storageKey?: string;
  columnDefs?: ColDef[];
  gridApi?: GridApi;
  // Off for a live feed, whose definitions are applied as they come.
  shouldMergeColumnDefs?: boolean;
}
