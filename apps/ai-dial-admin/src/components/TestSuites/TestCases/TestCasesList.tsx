'use client';

import { FC, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GridApi, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';

import { getTestCases, importTestCase, removeTestCase } from '@/src/app/[lang]/test-suites/actions';
import ListEntities from '@/src/components/ListView/List';
import TryOut from '@/src/components/TestSuites/RequestTemplate/components/TryOut';
import { getTestCaseColumns } from '@/src/components/TestSuites/utils/columns';
import { getTestCaseGridData } from '@/src/components/TestSuites/utils/data';
import { infiniteGridOptions, ONE_ACTION_COLUMN, PAGE_SIZE } from '@/src/constants/ag-grid';
import { getRemoveOperation, getTryOutOperation } from '@/src/constants/grid-columns/actions';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { TestCase, TestSuite } from '@/src/models/evaluation/test-suite';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import HeaderButtons from './Header';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TestCasesList: FC<Props> = ({ selectedTestSuite }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const { sidebar, sidebarOpen, toggleSidebar } = useAppContext();

  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const isInitialLoadRef = useRef(false);
  const onRemoveCaseRef = useRef<(data?: TestCase) => void>(() => {});

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
  };

  const stableOnRemoveCase = useCallback((data?: TestCase) => {
    onRemoveCaseRef.current(data);
  }, []);

  const openTryOutSidebar = useCallback(
    (e?: MouseEvent<HTMLButtonElement>, testCaseId?: string) => {
      e?.stopPropagation();
      sidebar.showSidebar(
        <SaveValidationContextProvider>
          <TryOut testSuiteId={selectedTestSuite.id || ''} testCaseId={testCaseId || ''} />
        </SaveValidationContextProvider>,
        'w-[50%] max-w-[800px]',
      );
      if (sidebarOpen) {
        sidebar.toggleIsMenuClosed?.();
        toggleSidebar(e);
      }
    },
    [selectedTestSuite.id, sidebar, sidebarOpen, toggleSidebar],
  );

  const tryOut = useCallback(
    (data?: TestCase) => {
      openTryOutSidebar(undefined, data?.id);
    },
    [openTryOutSidebar],
  );

  const onSetData = useCallback(
    (data: Record<string, unknown>[], totalElements: number, params: IGetRowsParams) => {
      params.successCallback(data, totalElements);
      if (totalElements === 0) {
        gridApi?.showNoRowsOverlay();
      }
      gridApi?.setGridOption('loading', false);
    },
    [gridApi],
  );

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        gridApi?.hideOverlay();
        gridApi?.setGridOption('loading', true);

        const page = Math.floor(params.startRow / PAGE_SIZE);
        const sorts = getRequestSorts(params.sortModel);
        const filters = getRequestFilters(params.filterModel);

        getTestCases(selectedTestSuite.id, page, PAGE_SIZE, sorts, filters)
          .then((res) => {
            const data = res == null || res.content.length === 0 ? [] : getTestCaseGridData(res?.content || []);
            onSetData(data, res?.totalElements || 0, params);
            gridApi?.updateGridOptions({
              columnDefs: [
                ...getTestCaseColumns(res?.content || []),
                { ...ONE_ACTION_COLUMN(getTryOutOperation(tryOut)), colId: 'action-tryout' },
                {
                  ...ONE_ACTION_COLUMN(getRemoveOperation(stableOnRemoveCase, void 0, 'text-error w-4 h-4')),
                  colId: 'action-remove',
                },
              ],
            });
          })
          .catch(() => {
            params.failCallback();
            gridApi?.setGridOption('loading', false);
          });
      },
    }),
    [gridApi, selectedTestSuite.id, onSetData, tryOut, stableOnRemoveCase],
  );

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    setGridApi(api);
  }, []);

  const refreshGrid = useCallback(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  useEffect(() => {
    refreshGrid();
  }, [gridApi, gridDataSource, refreshGrid]);

  const onApplyImport = useCallback(
    (file: File) => {
      const body = new FormData();
      body.append('file', file);

      importTestCase(selectedTestSuite.id || '', body).then((res) => {
        if (res?.success) {
          showNotification(
            getSuccessNotification(t(TestSuitesI18nKey.ImportSuccess), t(TestSuitesI18nKey.ImportSuccessDescription)),
          );
          refreshGrid();
        } else {
          showNotification(
            getErrorNotification(t(TestSuitesI18nKey.ImportFailed), res?.errorMessage || 'Unknown error'),
          );
        }
      });
    },
    [refreshGrid, selectedTestSuite.id, showNotification, t],
  );

  const onRemoveCase = useCallback(
    (data?: TestCase) => {
      if (!data) return;
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
    [refreshGrid, selectedTestSuite.id, showNotification, t],
  );

  useEffect(() => {
    onRemoveCaseRef.current = onRemoveCase;
  }, [onRemoveCase]);

  useEffect(() => {
    if (!isInitialLoadRef.current) {
      isInitialLoadRef.current = true;
      getTestCases(selectedTestSuite.id, 0, PAGE_SIZE, [], []).then((res) => {
        const testCasesData = res?.content || [];
        gridApi?.updateGridOptions({
          columnDefs: [
            ...getTestCaseColumns(testCasesData),
            {
              ...ONE_ACTION_COLUMN(getRemoveOperation(stableOnRemoveCase, void 0, 'text-error w-4 h-4')),
              colId: 'action-remove',
            },
            { ...ONE_ACTION_COLUMN(getTryOutOperation(openTryOutSidebar)), colId: 'action-tryout' },
          ],
        });
      });
    }
  }, [stableOnRemoveCase, selectedTestSuite.id, gridApi, openTryOutSidebar]);

  return (
    <>
      <div className="h-full min-h-[250px]">
        <ListEntities
          additionalGridOptions={gridOptions}
          listLabel={t(TestSuitesI18nKey.TestCases)}
          emptyDataProps={{ title: t(TestSuitesI18nKey.NoTestCases) }}
          onGridReady={onGridReady}
        >
          <HeaderButtons selectedTestSuiteId={selectedTestSuite.id as string} onApplyImport={onApplyImport} />
        </ListEntities>
      </div>
    </>
  );
};

export default TestCasesList;
