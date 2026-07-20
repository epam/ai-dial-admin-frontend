/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { FC, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialConfirmationPopup, DialLoader } from '@epam/ai-dial-ui-kit';
import { CellClickedEvent, ColDef, GridApi, GridReadyEvent, IRowNode, SelectionChangedEvent } from 'ag-grid-community';

import {
  createTestCase,
  getDataset,
  getTestCases,
  importTestCase,
  removeMultipleTestCases,
  removeTestCase,
} from '@/src/app/[lang]/datasets/actions';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { getGroupedDatasetTestCaseColumns } from '@/src/components/Datasets/utils/columns';
import {
  createNewDatasetTestCaseRow,
  getDatasetTestCaseGridData,
  rowToDatasetTestCase,
} from '@/src/components/Datasets/utils/data';
import { ensureUniqueTestCaseNames } from '@/src/components/TestSuites/utils/data';
import { useTurnGroupGrid } from '@/src/components/Grid/hooks/use-turn-group-grid';
import { TurnActionHandlers } from '@/src/components/TestSuites/utils/grouped-columns';
import ListEntities from '@/src/components/ListView/List';
import { ApiRoute } from '@/src/constants/api-routes';
import { ButtonsI18nKey, DatasetsI18nKey, DeleteI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetTestCase } from '@/src/models/evaluation/dataset';
import { GridRowType, GroupedGridRow } from '@/src/models/evaluation/test-case-grouping';
import { ApplicationRoute } from '@/src/types/routes';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import DatasetTestCasesHeader from './Header';
import { useRouter } from 'next/navigation';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';

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

  const gridApiRef = useRef<GridApi | null>(null);
  const [newTestCases, setNewTestCases] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<DatasetTestCase | undefined>(undefined);
  const [caseToDelete, setCaseToDelete] = useState<GroupedGridRow | null>(null);
  const [selectedRows, setSelectedRows] = useState<DatasetTestCase[]>([]);
  const onRemoveCaseRef = useRef<(data?: DatasetTestCase) => void>(() => {});
  const dirtyRowsRef = useRef<Map<string, Record<string, unknown>>>(new Map());

  const updateData = useCallback(
    (row: Record<string, unknown>) => {
      if (newTestCases.some((r) => r.id === row.id)) {
        setNewTestCases((prev) => prev.map((r) => (r.id === row.id ? { ...row } : r)));
      } else {
        dirtyRowsRef.current.set(String(row.id), { ...row });
      }
      onDirtyChange?.(true);
    },
    [newTestCases, onDirtyChange],
  );

  const onCellChange = useCallback(
    (data: Record<string, unknown>, field: string, value: string | number | boolean) => {
      if (!data) return;
      data[field] = value;
      if (field !== 'testCaseName' && field !== 'multiTurnId' && field !== 'turnIndex' && data.data != null) {
        data.data = { ...(data.data as Record<string, unknown>), [field]: value };
      }
      updateData(data);
    },
    [updateData],
  );

  const refreshGrid = useCallback(
    (withRefreshPage?: boolean) => {
      setIsLoading(true);
      getTestCases(dataset.id, 0, 1000, [], []).then((res) => {
        setIsLoading(false);
        let rows = res == null || res.content.length === 0 ? [] : getDatasetTestCaseGridData(res.content);
        if (dirtyRowsRef.current.size > 0) {
          rows = rows.map((row) => {
            const id = String(row.id);
            return dirtyRowsRef.current.has(id) ? dirtyRowsRef.current.get(id)! : row;
          });
        }
        setData(rows);
      });
      if (withRefreshPage) {
        router.refresh();
      }
    },
    [dataset, router],
  );

  const onError = useCallback(
    (header?: string, message?: string) => showNotification(getErrorNotification(header, message)),
    [showNotification],
  );

  const turnGrid = useTurnGroupGrid({
    rawRows: data,
    datasetId: dataset.id,
    reload: refreshGrid,
    onError,
    rowToEntity: rowToDatasetTestCase,
    onGridReady: (event: GridReadyEvent) => {
      gridApiRef.current = event.api;
    },
  });

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

  const onDeleteCase = useCallback(
    (row: GroupedGridRow) => {
      if (row.rowType === GridRowType.GROUP) {
        setCaseToDelete(row);
      } else {
        onOpenDeleteModal(row as unknown as DatasetTestCase);
      }
    },
    [onOpenDeleteModal],
  );

  const turnHandlers: TurnActionHandlers = useMemo(
    () => ({
      onAddTurn: turnGrid.addTurn,
      onDeleteCase,
      onDeleteTurn: turnGrid.deleteTurn,
      onMoveTurnUp: (row) => turnGrid.moveTurn(row, -1),
      onMoveTurnDown: (row) => turnGrid.moveTurn(row, 1),
    }),
    [turnGrid.addTurn, turnGrid.deleteTurn, turnGrid.moveTurn, onDeleteCase],
  );

  const columnDefs: ColDef[] = useMemo(
    () => getGroupedDatasetTestCaseColumns(dataset, onCellChange, t, turnGrid.onToggleExpand, turnHandlers),
    [dataset, onCellChange, t, turnGrid.onToggleExpand, turnHandlers],
  );

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    setSelectedRows(
      (event.api.getSelectedRows() as GroupedGridRow[]).filter(
        (r) => r.rowType !== GridRowType.TURN,
      ) as DatasetTestCase[],
    );
  }, []);

  const onCellClicked = useCallback((event: CellClickedEvent) => {
    if (event.column.getColId() !== 'id') return;
    if ((event.data as GroupedGridRow)?.rowType === GridRowType.TURN) return;
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

  const gridOptions = useMemo(
    () => ({
      onSelectionChanged,
      onCellClicked,
      onFilterChanged: turnGrid.onFilterChanged,
      getRowId: turnGrid.getRowId,
      getRowHeight: turnGrid.getRowHeight,
      rowSelection: {
        mode: 'multiRow' as const,
        checkboxes: false,
        headerCheckbox: false,
        enableClickSelection: false,
      },
    }),
    [onSelectionChanged, onCellClicked, turnGrid.onFilterChanged, turnGrid.getRowId, turnGrid.getRowHeight],
  );

  const onCloseDeleteModal = useCallback(() => {
    setSelectedTestCase(undefined);
    setIsDeleteModalOpen(false);
  }, []);

  const onApplyImport = useCallback(
    (file: File, mode: TestCaseImportMode, strategy: TestCaseConflictStrategy) => {
      const body = new FormData();
      body.append('file', file);
      importTestCase(dataset.id || '', body, mode, strategy).then((res) => {
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
            const schemaChanged = JSON.stringify(freshSchema) !== JSON.stringify(dataset?.testCaseSchema);
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
    [dataset.id, showNotification, t],
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

  const onConfirmDeleteCase = useCallback(() => {
    if (!caseToDelete || !dataset.id) return;
    const ids = (caseToDelete.turns ?? []).map((turn) => String(turn.id));
    Promise.all(ids.map((id) => removeTestCase(dataset.id as string, id))).then(() => {
      setCaseToDelete(null);
      refreshGrid();
    });
  }, [caseToDelete, dataset.id, refreshGrid]);

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
    const dirty = Array.from(dirtyRowsRef.current.values()).map((row) => rowToDatasetTestCase(row));
    const newCases = newTestCases.map((row) => rowToDatasetTestCase(row));
    return ensureUniqueTestCaseNames([...dirty, ...newCases], data as unknown as DatasetTestCase[]);
  }, [newTestCases, data]);

  const clearDirtyAndRefresh = useCallback(() => {
    dirtyRowsRef.current.clear();
    setNewTestCases([]);
    onDirtyChange?.(false);
    refreshGrid();
  }, [refreshGrid, onDirtyChange]);

  useEffect(() => {
    if (gridApiRef.current && newTestCases.length > 0) {
      gridApiRef.current.setGridOption('pinnedTopRowData', newTestCases);
    } else if (gridApiRef.current && newTestCases.length === 0) {
      gridApiRef.current.setGridOption('pinnedTopRowData', undefined);
    }
  }, [newTestCases]);

  const schemaKey = JSON.stringify(dataset.testCaseSchema ?? null);

  useEffect(() => {
    refreshGrid();
  }, [schemaKey]);

  useEffect(() => {
    if (!testCasesActionsRef) return;
    testCasesActionsRef.current = { getDirtyTestCases, clearDirtyAndRefresh };
    return () => {
      testCasesActionsRef.current = null;
    };
  }, [testCasesActionsRef, getDirtyTestCases, clearDirtyAndRefresh]);

  useEffect(() => {
    onRemoveCaseRef.current = onOpenDeleteModal;
  }, [onOpenDeleteModal]);

  return (
    <div className="flex-1 min-h-0">
      {isLoading ? (
        <DialLoader size={40} />
      ) : (
        <ListEntities
          additionalGridOptions={gridOptions}
          listLabel={t(TabsI18nKey.TestCases)}
          emptyDataProps={{ title: t(DatasetsI18nKey.NoTestCases) }}
          onGridReady={turnGrid.onGridReady}
          rowData={turnGrid.rowData}
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
      {caseToDelete &&
        createPortal(
          <DialConfirmationPopup
            open={!!caseToDelete}
            header={t(DeleteI18nKey.Title, { entity: t(TabsI18nKey.TestCases) })}
            onConfirm={onConfirmDeleteCase}
            onClose={() => setCaseToDelete(null)}
            confirmLabel={t(ButtonsI18nKey.Delete)}
            description={t(DeleteI18nKey.Confirming, { entity: (caseToDelete.testCaseName as string) || '' })}
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
