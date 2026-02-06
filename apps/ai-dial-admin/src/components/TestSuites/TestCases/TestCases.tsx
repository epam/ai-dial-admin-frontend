'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getTestCases } from '@/src/app/[lang]/test-suites/actions';
import ListView from '@/src/components/ListView/ListView';
import { ACTION_COLUMN, infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import { getDeleteOperation } from '@/src/constants/grid-columns/actions';
import { TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { GridApi, GridOptions, IDatasource, IGetRowsParams } from 'ag-grid-community';
import HeaderButtons from './Header';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TestCases: FC<Props> = ({ selectedTestSuite }) => {
  const t = useI18n();

  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
  };

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        gridApi?.setGridOption('loading', true);
        const page = Math.floor(params.startRow / PAGE_SIZE);
        const sorts = getRequestSorts(params.sortModel);
        const filters = getRequestFilters(params.filterModel);

        getTestCases(selectedTestSuite.id, page, PAGE_SIZE, sorts, filters)
          .then((res) => {
            if (res == null || res.content.length === 0) {
              params.successCallback([], 0);
            } else {
              params.successCallback(res.content || [], res.totalElements);
            }
            gridApi?.setGridOption('loading', false);
          })
          .catch(() => {
            params.failCallback();
            gridApi?.setGridOption('loading', false);
          });
      },
    }),
    [gridApi, selectedTestSuite.id],
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
  const actionColumn = ACTION_COLUMN([getDeleteOperation(onOpenDeleteModal)]);

  const columnDefs = [...TEST_CASES_COLUMN, actionColumn];

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
