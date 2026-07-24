/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useRouter } from 'next/navigation';
import { FC, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialConfirmationPopup, DialLoader } from '@epam/ai-dial-ui-kit';
import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IRowNode,
  SelectionChangedEvent,
} from 'ag-grid-community';

import {
  createTestCase,
  getDataset,
  getTestCases,
  importTestCase,
  removeMultipleTestCases,
  removeTestCase,
} from '@/src/app/[lang]/datasets/actions';
import { getDatasetTestCaseColumns } from '@/src/components/Datasets/utils/columns';
import {
  collapseRowsToDatasetTestCases,
  createNewDatasetTestCaseRow,
  getDatasetTestCaseGridData,
  rowToDatasetTestCase,
} from '@/src/components/Datasets/utils/data';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { useTurnGroupProjection } from '@/src/components/Grid/hooks/use-turn-group-projection';
import ListEntities from '@/src/components/ListView/List';
import { getTurnActionsColumn, TurnActionHandlers } from '@/src/components/TestSuites/utils/grouped-columns';
import { ApiRoute } from '@/src/constants/api-routes';
import { ButtonsI18nKey, DatasetsI18nKey, DeleteI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetTestCase } from '@/src/models/evaluation/dataset';
import { GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { ApplicationRoute } from '@/src/types/routes';
import {
  demoteToSingle,
  getPerTurnFieldNames,
  promoteToMultiTurn,
  readTurnIndex,
  renumberTurns,
  reorderTurns,
} from '@/src/utils/evaluation/test-case-grouping';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import DatasetTestCasesHeader from './Header';

export interface DatasetTestCasesActions {
  getDirtyTestCases: () => DatasetTestCase[];
  clearDirtyAndRefresh: () => void;
}

interface Props {
  dataset: Dataset;
  testCasesActionsRef?: RefObject<DatasetTestCasesActions | null>;
  onDirtyChange?: (hasDirty: boolean) => void;
}

const DatasetTestCasesList: FC<Props> = ({ dataset, testCasesActionsRef, onDirtyChange }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [newTestCases, setNewTestCases] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<DatasetTestCase | undefined>(undefined);
  const [selectedRows, setSelectedRows] = useState<DatasetTestCase[]>([]);
  const dirtyIdsRef = useRef<Set<string>>(new Set());
  const refreshVersionRef = useRef(0);

  // Authoritative flat-row store: every turn of every case, regardless of expand/collapse state.
  // `useTurnGroupProjection` only ever derives from what it's given, so it can't itself be the
  // source of truth for a collapsed group's turns or for an edit made off-screen — this ref is,
  // and it survives the hook's internal expand/collapse re-renders. `rawRowsVersion` is the only
  // React state involved: bumping it forces `useTurnGroupProjection` to re-derive from a fresh
  // array snapshot, while the row objects inside keep their identity so an in-place edit survives
  // that re-derivation.
  const flatRowsRef = useRef<Record<string, unknown>[]>([]);
  const [rawRowsVersion, setRawRowsVersion] = useState(0);
  const bumpRawRows = useCallback(() => setRawRowsVersion((v) => v + 1), []);
  const rawRows = useMemo(() => [...flatRowsRef.current], [rawRowsVersion]);

  const perTurnFields = useMemo(() => getPerTurnFieldNames(dataset.testCaseSchema), [dataset.testCaseSchema]);

  const getCaseRows = useCallback(
    (id: string): Record<string, unknown>[] => flatRowsRef.current.filter((row) => String(row.id) === id),
    [],
  );

  const replaceCaseRows = useCallback(
    (id: string, newRows: Record<string, unknown>[]) => {
      const prev = flatRowsRef.current;
      const insertAt = prev.findIndex((row) => String(row.id) === id);
      const rest = prev.filter((row) => String(row.id) !== id);
      const at = insertAt === -1 ? rest.length : Math.min(insertAt, rest.length);
      flatRowsRef.current = [...rest.slice(0, at), ...newRows, ...rest.slice(at)];
      dirtyIdsRef.current.add(id);
      bumpRawRows();
      onDirtyChange?.(true);
    },
    [bumpRawRows, onDirtyChange],
  );

  const onCellChange = useCallback(
    (rowData: Record<string, unknown>, field: string, value: string | number | boolean) => {
      if (!rowData) return;
      const rowId = String(rowData.id);

      if (newTestCases.some((r) => r.id === rowData.id)) {
        // Unsaved new-case rows bypass the grouping projection entirely (they're set via
        // `pinnedTopRowData`, never through `rawRows`), so the object the cell renderer hands
        // back here *is* the one live in `newTestCases` — editing it in place is correct.
        rowData[field] = value;
        if (field !== 'testCaseName' && field !== '_turnIndex' && rowData.data != null) {
          rowData.data = { ...(rowData.data as Record<string, unknown>), [field]: value };
        }
        setNewTestCases((prev) => prev.map((r) => (r.id === rowData.id ? { ...rowData } : r)));
        onDirtyChange?.(true);
        return;
      }

      // `rowData` is the row AG Grid renders — a spread copy `toTurnRow`/`toSingleRow`/`toGroupRow`
      // made from the underlying flat row(s), not those flat rows themselves. Editing it in place
      // would never reach the authoritative store: the edit would vanish next time the projection
      // re-derives (e.g. on expand/collapse) and `getDirtyTestCases` would never see it. Locate the
      // real row(s) in the store and edit those instead.
      const isDataField = field !== 'testCaseName' && field !== '_turnIndex';
      if (isDataField && !perTurnFields.has(field)) {
        // Shared field (edited on the GROUP master row): the value is constant across the case's
        // turns, so write it to every turn row of the case.
        flatRowsRef.current.forEach((row) => {
          if (String(row.id) !== rowId) return;
          row[field] = value;
          if (row.data != null) row.data = { ...(row.data as Record<string, unknown>), [field]: value };
        });
        bumpRawRows();
      } else {
        // Per-turn (or structural) field: edit the single row identified by id + `_turnIndex`.
        const turnIndex = readTurnIndex(rowData);
        const target = flatRowsRef.current.find((row) => String(row.id) === rowId && readTurnIndex(row) === turnIndex);
        if (target) {
          target[field] = value;
          if (isDataField && target.data != null) {
            target.data = { ...(target.data as Record<string, unknown>), [field]: value };
          }
          bumpRawRows();
        }
      }
      dirtyIdsRef.current.add(rowId);
      onDirtyChange?.(true);
    },
    [newTestCases, onDirtyChange, bumpRawRows, perTurnFields],
  );

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    setSelectedRows(event.api.getSelectedRows() as DatasetTestCase[]);
  }, []);

  const onCellClicked = useCallback((event: CellClickedEvent) => {
    if (event.column.getColId() !== 'id') return;

    const mouseEvent = event.event as MouseEvent;
    const shiftKey = mouseEvent.shiftKey;

    if (shiftKey) {
      mouseEvent.preventDefault();
      const allNodes: IRowNode[] = [];
      event.api.forEachNodeAfterFilterAndSort((node) => allNodes.push(node));
      const currentIndex = allNodes.findIndex((n) => n.id === event.node.id);
      const selectedNodes = event.api.getSelectedNodes();
      if (selectedNodes.length > 0) {
        const lastSelected = selectedNodes[selectedNodes.length - 1];
        const lastIndex = allNodes.findIndex((n) => n.id === lastSelected.id);
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        allNodes.slice(start, end + 1).forEach((n) => n.setSelected(true, false));
      } else {
        event.node.setSelected(true, false);
      }
    } else {
      event.node.setSelected(!event.node.isSelected(), false);
    }
  }, []);

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    setGridApi(api);
  }, []);

  const projection = useTurnGroupProjection({
    rawRows,
    defaultExpanded: false,
    singlesFirst: false,
    onGridReady,
  });
  const {
    rowData: projectedRowData,
    onToggleExpand,
    expandGroup,
    onFilterChanged: onProjectionFilterChanged,
    onGridReady: onProjectionGridReady,
    getRowId: getProjectionRowId,
    getRowHeight: getProjectionRowHeight,
  } = projection;

  const gridOptions: GridOptions = {
    onSelectionChanged,
    onCellClicked,
    // Routed through additionalGridOptions (not the top-level GridView props) because
    // AgGridWrapper only forwards `getRowId` when `isLiveData` is set, and doesn't expose
    // `getRowHeight`/`onFilterChanged` as props at all — additionalGridOptions is spread
    // directly onto AgGridReact regardless, matching the pattern already used by
    // HeatMapTab/ContainerCreate for the same options.
    getRowId: getProjectionRowId,
    getRowHeight: getProjectionRowHeight,
    onFilterChanged: onProjectionFilterChanged,
    rowSelection: {
      mode: 'multiRow',
      checkboxes: false,
      headerCheckbox: false,
      enableClickSelection: false,
    },
  };

  const onAddTurn = useCallback(
    (groupKey: string) => {
      if (!groupKey || newTestCases.some((r) => String(r.id) === groupKey)) return;
      const rows = getCaseRows(groupKey);
      if (rows.length === 0) return;

      if (rows.length === 1 && readTurnIndex(rows[0]) === null) {
        const promoted = promoteToMultiTurn(rows[0]);
        const extraTurn: Record<string, unknown> = {
          id: groupKey,
          _turnIndex: 1,
          testCaseName: rows[0].testCaseName,
          data: {},
        };
        replaceCaseRows(groupKey, [promoted, extraTurn]);
      } else {
        const nextTurn: Record<string, unknown> = {
          id: groupKey,
          _turnIndex: rows.length,
          testCaseName: rows[0].testCaseName,
          data: {},
        };
        replaceCaseRows(groupKey, [...rows, nextTurn]);
      }
      expandGroup(groupKey);
    },
    [newTestCases, getCaseRows, replaceCaseRows, expandGroup],
  );

  const onDeleteTurn = useCallback(
    (row: GroupedGridRow) => {
      const id = row.groupKey;
      const targetIndex = readTurnIndex(row);
      const remaining = getCaseRows(id).filter((r) => readTurnIndex(r) !== targetIndex);
      const renumbered = renumberTurns(remaining);
      const finalRows = renumbered.length === 1 ? [demoteToSingle(renumbered[0])] : renumbered;
      replaceCaseRows(id, finalRows);
      if (finalRows.length > 1) expandGroup(id);
    },
    [getCaseRows, replaceCaseRows, expandGroup],
  );

  const moveTurn = useCallback(
    (row: GroupedGridRow, direction: -1 | 1) => {
      const id = row.groupKey;
      const rows = getCaseRows(id);
      const from = readTurnIndex(row) ?? (row.turnNumber ? row.turnNumber - 1 : 0);
      const to = from + direction;
      replaceCaseRows(id, reorderTurns(rows, from, to));
      expandGroup(id);
    },
    [getCaseRows, replaceCaseRows, expandGroup],
  );

  const onMoveTurnUp = useCallback((row: GroupedGridRow) => moveTurn(row, -1), [moveTurn]);
  const onMoveTurnDown = useCallback((row: GroupedGridRow) => moveTurn(row, 1), [moveTurn]);

  const onOpenDeleteModal = useCallback(
    (data?: DatasetTestCase) => {
      if (!data) return;

      if (newTestCases.some((r) => r.id === data.id)) {
        setNewTestCases((prev) => prev.filter((r) => r.id !== data.id));
        onDirtyChange?.(true);
        return;
      }

      setSelectedTestCase(data);
      setIsDeleteModalOpen(true);
    },
    [newTestCases, onDirtyChange],
  );

  const onCloseDeleteModal = useCallback(() => {
    setSelectedTestCase(undefined);
    setIsDeleteModalOpen(false);
  }, []);

  const onDeleteCase = useCallback(
    (row: GroupedGridRow) => onOpenDeleteModal(rowToDatasetTestCase(row)),
    [onOpenDeleteModal],
  );

  const turnActionHandlers: TurnActionHandlers = useMemo(
    () => ({
      onAddTurn,
      onDeleteCase,
      onDeleteTurn,
      onMoveTurnUp,
      onMoveTurnDown,
    }),
    [onAddTurn, onDeleteCase, onDeleteTurn, onMoveTurnUp, onMoveTurnDown],
  );

  const refreshGrid = useCallback(
    (withRefreshPage?: boolean) => {
      const datasetId = dataset.id;
      if (!datasetId) return;

      const version = ++refreshVersionRef.current;

      setIsLoading(true);
      getTestCases(datasetId, 0, 1000, [], []).then((res) => {
        if (version !== refreshVersionRef.current) return;
        setIsLoading(false);
        let rawData = res == null || res.content.length === 0 ? [] : getDatasetTestCaseGridData(res.content);
        if (dirtyIdsRef.current.size > 0) {
          // Splice in the authoritative (possibly turn-edited) rows for each dirty case, in place
          // of whatever the server just returned for it, so an unsaved multi-turn edit survives a
          // refetch without dropping sibling turns or duplicating the case. Read before
          // `flatRowsRef.current` is overwritten below.
          const injected = new Set<string>();
          rawData = rawData.reduce<Record<string, unknown>[]>((acc, row) => {
            const id = String(row.id);
            if (!dirtyIdsRef.current.has(id)) {
              acc.push(row);
              return acc;
            }
            if (injected.has(id)) return acc;
            injected.add(id);
            acc.push(...getCaseRows(id));
            return acc;
          }, []);
        }
        flatRowsRef.current = rawData;
        bumpRawRows();
      });
      if (withRefreshPage) {
        router.refresh();
      }
    },
    [getCaseRows, bumpRawRows, dataset.id],
  );

  const onApplyImport = useCallback(
    (file: File, mode: TestCaseImportMode, strategy: TestCaseConflictStrategy) => {
      if (!dataset.id) return;

      const body = new FormData();
      body.append('file', file);

      importTestCase(dataset.id, body, mode, strategy).then((res) => {
        if (res?.success) {
          showNotification(
            getSuccessNotification(t(DatasetsI18nKey.ImportSuccess), t(DatasetsI18nKey.ImportSuccessDescription)),
          );
          getDataset(dataset.id as string, '').then((datasetRes) => {
            const updatedDataset = datasetRes?.response;
            if (!updatedDataset) {
              refreshGrid();
              return;
            }
            const freshSchema = updatedDataset.testCaseSchema as TestCaseSchema[] | undefined;
            const schemaChanged = JSON.stringify(freshSchema) !== JSON.stringify(dataset.testCaseSchema);
            if (!schemaChanged) {
              refreshGrid(true);
            } else {
              router.refresh();
            }
          });
        } else {
          showNotification(getErrorNotification(t(DatasetsI18nKey.ImportFailed), res?.errorMessage || 'Unknown error'));
        }
      });
    },
    [dataset.id, dataset.testCaseSchema, refreshGrid, showNotification, t, router],
  );

  const onExport = useCallback(() => {
    if (!dataset.id) return;
    window.open(`${ApiRoute.DatasetsExport}?id=${encodeURIComponent(dataset.id)}`, '_blank');
  }, [dataset.id]);

  const onAddTestCase = useCallback(() => {
    if (!dataset.id) return;
    createTestCase(dataset.id, createNewDatasetTestCaseRow() as Pick<DatasetTestCase, 'testCaseName' | 'data'>).then(
      (res) => {
        if (res?.success) {
          refreshGrid();
        } else {
          showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage));
        }
      },
    );
  }, [dataset.id, refreshGrid, showNotification]);

  const onRemoveTestCase = useCallback(
    async (testCaseId: string) => {
      const response = await removeTestCase(dataset.id as string, testCaseId);
      if (response.success) {
        refreshGrid();
      }
      return response;
    },
    [dataset.id, refreshGrid],
  );

  const onOpenBatchDeleteModal = useCallback(() => {
    setIsBatchDeleteModalOpen(true);
  }, []);

  const onCloseBatchDeleteModal = useCallback(() => {
    setIsBatchDeleteModalOpen(false);
  }, []);

  const onBatchDelete = useCallback(() => {
    const namesToDelete = selectedRows.map((r) => r.testCaseName as string);
    removeMultipleTestCases(dataset.id as string, namesToDelete).then((res) => {
      setIsBatchDeleteModalOpen(false);
      if (res?.success) {
        showNotification(getSuccessNotification(t(DatasetsI18nKey.RemoveSuccess)));
        refreshGrid();
      } else {
        showNotification(getErrorNotification(t(DatasetsI18nKey.RemoveFailed), res?.errorMessage || 'Unknown error'));
      }
    });
  }, [dataset.id, refreshGrid, selectedRows, showNotification, t]);

  const getDirtyTestCases = useCallback((): DatasetTestCase[] => {
    // Collapsed from the authoritative store, not from currently-visible grid nodes: it always
    // holds every turn of every case, so a case whose group is collapsed (and therefore renders
    // only its GROUP summary row) still contributes all its TURN rows here.
    const dirtyIds = new Set<string>([...dirtyIdsRef.current, ...newTestCases.map((r) => String(r.id))]);
    const rows = [...flatRowsRef.current, ...newTestCases].filter((row) => dirtyIds.has(String(row.id)));
    return collapseRowsToDatasetTestCases(rows, perTurnFields);
  }, [newTestCases, perTurnFields]);

  const clearDirtyAndRefresh = useCallback(() => {
    dirtyIdsRef.current.clear();
    setNewTestCases([]);
    onDirtyChange?.(false);
    refreshGrid();
  }, [refreshGrid, onDirtyChange]);

  useEffect(() => {
    if (gridApi && newTestCases.length > 0) {
      gridApi.setGridOption('pinnedTopRowData', newTestCases);
    } else if (gridApi && newTestCases.length === 0) {
      gridApi.setGridOption('pinnedTopRowData', undefined);
    }
  }, [gridApi, newTestCases]);

  const schemaKey = JSON.stringify(dataset.testCaseSchema ?? null);

  useEffect(() => {
    const schemaFieldNames = new Set((dataset.testCaseSchema ?? []).map((s) => s.name));

    // Prune fields the schema dropped from every dirty row in the authoritative store (not just
    // one snapshot per id) so a removed field never leaks into a save payload.
    let prunedAny = false;
    flatRowsRef.current = flatRowsRef.current.map((row) => {
      if (!dirtyIdsRef.current.has(String(row.id))) return row;
      const rowData = row.data as Record<string, unknown> | undefined;
      if (!rowData) return row;
      const hasRemovedFields = Object.keys(rowData).some((key) => !schemaFieldNames.has(key));
      if (!hasRemovedFields) return row;
      prunedAny = true;
      return {
        ...row,
        data: Object.fromEntries(Object.entries(rowData).filter(([key]) => schemaFieldNames.has(key))),
      };
    });
    if (prunedAny) bumpRawRows();

    setNewTestCases((prev) => {
      const needsClean = prev.some((row) => {
        const rowData = row.data as Record<string, unknown> | undefined;
        return rowData && Object.keys(rowData).some((key) => !schemaFieldNames.has(key));
      });
      if (!needsClean) return prev;
      return prev.map((row) => {
        const rowData = row.data as Record<string, unknown> | undefined;
        if (!rowData) return row;
        return {
          ...row,
          data: Object.fromEntries(Object.entries(rowData).filter(([key]) => schemaFieldNames.has(key))),
        };
      });
    });

    refreshGrid();
  }, [schemaKey]);

  useEffect(() => {
    if (!testCasesActionsRef) return;
    testCasesActionsRef.current = { getDirtyTestCases, clearDirtyAndRefresh };
    return () => {
      testCasesActionsRef.current = null;
    };
  }, [testCasesActionsRef, getDirtyTestCases, clearDirtyAndRefresh]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...getDatasetTestCaseColumns(dataset, onCellChange, t, onToggleExpand),
      getTurnActionsColumn(turnActionHandlers),
    ],
    [dataset, onCellChange, t, onToggleExpand, turnActionHandlers],
  );

  return (
    <div className="flex-1 min-h-0">
      {isLoading ? (
        <DialLoader size={40} />
      ) : (
        <ListEntities
          additionalGridOptions={gridOptions}
          listLabel={t(TabsI18nKey.TestCases)}
          emptyDataProps={{ title: t(DatasetsI18nKey.NoTestCases) }}
          onGridReady={onProjectionGridReady}
          rowData={projectedRowData}
          columnDefs={columnDefs}
        >
          <DatasetTestCasesHeader
            datasetId={dataset.id as string}
            onApplyImport={onApplyImport}
            onAdd={onAddTestCase}
            onExport={onExport}
            onBatchDelete={onOpenBatchDeleteModal}
            showBatchDelete={selectedRows.length > 0}
          />
        </ListEntities>
      )}
      {isDeleteModalOpen &&
        createPortal(
          <DeleteConfirmationModal
            entity={selectedTestCase ? { ...selectedTestCase, displayName: selectedTestCase.testCaseName } : undefined}
            view={ApplicationRoute.TestCases}
            onCloseModal={onCloseDeleteModal}
            onRemoveEntity={onRemoveTestCase}
          />,
          document.body,
        )}
      {isBatchDeleteModalOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isBatchDeleteModalOpen}
            header={t(DeleteI18nKey.Title, { entity: t(TabsI18nKey.TestCases) })}
            onConfirm={onBatchDelete}
            onClose={onCloseBatchDeleteModal}
            confirmLabel={t(ButtonsI18nKey.Delete)}
            description={t(DeleteI18nKey.Confirming, { entity: t(DatasetsI18nKey.SelectedTestCases) })}
          />,
          document.body,
        )}
    </div>
  );
};

export default DatasetTestCasesList;
