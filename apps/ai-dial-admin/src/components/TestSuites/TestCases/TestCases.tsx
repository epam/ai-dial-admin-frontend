'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getTestCases, importTestCase } from '@/src/app/[lang]/test-suites/actions';
import ListEntities from '@/src/components/ListView/List';
import { infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { TestCase, TestSuite } from '@/src/models/evaluation/test-suite';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { ColDef, GridApi, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { getTestCaseColumns } from '../utils/columns';
import { getTestCaseGridData } from '../utils/data';
import HeaderButtons from './Header';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TestCases: FC<Props> = ({ selectedTestSuite }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  let isLoading = false;
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [testCases, setTestCases] = useState<TestCase[] | null>(null);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [totalElements, setTotalElements] = useState(0);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
  };

  useEffect(() => {
    if (!testCases && !isLoading) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      isLoading = true;
      getTestCases(selectedTestSuite.id, 0, PAGE_SIZE, [], []).then((res) => {
        if (testCases) {
          return;
        }
        isLoading = false;
        const testCasesData = (res?.content || []) as TestCase[];
        setTotalElements(res?.totalElements || 0);
        setTestCases(testCasesData);
        setColumnDefs(getTestCaseColumns(testCasesData));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (page === 0) {
          const data = getTestCaseGridData(testCases);
          onSetData(data, totalElements, params);
          return;
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gridApi, selectedTestSuite.id, testCases, totalElements],
  );

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    setGridApi(api);
  }, []);

  const onApplyImport = useCallback(
    (file: File) => {
      const body = new FormData();

      body.append('file', file);

      importTestCase(selectedTestSuite.id || '', body).then((res) => {
        if (res?.success) {
          showNotification(
            getSuccessNotification(t(TestSuitesI18nKey.ImportSuccess), t(TestSuitesI18nKey.ImportSuccessDescription)),
          );
          gridApi?.setGridOption('datasource', gridDataSource);
        } else {
          showNotification(
            getErrorNotification(t(TestSuitesI18nKey.ImportFailed), res?.errorMessage || 'Unknown error'),
          );
        }
      });
    },
    [gridApi, gridDataSource, selectedTestSuite.id, showNotification, t],
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
