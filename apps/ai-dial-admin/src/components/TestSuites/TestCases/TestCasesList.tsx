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
  bulkDeleteDatasetTestCases,
  createDatasetTestCase,
  getDatasetTestCases,
  importDatasetTestCases,
  removeDatasetTestCase as removeDatasetTestCaseAction,
} from '@/src/app/[lang]/datasets/actions';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import ListEntities from '@/src/components/ListView/List';
import { getTestCaseColumns } from '@/src/components/TestSuites/utils/columns';
import { createNewTestCaseRow, getTestCaseGridData, rowToTestCase } from '@/src/components/TestSuites/utils/data';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { ApiRoute } from '@/src/constants/api-routes';
import { getRemoveOperation } from '@/src/constants/grid-columns/actions';
import { ButtonsI18nKey, DeleteI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { TestCase, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import HeaderButtons from './Header';
import TestCasesSchemaModal from './TestCasesSchemaModal';

export interface TestCasesActions {
  getDirtyTestCases: () => TestCase[];
  clearDirtyAndRefresh: () => void;
}

interface Props {
  datasetId: string;
  schema: TestCaseSchema[];
  fileScopeId: string;
  fileScopeView: ApplicationRoute;
  readOnly?: boolean;
  onChangeSchema?: (schema: TestCaseSchema[]) => void;
  testCasesActionsRef?: RefObject<TestCasesActions | null>;
  onDirtyChange?: (hasDirty: boolean) => void;
  disabledIds?: Set<string>;
  onToggleDisabled?: (id: string, nextDisabled: boolean) => void;
}

const TestCasesList: FC<Props> = ({
  datasetId,
  schema,
  fileScopeId,
  fileScopeView,
  readOnly = false,
  onChangeSchema,
  testCasesActionsRef,
  onDirtyChange,
  disabledIds,
  onToggleDisabled,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [newTestCases, setNewTestCases] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | undefined>(undefined);
  const [selectedRows, setSelectedRows] = useState<TestCase[]>([]);
  const onRemoveCaseRef = useRef<(data?: TestCase) => void>(() => {});
  const dirtyRowsRef = useRef<Map<string, Record<string, unknown>>>(new Map());

  const onOpenSchemaModal = useCallback(() => {
    setIsSchemaModalOpen(true);
  }, []);

  const onCloseSchemaModal = useCallback(() => {
    setIsSchemaModalOpen(false);
  }, []);

  const onApplySchemaChange = useCallback(
    (testCaseSchema: TestCaseSchema[]) => {
      onChangeSchema?.(testCaseSchema);
      setIsSchemaModalOpen(false);
    },
    [onChangeSchema],
  );

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

  const onCellChange = useCallback(
    (rowData: Record<string, unknown>, field: string, value: string | number | boolean) => {
      if (!rowData || readOnly) return;
      rowData[field] = value;
      if (field !== 'testCaseName' && rowData.data != null) {
        rowData.data = { ...(rowData.data as Record<string, unknown>), [field]: value };
      }
      updateData(rowData);
    },
    [updateData, readOnly],
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

  const gridOptions: GridOptions = useMemo(
    () => ({
      onSelectionChanged,
      onCellClicked,
      rowSelection: {
        mode: 'multiRow',
        checkboxes: false,
        headerCheckbox: false,
        enableClickSelection: false,
      },
    }),
    [onSelectionChanged, onCellClicked],
  );

  const onOpenDeleteModal = useCallback(
    (rowData?: TestCase) => {
      if (!rowData) return;

      if (newTestCases.some((r) => r.id === rowData.id)) {
        setNewTestCases((prev) => prev.filter((r) => r.id !== rowData.id));
        onDirtyChange?.(true);
        return;
      }

      setSelectedTestCase(rowData);
      setIsDeleteModalOpen(true);
    },
    [newTestCases, onDirtyChange],
  );

  const onCloseDeleteModal = useCallback(() => {
    setSelectedTestCase(undefined);
    setIsDeleteModalOpen(false);
  }, []);

  const stableOnRemoveCase = useCallback((rowData?: TestCase) => {
    onRemoveCaseRef.current(rowData);
  }, []);

  const refreshGrid = useCallback(
    (withRefreshPage?: boolean) => {
      if (!datasetId) {
        setData([]);
        setColumnDefs([]);
        return;
      }
      setIsLoading(true);
      getDatasetTestCases(datasetId, 0, 1000, [], []).then((res) => {
        setIsLoading(false);
        let rows = res == null || res.content.length === 0 ? [] : getTestCaseGridData(res?.content || []);
        if (dirtyRowsRef.current.size > 0) {
          rows = rows.map((row) => {
            const id = String(row.id);
            return dirtyRowsRef.current.has(id) ? dirtyRowsRef.current.get(id)! : row;
          });
        }
        setData(rows);
        const baseCols = getTestCaseColumns(
          { schema, fileScopeId, fileScopeView, readOnly, disabledIds, onToggleDisabled },
          onCellChange,
          t,
        );
        const actionCols = readOnly
          ? []
          : [
              {
                ...ONE_ACTION_COLUMN(getRemoveOperation(stableOnRemoveCase, void 0, 'text-error w-4 h-4')),
                colId: 'action-remove',
              } as ColDef,
            ];
        setColumnDefs([...baseCols, ...actionCols]);
      });
      if (withRefreshPage) {
        router.refresh();
      }
    },
    [
      datasetId,
      schema,
      fileScopeId,
      fileScopeView,
      readOnly,
      onCellChange,
      stableOnRemoveCase,
      t,
      disabledIds,
      onToggleDisabled,
    ],
  );

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    gridApiRef.current = api;
    setGridApi(api);
  }, []);

  const onApplyImport = useCallback(
    (file: File, mode: TestCaseImportMode, strategy: TestCaseConflictStrategy) => {
      if (!datasetId) return;
      const body = new FormData();
      body.append('file', file);

      importDatasetTestCases(datasetId, body, mode, strategy).then((res) => {
        if (res?.success) {
          showNotification(
            getSuccessNotification(t(TestSuitesI18nKey.ImportSuccess), t(TestSuitesI18nKey.ImportSuccessDescription)),
          );
          if (res.status === 202) {
            setIsLoading(true);
            router.refresh();
          } else {
            refreshGrid();
          }
        } else {
          showNotification(
            getErrorNotification(t(TestSuitesI18nKey.ImportFailed), res?.errorMessage || 'Unknown error'),
          );
        }
      });
    },
    [datasetId, refreshGrid, showNotification, t, router],
  );

  const onExport = useCallback(() => {
    if (!datasetId) return;
    window.open(`${ApiRoute.DatasetsExport}?id=${encodeURIComponent(datasetId)}`, '_blank');
  }, [datasetId]);

  const onAddTestCase = useCallback(() => {
    if (!datasetId) return;
    createDatasetTestCase(datasetId, createNewTestCaseRow(), true).then((res) => {
      if (res?.success) {
        refreshGrid();
      } else {
        showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage));
      }
    });
  }, [datasetId, refreshGrid, showNotification]);

  const onRemoveTestCase = useCallback(
    async (testCaseId: string) => {
      const response = await removeDatasetTestCaseAction(datasetId, testCaseId);
      if (response.success) {
        refreshGrid();
      }
      return response;
    },
    [datasetId, refreshGrid],
  );

  const onOpenBatchDeleteModal = useCallback(() => {
    setIsBatchDeleteModalOpen(true);
  }, []);

  const onCloseBatchDeleteModal = useCallback(() => {
    setIsBatchDeleteModalOpen(false);
  }, []);

  const onBatchDelete = useCallback(() => {
    const ids = selectedRows.map((r) => r.id);
    bulkDeleteDatasetTestCases(datasetId, { ids }).then((res) => {
      setIsBatchDeleteModalOpen(false);
      if (res?.success) {
        showNotification(getSuccessNotification(t(TestSuitesI18nKey.RemoveSuccess)));
        refreshGrid();
      } else {
        showNotification(getErrorNotification(t(TestSuitesI18nKey.RemoveFailed), res?.errorMessage || 'Unknown error'));
      }
    });
  }, [datasetId, refreshGrid, selectedRows, showNotification, t]);

  const getDirtyTestCases = useCallback((): TestCase[] => {
    const dirty = Array.from(dirtyRowsRef.current.values()).map((row) => rowToTestCase(row));
    const newCases = newTestCases.map((row) => rowToTestCase(row));
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

  const schemaKey = JSON.stringify(schema);
  const disabledIdsKey = disabledIds ? Array.from(disabledIds).sort().join('|') : '';

  useEffect(() => {
    refreshGrid();
  }, [schemaKey, datasetId, disabledIdsKey]);

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
          emptyDataProps={{ title: t(TestSuitesI18nKey.NoTestCases) }}
          onGridReady={onGridReady}
          rowData={data}
          columnDefs={columnDefs}
        >
          {!readOnly && (
            <HeaderButtons
              selectedTestSuiteId={datasetId}
              onApplyImport={onApplyImport}
              onAdd={onAddTestCase}
              onExport={onExport}
              onOpenSchemaModal={onChangeSchema ? onOpenSchemaModal : undefined}
              onBatchDelete={onOpenBatchDeleteModal}
              showBatchDelete={selectedRows.length > 0}
            />
          )}
        </ListEntities>
      )}
      {isSchemaModalOpen &&
        createPortal(
          <TestCasesSchemaModal
            isModalOpen={isSchemaModalOpen}
            schema={schema}
            onClose={onCloseSchemaModal}
            onApply={onApplySchemaChange}
          />,
          document.body,
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
