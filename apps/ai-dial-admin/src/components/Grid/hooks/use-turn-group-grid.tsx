/* eslint-disable react-hooks/exhaustive-deps */
import { GridReadyEvent } from 'ag-grid-community';
import { useCallback, useMemo, useRef, useState } from 'react';

import { TurnActionHandlers } from '@/src/components/Grid/columns/turn-columns';
import { useTurnGroupProjection } from '@/src/components/Grid/hooks/use-turn-group-projection';
import { GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import {
  demoteToSingle,
  getPerTurnFieldNames,
  promoteToMultiTurn,
  readTurnIndex,
  renumberTurns,
  reorderTurns,
  selectSharedFields,
} from '@/src/utils/evaluation/test-case-grouping';

const DEFAULT_STRUCTURAL_FIELDS = ['testCaseName', '_turnIndex'];

export interface TurnGroupGridConfig<T> {
  schema?: TestCaseSchema[] | null;
  collapseRows: (rows: Record<string, unknown>[], perTurnFields: Set<string>) => T[];
  onDeleteCase: (row: GroupedGridRow) => void;
  onDirtyChange?: (hasDirty: boolean) => void;
  /** Fields that are NOT part of the row's `data` map. Defaults to ['testCaseName', '_turnIndex']; TestSuites also passes 'enabled'. */
  structuralFields?: string[];
  onGridReady?: (event: GridReadyEvent) => void;
}

export const useTurnGroupGrid = <T,>({
  schema,
  collapseRows,
  onDeleteCase,
  onDirtyChange,
  structuralFields = DEFAULT_STRUCTURAL_FIELDS,
  onGridReady: onGridReadyConfig,
}: TurnGroupGridConfig<T>) => {
  const flatRowsRef = useRef<Record<string, unknown>[]>([]);
  const [rawRowsVersion, setRawRowsVersion] = useState(0);
  const bumpRawRows = useCallback(() => setRawRowsVersion((v) => v + 1), []);
  // `rawRows` intentionally depends on `rawRowsVersion`, not on `flatRowsRef` itself. The
  // projection below only derives what it renders from what it is given, so it cannot also be
  // the source of truth for a collapsed group's turns or for an edit made off-screen — the ref
  // is. A ref rather than `useState<Record<string, unknown>[]>` also lets the imperative readers
  // (`getDirtyRows`, `getCaseRows`, invoked by a parent through a ref) read the latest rows with
  // no stale-closure risk. Bumping the version hands the projection a fresh array while the row
  // objects inside keep their identity.
  const rawRows = useMemo(() => [...flatRowsRef.current], [rawRowsVersion]);
  const dirtyIdsRef = useRef<Set<string>>(new Set());
  const perTurnFields = useMemo(() => getPerTurnFieldNames(schema), [schema]);

  const { groups, rowData, onToggleExpand, expandGroup, onFilterChanged, onGridReady, getRowId, getRowHeight } =
    useTurnGroupProjection({ rawRows, onGridReady: onGridReadyConfig });

  const getCaseRows = useCallback((id: string) => flatRowsRef.current.filter((row) => String(row.id) === id), []);

  const replaceCaseRows = useCallback(
    (id: string, newRows: Record<string, unknown>[]) => {
      const current = flatRowsRef.current;
      const firstIndex = current.findIndex((row) => String(row.id) === id);
      const withoutCase = current.filter((row) => String(row.id) !== id);
      const insertAt = firstIndex === -1 ? withoutCase.length : firstIndex;
      flatRowsRef.current = [...withoutCase.slice(0, insertAt), ...newRows, ...withoutCase.slice(insertAt)];
      dirtyIdsRef.current.add(id);
      bumpRawRows();
      onDirtyChange?.(true);
    },
    [bumpRawRows, onDirtyChange],
  );

  const clearDirty = useCallback(() => {
    dirtyIdsRef.current.clear();
    onDirtyChange?.(false);
  }, [onDirtyChange]);

  const setServerRows = useCallback(
    (serverRows: Record<string, unknown>[]) => {
      const dirtyIds = dirtyIdsRef.current;
      const previousRows = flatRowsRef.current;
      const injectedIds = new Set<string>();
      const nextRows: Record<string, unknown>[] = [];

      serverRows.forEach((row) => {
        const id = String(row.id);
        if (!dirtyIds.has(id)) {
          nextRows.push(row);
          return;
        }
        if (injectedIds.has(id)) return;
        injectedIds.add(id);
        nextRows.push(...previousRows.filter((previousRow) => String(previousRow.id) === id));
      });

      flatRowsRef.current = nextRows;
      bumpRawRows();
    },
    [bumpRawRows],
  );

  const pruneToSchema = useCallback(
    (fieldNames: Set<string>) => {
      let changed = false;
      const nextRows = flatRowsRef.current.map((row) => {
        if (!dirtyIdsRef.current.has(String(row.id))) return row;
        const data = row.data as Record<string, unknown> | undefined;
        if (!data) return row;
        const keptEntries = Object.entries(data).filter(([key]) => fieldNames.has(key));
        if (keptEntries.length === Object.keys(data).length) return row;
        changed = true;
        return { ...row, data: Object.fromEntries(keptEntries) };
      });

      if (changed) {
        flatRowsRef.current = nextRows;
        bumpRawRows();
      }
    },
    [bumpRawRows],
  );

  const onCellChange = useCallback(
    (rowData: Record<string, unknown>, field: string, value: string | number | boolean) => {
      const rowId = String(rowData.id);
      const isDataField = !structuralFields.includes(field);

      // `rowData` is the object ag-grid handed the renderer — a spread copy produced by the
      // projection (`toTurnRow`/`toSingleRow`/`toGroupRow`), not the stored row. Mutating it in
      // place would be lost the next time the projection re-derives (any expand/collapse), and
      // `getDirtyRows` reads from the store rather than the grid, so it would never see the edit
      // either. Every branch below therefore locates and mutates the real row(s) in
      // `flatRowsRef` instead of `rowData`.
      //
      // Deliberately no `bumpRawRows()` here, unlike every structural mutation. `EditableCellRenderer`
      // fires `onChange` per keystroke, and a new `rowData` array would make `AgGridWrapper` re-run
      // `updateGridOptions` + `applyGridState` and the projection force a `refreshCells` — recreating
      // the focused input mid-word. A value edit never changes the projection's shape, the input holds
      // its own state, and both readers (`getDirtyRows`, a collapsed group's stacked summary on the
      // next expand/collapse) see these in-place mutations without one.
      if (isDataField && !perTurnFields.has(field)) {
        // Shared field, edited on the GROUP master row: the value is case-level, so write it to
        // every turn row of the case.
        flatRowsRef.current.forEach((row) => {
          if (String(row.id) !== rowId) return;
          row[field] = value;
          if (row.data != null) row.data = { ...(row.data as Record<string, unknown>), [field]: value };
        });
      } else {
        // Per-turn or structural field: the single row identified by id + turn index.
        const turnIndex = readTurnIndex(rowData);
        const target = flatRowsRef.current.find((row) => String(row.id) === rowId && readTurnIndex(row) === turnIndex);
        if (target) {
          target[field] = value;
          if (isDataField && target.data != null) {
            target.data = { ...(target.data as Record<string, unknown>), [field]: value };
          }
        }
      }

      dirtyIdsRef.current.add(rowId);
      onDirtyChange?.(true);
    },
    [structuralFields, perTurnFields, onDirtyChange],
  );

  const onAddTurn = useCallback(
    (groupKey: string) => {
      const rows = getCaseRows(groupKey);
      if (rows.length === 0) return;

      // Only the per-turn fields start empty. The shared ones are seeded from the case, because the
      // fan-out in `onCellChange` reaches only rows that already exist — so an empty new turn would
      // blank the case's shared values the moment it became turn 0, which is where
      // `collapseRowsTo*` reads them from.
      const sharedData = selectSharedFields(rows[0].data as Record<string, unknown> | undefined, perTurnFields);
      const newTurn = {
        ...sharedData,
        id: groupKey,
        _turnIndex: rows.length,
        testCaseName: rows[0].testCaseName,
        data: sharedData,
      };

      if (rows.length === 1 && readTurnIndex(rows[0]) === null) {
        replaceCaseRows(groupKey, [promoteToMultiTurn(rows[0]), newTurn]);
      } else {
        replaceCaseRows(groupKey, [...rows, newTurn]);
      }

      expandGroup(groupKey);
    },
    [getCaseRows, replaceCaseRows, expandGroup, perTurnFields],
  );

  const onDeleteTurn = useCallback(
    (row: GroupedGridRow) => {
      const groupKey = row.groupKey;
      const rows = getCaseRows(groupKey);
      const turnIndex = readTurnIndex(row);
      const remaining = rows.filter((r) => readTurnIndex(r) !== turnIndex);
      const renumbered = renumberTurns(remaining);
      const finalRows = renumbered.length === 1 ? [demoteToSingle(renumbered[0])] : renumbered;

      replaceCaseRows(groupKey, finalRows);

      if (finalRows.length > 1) {
        expandGroup(groupKey);
      }
    },
    [getCaseRows, replaceCaseRows, expandGroup],
  );

  const moveTurn = useCallback(
    (row: GroupedGridRow, direction: -1 | 1) => {
      const groupKey = row.groupKey;
      const rows = getCaseRows(groupKey);
      const from = readTurnIndex(row) ?? (row.turnNumber ? row.turnNumber - 1 : 0);
      const to = from + direction;
      // Moving past either boundary changes nothing, but `replaceCaseRows` would still mark the case
      // dirty — a phantom unsaved-changes state and an unnecessary save request.
      if (to < 0 || to >= rows.length) return;

      replaceCaseRows(groupKey, reorderTurns(rows, from, to));
      expandGroup(groupKey);
    },
    [getCaseRows, replaceCaseRows, expandGroup],
  );

  const onMoveTurnUp = useCallback((row: GroupedGridRow) => moveTurn(row, -1), [moveTurn]);
  const onMoveTurnDown = useCallback((row: GroupedGridRow) => moveTurn(row, 1), [moveTurn]);

  const turnActionHandlers: TurnActionHandlers = useMemo(
    () => ({ onAddTurn, onDeleteCase, onDeleteTurn, onMoveTurnUp, onMoveTurnDown }),
    [onAddTurn, onDeleteCase, onDeleteTurn, onMoveTurnUp, onMoveTurnDown],
  );

  const getDirtyRows = useCallback(
    (extraRows?: Record<string, unknown>[]): T[] => {
      const dirtyIds = new Set([...dirtyIdsRef.current, ...(extraRows ?? []).map((row) => String(row.id))]);
      // Collapse from the store rather than from visible grid nodes, so a collapsed group still
      // contributes all of its turns even though only its GROUP row is currently rendered.
      const rows = [...flatRowsRef.current, ...(extraRows ?? [])].filter((row) => dirtyIds.has(String(row.id)));
      return collapseRows(rows, perTurnFields);
    },
    [collapseRows, perTurnFields],
  );

  const turnGridOptions = useMemo(
    () => ({ getRowId, getRowHeight, onFilterChanged }),
    [getRowId, getRowHeight, onFilterChanged],
  );

  return {
    rowData,
    groups,
    onGridReady,
    onToggleExpand,
    expandGroup,
    getCaseRows,
    setServerRows,
    getDirtyRows,
    clearDirty,
    pruneToSchema,
    onCellChange,
    turnActionHandlers,
    // `AgGridWrapper` forwards `getRowId` only when `isLiveData` is set and does not expose
    // `getRowHeight`/`onFilterChanged` as props at all, while `additionalGridOptions` is spread
    // onto `AgGridReact` regardless — the same route `HeatMapTab` and `ContainerCreate` use.
    turnGridOptions,
  };
};
