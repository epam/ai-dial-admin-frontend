'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getTestCases } from '@/src/app/[lang]/test-suites/actions';
import ListView from '@/src/components/ListView/ListView';
import { infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestCase, TestSuite } from '@/src/models/evaluation/test-suite';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { ColDef, GridApi, GridOptions, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { getTestCaseColumns } from '../utils/columns';
import { getTestCaseGridData } from '../utils/data';
import HeaderButtons from './Header';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TestCases: FC<Props> = ({ selectedTestSuite }) => {
  const t = useI18n();
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
    [gridApi, onSetData, selectedTestSuite.id, testCases, totalElements],
  );

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const onGridReady = useCallback((api: GridApi) => {
    setGridApi(api);
  }, []);

  return (
    <div className="h-full w-full flex">
      <ListView
        columnDefs={columnDefs}
        additionalGridOptions={gridOptions}
        title={t(TestSuitesI18nKey.TestCases)}
        emptyDataTitle={t(TestSuitesI18nKey.NoTestCases)}
        onGridReady={onGridReady}
        allowPadding={false}
      >
        <HeaderButtons selectedTestSuiteId={selectedTestSuite.id as string} />
      </ListView>
    </div>
  );
};

export default TestCases;
