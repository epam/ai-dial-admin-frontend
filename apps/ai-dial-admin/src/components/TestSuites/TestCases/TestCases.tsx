'use client';

import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ColDef, GridApi, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';

import { getTestCases, importTestCase } from '@/src/app/[lang]/test-suites/actions';
import ListEntities from '@/src/components/ListView/List';
import { getTestCaseColumns } from '@/src/components/TestSuites/utils/columns';
import { getTestCaseGridData } from '@/src/components/TestSuites/utils/data';
import { infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import HeaderButtons from './Header';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TestCases: FC<Props> = ({ selectedTestSuite }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const isInitialLoadRef = useRef(false);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
  };

  useEffect(() => {
    if (!isInitialLoadRef.current) {
      isInitialLoadRef.current = true;
      getTestCases(selectedTestSuite.id, 0, PAGE_SIZE, [], []).then((res) => {
        const testCasesData = res?.content || [];
        setColumnDefs(getTestCaseColumns(testCasesData));
      });
    }
  }, [selectedTestSuite.id]);

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
          })
          .catch(() => {
            params.failCallback();
            gridApi?.setGridOption('loading', false);
          });
      },
    }),
    [gridApi, selectedTestSuite.id, onSetData],
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

  return (
    <>
      <ListEntities
        columnDefs={columnDefs}
        additionalGridOptions={gridOptions}
        listLabel={t(TestSuitesI18nKey.TestCases)}
        emptyDataProps={{ title: t(TestSuitesI18nKey.NoTestCases) }}
        onGridReady={onGridReady}
      >
        <HeaderButtons selectedTestSuiteId={selectedTestSuite.id as string} onApplyImport={onApplyImport} />
      </ListEntities>
    </>
  );
};

export default TestCases;
