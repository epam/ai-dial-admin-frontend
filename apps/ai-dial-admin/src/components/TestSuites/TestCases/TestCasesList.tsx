/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useRouter } from 'next/navigation';
import { FC, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialConfirmationPopup, DialEllipsisTooltip, DialLoader, DialTag, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconDatabaseExport, IconExternalLink } from '@tabler/icons-react';
import {
  CellClickedEvent,
  CellValueChangedEvent,
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
  publishDataset,
  removeDataset,
  removeMultipleTestCases,
  removeTestCase,
} from '@/src/app/[lang]/datasets/actions';
import { detachDataset, updateTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { useTurnGroupProjection } from '@/src/components/Grid/hooks/use-turn-group-projection';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import ListEntities from '@/src/components/ListView/List';
import TryOut from '@/src/components/TestSuites/RequestTemplate/components/TryOut';
import { getTestCaseColumns } from '@/src/components/TestSuites/utils/columns';
import {
  collapseRowsToTestCases,
  createNewTestCaseRow,
  getTestCaseGridData,
  rowToTestCase,
} from '@/src/components/TestSuites/utils/data';
import { getTurnActionsColumn, TurnActionHandlers } from '@/src/components/TestSuites/utils/grouped-columns';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { ApiRoute } from '@/src/constants/api-routes';
import { getTryOutOperation } from '@/src/constants/grid-columns/actions';
import { ButtonsI18nKey, DatasetsI18nKey, DeleteI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetVisibility } from '@/src/models/evaluation/dataset';
import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';
import { TestCase, TestSuite } from '@/src/models/evaluation/test-suite';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { ApplicationRoute } from '@/src/types/routes';
import {
  demoteToSingle,
  promoteToMultiTurn,
  readTurnIndex,
  renumberTurns,
  reorderTurns,
} from '@/src/utils/evaluation/test-case-grouping';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import HeaderButtons from './Header';

/** A GROUP row's own `enabled` is unset (case-level state lives on its turns); fall back to turn 0. */
const resolveRowEnabled = (row: Record<string, unknown>): boolean => {
  if (typeof row.enabled === 'boolean') return row.enabled;
  const turns = row.turns as Record<string, unknown>[] | undefined;
  return Boolean(turns?.[0]?.enabled);
};

export interface TestCasesActions {
  getDirtyTestCases: () => TestCase[];
  clearDirtyAndRefresh: () => void;
}

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  testCasesActionsRef?: RefObject<TestCasesActions | null>;
  onDirtyChange?: (hasDirty: boolean) => void;
  onOpenSchemaModal?: () => void;
  isReadOnly?: boolean;
  dataset: Dataset | null;
  suiteEtag?: string;
  onChangeDataset?: (dataset: Dataset, etag?: string) => void;
}

const TestCasesList: FC<Props> = ({
  selectedTestSuite,
  onChange,
  testCasesActionsRef,
  onDirtyChange,
  onOpenSchemaModal,
  isReadOnly,
  suiteEtag,
  dataset,
  onChangeDataset,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { sidebar, sidebarOpen, toggleSidebar } = useAppContext();

  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [newTestCases, setNewTestCases] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | undefined>(undefined);
  const [selectedRows, setSelectedRows] = useState<TestCase[]>([]);
  const dirtyRowsRef = useRef<Map<string, Record<string, unknown>>>(new Map());
  const refreshVersionRef = useRef(0);

  const updateData = useCallback(
    (row: Record<string, unknown>) => {
      if (newTestCases.some((r) => r.id === row.id)) {
        setNewTestCases((prev) => prev.map((r) => (r.id === row.id ? ({ ...row } as Record<string, unknown>) : r)));
      } else {
        const id = String(row.id);
        dirtyRowsRef.current.set(id, { ...row });
      }
      onDirtyChange?.(true);
    },
    [newTestCases, onDirtyChange],
  );

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      const col = event.column?.getColId();
      if (col !== 'enabled') return;

      const api = gridApiRef.current;
      if (api) api.refreshClientSideRowModel('filter');

      const rowId = String(event.data.id);
      const isNewCase = newTestCases.some((r) => r.id === rowId);

      if (isNewCase) {
        onCellChange(event.data, col, event.newValue);
        return;
      }

      // Derive disabled IDs from current grid state to handle batch updates
      // (select all / deselect all) correctly. Reading from selectedTestSuite
      // closure would be stale when multiple cellValueChanged events fire
      // synchronously before React processes any state update.
      const newDisabledIds: string[] = [];
      api?.forEachNode((node) => {
        if (!node.data || node.rowPinned) return;
        if (!resolveRowEnabled(node.data)) newDisabledIds.push(String(node.data.id));
      });

      onChange({ ...selectedTestSuite, disabledTestCaseIds: newDisabledIds }, true);
      onDirtyChange?.(true);
    },
    [newTestCases, selectedTestSuite, onChange, onDirtyChange],
  );

  const onCellChange = useCallback(
    (data: Record<string, unknown>, field: string, value: string | number | boolean) => {
      if (!data) return;
      data[field] = value;
      if (field !== 'testCaseName' && field !== 'enabled' && field !== '_turnIndex' && data.data != null) {
        data.data = { ...(data.data as Record<string, unknown>), [field]: value };
      }

      updateData(data);
    },
    [updateData],
  );

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    setSelectedRows(event.api.getSelectedRows() as TestCase[]);
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
    gridApiRef.current = api;
    setGridApi(api);
  }, []);

  const projection = useTurnGroupProjection({
    rawRows: data,
    defaultExpanded: false,
    singlesFirst: false,
    onGridReady,
  });
  const {
    rowData: projectedRowData,
    groups,
    onToggleExpand,
    expandGroup,
    onFilterChanged: onProjectionFilterChanged,
    onGridReady: onProjectionGridReady,
    getRowId: getProjectionRowId,
    getRowHeight: getProjectionRowHeight,
  } = projection;

  const gridOptions: GridOptions = {
    onCellValueChanged,
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

  /** Gather a case's current rows: live (possibly edited) turn/single grid rows when rendered, else
   * the collapsed GROUP row's own `turns` snapshot (never individually edited while collapsed). */
  const gatherLiveRows = useCallback((id: string): Record<string, unknown>[] => {
    const collected: Record<string, unknown>[] = [];
    let groupRow: GroupedGridRow | undefined;
    gridApiRef.current?.forEachNode((node) => {
      const row = node.data as GroupedGridRow | undefined;
      if (!row || String(row.id) !== id) return;
      if (row.rowType === GridRowType.GROUP) {
        groupRow = row;
      } else {
        collected.push(row);
      }
    });
    if (collected.length > 0) return collected;
    return groupRow?.turns ?? [];
  }, []);

  const replaceCaseRows = useCallback(
    (id: string, newRows: Record<string, unknown>[]) => {
      setData((prev) => {
        const insertAt = prev.findIndex((row) => String(row.id) === id);
        const rest = prev.filter((row) => String(row.id) !== id);
        const at = insertAt === -1 ? rest.length : Math.min(insertAt, rest.length);
        return [...rest.slice(0, at), ...newRows, ...rest.slice(at)];
      });
      dirtyRowsRef.current.set(id, newRows[0] ?? {});
      onDirtyChange?.(true);
    },
    [onDirtyChange],
  );

  const onAddTurn = useCallback(
    (groupKey: string) => {
      if (!groupKey || newTestCases.some((r) => String(r.id) === groupKey)) return;
      const rows = gatherLiveRows(groupKey);
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
    [newTestCases, gatherLiveRows, replaceCaseRows, expandGroup],
  );

  const onDeleteTurn = useCallback(
    (row: GroupedGridRow) => {
      const id = row.groupKey;
      const targetIndex = readTurnIndex(row);
      const remaining = gatherLiveRows(id).filter((r) => readTurnIndex(r) !== targetIndex);
      const renumbered = renumberTurns(remaining);
      const finalRows = renumbered.length === 1 ? [demoteToSingle(renumbered[0])] : renumbered;
      replaceCaseRows(id, finalRows);
      if (finalRows.length > 1) expandGroup(id);
    },
    [gatherLiveRows, replaceCaseRows, expandGroup],
  );

  const moveTurn = useCallback(
    (row: GroupedGridRow, direction: -1 | 1) => {
      const id = row.groupKey;
      const rows = gatherLiveRows(id);
      const from = readTurnIndex(row) ?? (row.turnNumber ? row.turnNumber - 1 : 0);
      const to = from + direction;
      replaceCaseRows(id, reorderTurns(rows, from, to));
      expandGroup(id);
    },
    [gatherLiveRows, replaceCaseRows, expandGroup],
  );

  const onMoveTurnUp = useCallback((row: GroupedGridRow) => moveTurn(row, -1), [moveTurn]);
  const onMoveTurnDown = useCallback((row: GroupedGridRow) => moveTurn(row, 1), [moveTurn]);

  const onOpenDeleteModal = useCallback(
    (data?: TestCase) => {
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

  const onDeleteCase = useCallback((row: GroupedGridRow) => onOpenDeleteModal(rowToTestCase(row)), [onOpenDeleteModal]);

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

  const onOpenTryOutSidebar = useCallback(
    (e?: TestCase) => {
      sidebar.showSidebar(
        <SaveValidationContextProvider>
          <TryOut testSuite={selectedTestSuite} testCaseId={e?.id || ''} />
        </SaveValidationContextProvider>,
        'w-1/2 max-w-[800px]',
      );
      if (sidebarOpen) {
        sidebar.toggleIsMenuClosed?.();
        toggleSidebar();
      }
    },
    [selectedTestSuite.id, sidebar, sidebarOpen, toggleSidebar],
  );

  const refreshGrid = useCallback(
    (withRefreshPage?: boolean) => {
      const datasetId = selectedTestSuite.datasetId;
      if (!datasetId) return;

      const version = ++refreshVersionRef.current;

      setIsLoading(true);
      getTestCases(datasetId, 0, 1000, [], []).then((res) => {
        if (version !== refreshVersionRef.current) return;
        setIsLoading(false);
        const disabledIds = selectedTestSuite.disabledTestCaseIds ?? [];
        let rawData = res == null || res.content.length === 0 ? [] : getTestCaseGridData(res?.content || []);
        rawData = rawData.map((row) => ({
          ...row,
          enabled: !disabledIds.includes(String(row.id)),
        }));
        if (dirtyRowsRef.current.size > 0) {
          // Splice in the live (possibly turn-edited) rows for each dirty case, in place of
          // whatever the server just returned for it, so an unsaved multi-turn edit survives a
          // refetch without dropping sibling turns or duplicating the case.
          const dirtyIds = new Set(dirtyRowsRef.current.keys());
          const injected = new Set<string>();
          rawData = rawData.reduce<Record<string, unknown>[]>((acc, row) => {
            const id = String(row.id);
            if (!dirtyIds.has(id)) {
              acc.push(row);
              return acc;
            }
            if (injected.has(id)) return acc;
            injected.add(id);
            acc.push(...gatherLiveRows(id));
            return acc;
          }, []);
        }
        setData(rawData);
      });
      if (withRefreshPage) {
        router.refresh();
      }
    },
    [gatherLiveRows, selectedTestSuite],
  );

  const onApplyImport = useCallback(
    (file: File, mode: TestCaseImportMode, strategy: TestCaseConflictStrategy) => {
      const datasetId = selectedTestSuite.datasetId;
      if (!datasetId) return;

      const body = new FormData();
      body.append('file', file);

      importTestCase(datasetId, body, mode, strategy).then((res) => {
        if (res?.success) {
          showNotification(
            getSuccessNotification(t(TestSuitesI18nKey.ImportSuccess), t(TestSuitesI18nKey.ImportSuccessDescription)),
          );
          getDataset(datasetId, '').then((datasetRes) => {
            const updatedDataset = datasetRes?.response;
            if (updatedDataset) {
              onChangeDataset?.(updatedDataset as Dataset, datasetRes?.etag);
            }
            refreshGrid(true);
          });
        } else {
          showNotification(
            getErrorNotification(t(TestSuitesI18nKey.ImportFailed), res?.errorMessage || 'Unknown error'),
          );
        }
      });
    },
    [refreshGrid, selectedTestSuite.datasetId, showNotification, t, onChangeDataset],
  );

  const onExport = useCallback(() => {
    const datasetId = selectedTestSuite.datasetId;
    if (!datasetId) return;

    window.open(`${ApiRoute.DatasetsExport}?id=${encodeURIComponent(datasetId)}`, '_blank');
  }, [selectedTestSuite.datasetId]);

  const onAddTestCase = useCallback(() => {
    const datasetId = selectedTestSuite.datasetId;
    if (!datasetId) return;
    createTestCase(datasetId, createNewTestCaseRow()).then((res) => {
      if (res?.success) {
        refreshGrid();
      } else {
        showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage));
      }
    });
  }, [selectedTestSuite.datasetId, refreshGrid, showNotification]);

  const onRemoveTestCase = useCallback(
    async (testCaseId: string) => {
      const datasetId = selectedTestSuite.datasetId;
      if (!datasetId) return { success: false };
      const response = await removeTestCase(datasetId, testCaseId);
      if (response.success) {
        refreshGrid();
      }
      return response;
    },
    [refreshGrid, selectedTestSuite.datasetId],
  );

  const onOpenBatchDeleteModal = useCallback(() => {
    setIsBatchDeleteModalOpen(true);
  }, []);

  const onCloseBatchDeleteModal = useCallback(() => {
    setIsBatchDeleteModalOpen(false);
  }, []);

  const onBatchDelete = useCallback(() => {
    const datasetId = selectedTestSuite.datasetId;
    if (!datasetId) return;
    const namesToDelete = selectedRows.map((r) => r.testCaseName as string);
    removeMultipleTestCases(datasetId, namesToDelete).then((res) => {
      setIsBatchDeleteModalOpen(false);
      if (res?.success) {
        showNotification(getSuccessNotification(t(TestSuitesI18nKey.RemoveSuccess)));
        refreshGrid();
      } else {
        showNotification(getErrorNotification(t(TestSuitesI18nKey.RemoveFailed), res?.errorMessage || 'Unknown error'));
      }
    });
  }, [refreshGrid, selectedRows, selectedTestSuite.datasetId, showNotification, t]);

  const getDirtyTestCases = useCallback((): TestCase[] => {
    const dirtyIds = new Set<string>([...dirtyRowsRef.current.keys(), ...newTestCases.map((r) => r.id as string)]);
    const rowsById = new Map<string, Record<string, unknown>[]>();
    gridApiRef.current?.forEachNode((node) => {
      const row = node.data as Record<string, unknown> | undefined;
      if (row && dirtyIds.has(row.id as string) && row.rowType !== GridRowType.GROUP) {
        const bucket = rowsById.get(row.id as string) ?? [];
        bucket.push(row);
        rowsById.set(row.id as string, bucket);
      }
    });
    return collapseRowsToTestCases([...rowsById.values()].flat());
  }, [newTestCases]);

  const clearDirtyAndRefresh = useCallback(() => {
    dirtyRowsRef.current.clear();
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

  const datasetId = selectedTestSuite.datasetId;
  const schemaKey = JSON.stringify(dataset?.testCaseSchema ?? null);

  useEffect(() => {
    if (!datasetId) return;

    const schemaFieldNames = new Set((dataset?.testCaseSchema ?? []).map((s) => s.name));

    dirtyRowsRef.current.forEach((row, id) => {
      const rowData = row.data as Record<string, unknown> | undefined;
      if (!rowData) return;
      const hasRemovedFields = Object.keys(rowData).some((key) => !schemaFieldNames.has(key));
      if (hasRemovedFields) {
        dirtyRowsRef.current.set(id, {
          ...row,
          data: Object.fromEntries(Object.entries(rowData).filter(([key]) => schemaFieldNames.has(key))),
        });
      }
    });

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
  }, [datasetId, schemaKey, isReadOnly]);

  useEffect(() => {
    if (!testCasesActionsRef) return;
    testCasesActionsRef.current = {
      getDirtyTestCases,
      clearDirtyAndRefresh,
    };
    return () => {
      testCasesActionsRef.current = null;
    };
  }, [testCasesActionsRef, getDirtyTestCases, clearDirtyAndRefresh]);

  const onPublish = useCallback(
    async (name: string, description?: string) => {
      const datasetId = selectedTestSuite.datasetId;
      if (!datasetId) return;
      const res = await publishDataset(datasetId, { name, description });
      if (res.success) {
        showNotification(getSuccessNotification(t(TestSuitesI18nKey.PublishSuccess)));
        getDataset(datasetId, DEFAULT_ETAG).then((datasetRes) => {
          if (datasetRes?.response) {
            onChangeDataset?.(datasetRes.response as Dataset, datasetRes?.etag);
          }
        });
        router.refresh();
      } else {
        showNotification(getErrorNotification(t(TestSuitesI18nKey.PublishFailed), res.errorMessage));
      }
    },
    [selectedTestSuite.datasetId, showNotification, t, router, onChangeDataset],
  );

  const onAttachDataset = useCallback(
    async (newDatasetId: string) => {
      if (!suiteEtag) return;

      if (dataset?.visibility === DatasetVisibility.PRIVATE && dataset.id) {
        const deleteRes = await removeDataset(dataset.id);
        if (!deleteRes.success) {
          showNotification(getErrorNotification(deleteRes.errorHeader, deleteRes.errorMessage));
          return;
        }
      }

      const res = await updateTestSuite({ ...selectedTestSuite, datasetId: newDatasetId }, suiteEtag);
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    },
    [selectedTestSuite, suiteEtag, dataset, showNotification, router],
  );

  const onDetachDatasetCallback = useCallback(async () => {
    const suiteId = selectedTestSuite.id;
    if (!suiteId) return;
    const res = await detachDataset(suiteId);
    if (res.success) {
      showNotification(getSuccessNotification(t(TestSuitesI18nKey.DetachSuccess)));
      router.refresh();
    } else {
      showNotification(getErrorNotification(t(TestSuitesI18nKey.DetachFailed), res.errorMessage));
    }
  }, [selectedTestSuite.id, showNotification, t, router]);

  const activeSchema = dataset?.testCaseSchema;

  const columnDefs = useMemo<ColDef[]>(
    () => [
      ...getTestCaseColumns(selectedTestSuite, onCellChange, t, activeSchema, isReadOnly, onToggleExpand),
      { ...ONE_ACTION_COLUMN(getTryOutOperation(onOpenTryOutSidebar)), colId: 'action-tryout' },
      ...(!isReadOnly ? [getTurnActionsColumn(turnActionHandlers)] : []),
    ],
    [
      selectedTestSuite,
      onCellChange,
      t,
      activeSchema,
      isReadOnly,
      onToggleExpand,
      onOpenTryOutSidebar,
      turnActionHandlers,
    ],
  );

  const totalCount = groups.length + newTestCases.length;
  const isPrivate = dataset?.visibility === DatasetVisibility.PRIVATE;

  const publicTag = !isPrivate && dataset?.visibility && (
    <button
      className="flex items-center gap-1 bg-accent-secondary-alpha border border-accent-secondary px-2 py-1 rounded-sm shrink-0 cursor-pointer"
      onClick={() => onOpenInNewTab(ApplicationRoute.Datasets, { id: selectedTestSuite.datasetId })}
    >
      <IconDatabaseExport size={12} className="text-accent-secondary" />
      <DialEllipsisTooltip className="tiny max-w-[600px]" text={dataset?.name || ''} />
      <IconExternalLink size={12} />
    </button>
  );

  const visibilityTag =
    dataset?.visibility &&
    (isPrivate ? (
      <DialTooltip tooltip={t(TestSuitesI18nKey.TestCasesPrivateTagTooltip)} triggerClassName="flex items-center">
        <DialTag
          label={t(DatasetsI18nKey.VisibilityPrivate)}
          className="bg-accent-tertiary-alpha border border-accent-tertiary rounded-sm shrink-0"
        />
      </DialTooltip>
    ) : (
      publicTag
    ));

  const listLabel = (
    <div className="flex items-center gap-2">
      {t(TabsI18nKey.TestCases)}: {totalCount}
      {visibilityTag}
    </div>
  );

  const listDescription = !isPrivate && dataset?.visibility && (
    <span className="dial-small-text text-secondary">{t(TestSuitesI18nKey.PublicDatasetInfo)}</span>
  );

  return (
    <div className="flex-1 min-h-0">
      {isLoading ? (
        <DialLoader size={40} />
      ) : (
        <ListEntities
          additionalGridOptions={gridOptions}
          listLabel={listLabel}
          description={listDescription}
          emptyDataProps={{
            title: t(TestSuitesI18nKey.NoTestCases),
            description: t(TestSuitesI18nKey.NoTestCasesDescription),
          }}
          onGridReady={onProjectionGridReady}
          rowData={projectedRowData}
          columnDefs={columnDefs}
        >
          <HeaderButtons
            datasetId={selectedTestSuite.datasetId as string}
            onApplyImport={onApplyImport}
            onAdd={onAddTestCase}
            onExport={onExport}
            onOpenSchemaModal={onOpenSchemaModal}
            onBatchDelete={onOpenBatchDeleteModal}
            testCaseCount={totalCount}
            showBatchDelete={!isReadOnly && selectedRows.length > 0}
            isReadOnly={isReadOnly}
            onPublish={onPublish}
            onAttachDataset={onAttachDataset}
            onDetachDataset={onDetachDatasetCallback}
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
            description={t(DeleteI18nKey.Confirming, { entity: t(TestSuitesI18nKey.SelectedTestCases) })}
          />,
          document.body,
        )}
    </div>
  );
};

export default TestCasesList;
