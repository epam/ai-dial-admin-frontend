/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useRouter } from 'next/navigation';
import { FC, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import {
  CellValueChangedEvent,
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  SelectionChangedEvent,
} from 'ag-grid-community';

import {
  createTestCase,
  getTestCases,
  importTestCase,
  removeMultipleTestCases,
  removeTestCase,
} from '@/src/app/[lang]/test-suites/actions';
import ListEntities from '@/src/components/ListView/List';
import TryOut from '@/src/components/TestSuites/RequestTemplate/components/TryOut';
import { getTestCaseColumns } from '@/src/components/TestSuites/utils/columns';
import { createNewTestCaseRow, getTestCaseGridData, rowToTestCase } from '@/src/components/TestSuites/utils/data';
import { ONE_ACTION_COLUMN } from '@/src/constants/ag-grid';
import { ApiRoute } from '@/src/constants/api-routes';
import { getRemoveOperation, getTryOutOperation } from '@/src/constants/grid-columns/actions';
import { TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { TestCase, TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { TestCaseConflictStrategy, TestCaseImportMode } from '@/src/types/evaluation';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import HeaderButtons from './Header';
import TestCasesSchemaModal from './TestCasesSchemaModal';

export interface TestCasesActions {
  getDirtyTestCases: () => TestCase[];
  clearDirtyAndRefresh: () => void;
}

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite, isSkipRefresh?: boolean) => void;
  testCasesActionsRef?: RefObject<TestCasesActions | null>;
  onDirtyChange?: (hasDirty: boolean) => void;
}

const TestCasesList: FC<Props> = ({ selectedTestSuite, onChange, testCasesActionsRef, onDirtyChange }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { sidebar, sidebarOpen, toggleSidebar } = useAppContext();

  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);
  const [newTestCases, setNewTestCases] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<TestCase[]>([]);
  const onRemoveCaseRef = useRef<(data?: TestCase) => void>(() => {});
  const dirtyRowsRef = useRef<Map<string, Record<string, unknown>>>(new Map());
  const pendingRefreshRef = useRef(false);

  const onOpenSchemaModal = useCallback(() => {
    setIsSchemaModalOpen(true);
  }, []);

  const onCloseSchemaModal = useCallback(() => {
    setIsSchemaModalOpen(false);
  }, []);

  const onChangeTestCaseSchema = useCallback(
    (testCaseSchema: TestCaseSchema[]) => {
      onChange({ ...selectedTestSuite, testCaseSchema });
      pendingRefreshRef.current = true;
    },
    [selectedTestSuite, onChange],
  );

  const updateData = useCallback(
    (row: Record<string, unknown>) => {
      if (newTestCases.some((r) => r.id === row.id)) {
        setNewTestCases((prev) => prev.map((r) => (r.id === row.id ? ({ ...row } as Record<string, unknown>) : r)));
      } else {
        dirtyRowsRef.current.set(String(row.id), { ...row });
      }
      onDirtyChange?.(true);
    },
    [newTestCases, onDirtyChange],
  );

  const onCellValueChanged = useCallback((event: CellValueChangedEvent) => {
    const col = event.column?.getColId();
    if (col === 'enabled') {
      const api = gridApiRef.current;
      if (!api) return;
      api.refreshClientSideRowModel('filter');
      onCellChange(event.data, col, event.newValue);
    }
  }, []);

  const onCellChange = useCallback(
    (data: Record<string, unknown>, field: string, value: string | number | boolean) => {
      if (!data) return;
      data[field] = value;
      if (field !== 'testCaseName' && field !== 'enabled' && data.data != null) {
        data.data = { ...(data.data as Record<string, unknown>), [field]: value };
      }

      updateData(data);
    },
    [updateData],
  );

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    setSelectedRows(event.api.getSelectedRows() as TestCase[]);
  }, []);

  // todo: apply when BE supports batch-delete
  // const onCellClicked = useCallback((event: CellClickedEvent) => {
  //   if (event.column.getColId() !== 'id') return;

  //   const mouseEvent = event.event as MouseEvent;
  //   const shiftKey = mouseEvent.shiftKey;

  //   if (shiftKey) {
  //     mouseEvent.preventDefault();
  //     const allNodes: IRowNode[] = [];
  //     event.api.forEachNodeAfterFilterAndSort((node) => allNodes.push(node));
  //     const currentIndex = allNodes.findIndex((n) => n.id === event.node.id);
  //     const selectedNodes = event.api.getSelectedNodes();
  //     if (selectedNodes.length > 0) {
  //       const lastSelected = selectedNodes[selectedNodes.length - 1];
  //       const lastIndex = allNodes.findIndex((n) => n.id === lastSelected.id);
  //       const start = Math.min(currentIndex, lastIndex);
  //       const end = Math.max(currentIndex, lastIndex);
  //       allNodes.slice(start, end + 1).forEach((n) => n.setSelected(true, false));
  //     } else {
  //       event.node.setSelected(true, false);
  //     }
  //   } else {
  //     event.node.setSelected(!event.node.isSelected(), false);
  //   }
  // }, []);

  const gridOptions: GridOptions = {
    onCellValueChanged,
    onSelectionChanged,
    // onCellClicked,
    rowSelection: {
      mode: 'multiRow',
      checkboxes: false,
      headerCheckbox: false,
      enableClickSelection: false,
    },
  };

  const stableOnRemoveCase = useCallback((data?: TestCase) => {
    onRemoveCaseRef.current(data);
  }, []);

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
      setIsLoading(true);
      getTestCases(selectedTestSuite.id, 0, 1000, [], []).then((res) => {
        setIsLoading(false);
        let data = res == null || res.content.length === 0 ? [] : getTestCaseGridData(res?.content || []);
        if (dirtyRowsRef.current.size > 0) {
          data = data.map((row) => {
            const id = String(row.id);
            return dirtyRowsRef.current.has(id) ? dirtyRowsRef.current.get(id)! : row;
          });
        }
        setData(data);
        setColumnDefs([
          ...getTestCaseColumns(selectedTestSuite, onCellChange, t),
          { ...ONE_ACTION_COLUMN(getTryOutOperation(onOpenTryOutSidebar)), colId: 'action-tryout' },
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
    [gridApi, onCellChange, onOpenTryOutSidebar, selectedTestSuite, stableOnRemoveCase, t],
  );

  const onGridReady = useCallback(
    ({ api }: GridReadyEvent) => {
      gridApiRef.current = api;
      setGridApi(api);
    },
    [refreshGrid],
  );

  const onApplyImport = useCallback(
    (file: File, mode: TestCaseImportMode, strategy: TestCaseConflictStrategy) => {
      const body = new FormData();
      body.append('file', file);

      importTestCase(selectedTestSuite.id || '', body, mode, strategy).then((res) => {
        if (res?.success) {
          showNotification(
            getSuccessNotification(t(TestSuitesI18nKey.ImportSuccess), t(TestSuitesI18nKey.ImportSuccessDescription)),
          );
          refreshGrid(true);
        } else {
          showNotification(
            getErrorNotification(t(TestSuitesI18nKey.ImportFailed), res?.errorMessage || 'Unknown error'),
          );
        }
      });
    },
    [refreshGrid, selectedTestSuite.id, showNotification, t],
  );

  const onExport = useCallback(() => {
    const testSuiteId = selectedTestSuite.id;
    if (!testSuiteId) return;

    window.open(`${ApiRoute.TestSuitesExport}?id=${encodeURIComponent(testSuiteId)}`, '_blank');
  }, [selectedTestSuite.id, showNotification, t]);

  const onAddTestCase = useCallback(() => {
    const testSuiteId = selectedTestSuite.id;
    if (!testSuiteId) return;
    createTestCase(testSuiteId, createNewTestCaseRow(), true).then((res) => {
      if (res?.success) {
        refreshGrid();
      } else {
        showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage));
      }
    });
  }, [selectedTestSuite.id, refreshGrid, showNotification, t]);

  const onRemoveCase = useCallback(
    (data?: TestCase) => {
      if (!data) return;
      if (newTestCases.some((r) => r.id === data.id)) {
        setNewTestCases((prev) => prev.filter((r) => r.id !== data.id));
        onDirtyChange?.(true);
        return;
      }
      removeTestCase(selectedTestSuite.id as string, data.id as string).then((res) => {
        if (res?.success) {
          showNotification(getSuccessNotification(t(TestSuitesI18nKey.RemoveSuccess)));
          refreshGrid();
        } else {
          showNotification(
            getErrorNotification(t(TestSuitesI18nKey.RemoveFailed), res?.errorMessage || 'Unknown error'),
          );
        }
      });
    },
    [newTestCases, selectedTestSuite.id, onDirtyChange, showNotification, t, refreshGrid],
  );

  const onBatchDelete = useCallback(() => {
    const namesToDelete = selectedRows.map((r) => r.testCaseName as string);
    removeMultipleTestCases(selectedTestSuite.id as string, namesToDelete).then((res) => {
      if (res?.success) {
        showNotification(getSuccessNotification(t(TestSuitesI18nKey.RemoveSuccess)));
        refreshGrid();
      } else {
        showNotification(getErrorNotification(t(TestSuitesI18nKey.RemoveFailed), res?.errorMessage || 'Unknown error'));
      }
    });
  }, [selectedRows]);

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

  useEffect(() => {
    refreshGrid();
  }, []);

  useEffect(() => {
    if (pendingRefreshRef.current) {
      pendingRefreshRef.current = false;
      refreshGrid();
    }
  }, [selectedTestSuite.testCaseSchema, refreshGrid]);

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
    onRemoveCaseRef.current = onRemoveCase;
  }, [onRemoveCase]);

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
          <HeaderButtons
            selectedTestSuiteId={selectedTestSuite.id as string}
            onApplyImport={onApplyImport}
            onAdd={onAddTestCase}
            onExport={onExport}
            onOpenSchemaModal={onOpenSchemaModal}
            onBatchDelete={onBatchDelete}
            showBatchDelete={selectedRows.length > 0}
          />
        </ListEntities>
      )}
      {isSchemaModalOpen &&
        createPortal(
          <TestCasesSchemaModal
            isModalOpen={isSchemaModalOpen}
            selectedTestSuite={selectedTestSuite}
            onClose={onCloseSchemaModal}
            onApply={onChangeTestCaseSchema}
          />,
          document.body,
        )}
    </div>
  );
};

export default TestCasesList;
