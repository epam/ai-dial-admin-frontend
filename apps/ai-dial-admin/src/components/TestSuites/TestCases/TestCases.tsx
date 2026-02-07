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
import HeaderButtons from './Header';
import { getTestCaseColumns } from '../utils/columns';
import { getTestCaseGridData } from '../utils/data';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TestCases: FC<Props> = ({ selectedTestSuite }) => {
  const t = useI18n();

  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [totalElements, setTotalElements] = useState(0);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
  };

  useEffect(() => {
    if (testCases.length === 0) {
      getTestCases(selectedTestSuite.id, 0, PAGE_SIZE, [], []).then((res) => {
        if (testCases.length > 0) {
          return;
        }
        const testCasesData = (res?.content || []) as TestCase[];
        setTotalElements(res?.totalElements || 0);
        setTestCases(testCasesData);
        setColumnDefs(getTestCaseColumns(testCasesData));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTestSuite.id]);

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        gridApi?.setGridOption('loading', true);
        const page = Math.floor(params.startRow / PAGE_SIZE);
        if (page === 0) {
          params.successCallback(getTestCaseGridData(testCases), totalElements);
          return;
        }
        const sorts = getRequestSorts(params.sortModel);
        const filters = getRequestFilters(params.filterModel);

        getTestCases(selectedTestSuite.id, page, PAGE_SIZE, sorts, filters)
          .then((res) => {
            if (res == null || res.content.length === 0) {
              params.successCallback([], 0);
            } else {
              params.successCallback(getTestCaseGridData(res.content || []), res.totalElements);
            }
            gridApi?.setGridOption('loading', false);
          })
          .catch(() => {
            params.failCallback();
            gridApi?.setGridOption('loading', false);
          });
      },
    }),
    [gridApi, selectedTestSuite.id, testCases, totalElements],
  );

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const onGridReady = useCallback((api: GridApi) => {
    setGridApi(api);
  }, []);

  // const onOpenInNewTabAction = useCallback(
  //   (entity?: T) => {
  //     onOpenInNewTab(route, entity);
  //   },
  //   [route],
  // );

  const onOpenDeleteModal = useCallback(() => {
    // TODO: implement delete modal
  }, []);

  // TODO: drag and drop
  // select
  // const actionColumn = ACTION_COLUMN([getDeleteOperation(onOpenDeleteModal)]);

  // const columnDefs = [...TEST_CASES_COLUMN, actionColumn];

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
