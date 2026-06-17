/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { FC, RefObject, useCallback, useEffect, useRef, useState } from 'react';
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
import { getDatasetTestCaseColumns } from '@/src/components/Datasets/utils/columns';
import {
  createNewDatasetTestCaseRow,
  getDatasetTestCaseGridData,
  rowToDatasetTestCase,
} from '@/src/components/Datasets/utils/data';
import ListEntities from '@/src/components/ListView/List';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { ApiRoute } from '@/src/constants/api-routes';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { ButtonsI18nKey, DatasetsI18nKey, DeleteI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset, DatasetTestCase } from '@/src/models/evaluation/dataset';
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

  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [newTestCases, setNewTestCases] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<DatasetTestCase | undefined>(undefined);
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
      if (field !== 'testCaseName' && data.data != null) {
        data.data = { ...(data.data as Record<string, unknown>), [field]: value };
      }
      updateData(data);
    },
    [updateData],
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

  const gridOptions = {
    onSelectionChanged,
    onCellClicked,
    rowSelection: {
      mode: 'multiRow' as const,
      checkboxes: false,
      headerCheckbox: false,
      enableClickSelection: false,
    },
  };

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

  const stableOnRemoveCase = useCallback((data?: DatasetTestCase) => {
    onRemoveCaseRef.current(data);
  }, []);

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
        setColumnDefs([
          ...getDatasetTestCaseColumns(dataset, onCellChange, t),
          {
            ...ONE_ACTION_COLUMN(getRemoveOperation(stableOnRemoveCase, void 0, 'text-error w-4 h-4')),
            colId: 'action-remove',
          },
        ]);
      });
      if (withRefreshPage) {
        router.refresh();
      }
    },
    [dataset, onCellChange, stableOnRemoveCase, t],
  );

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    gridApiRef.current = api;
    setGridApi(api);
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
    return [...dirty, ...newCases];
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
          onGridReady={onGridReady}
          rowData={data}
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
