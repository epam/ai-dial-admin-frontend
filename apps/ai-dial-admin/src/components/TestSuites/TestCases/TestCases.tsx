'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { GridApi, GridOptions, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { getTestCases } from '../../../app/[lang]/test-suites/actions';
import { infiniteGridOptions, PAGE_SIZE } from '../../../constants/ag-grid';
import { getRequestFilters } from '../../../utils/request/get-request-filters';
import { getRequestSorts } from '../../../utils/request/get-request-sorts';
import ListView from '../../ListView/ListView';

interface Props {
  selectedTestSuite: TestSuite;
  onChange: (testSuite: TestSuite) => void;
}

const TestCases: FC<Props> = ({ selectedTestSuite, onChange }) => {
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

  // const onOpenDeleteModal = useCallback(
  //   (entity?: T) => {
  //     setCurrentEntity(entity);
  //     onModalOpen();
  //   },
  //   [onModalOpen],
  // );

  // const actionColumn = ACTION_COLUMN([
  //   getOpenInNewTabOperation(onOpenInNewTabAction),
  //   // getDuplicateOperation(onDuplicateAction), // TODO: implement duplication for evaluations
  //   getDeleteOperation(onOpenDeleteModal),
  // ]);

  // const columnDefs = [...baseColumns, actionColumn];

  return (
    <ListView
      columnDefs={[]}
      additionalGridOptions={gridOptions}
      title={t(TestSuitesI18nKey.TestCases)}
      emptyDataTitle={t(TestSuitesI18nKey.NoTestCases)}
      onGridReady={onGridReady}
    >
      {/* <HeaderButtons
        route={route}
        toggleColumnsPanel={toggleColumnsPanel}
        onCreateEntity={onCreateEntity}
        gridApi={gridApi}
      /> */}
    </ListView>
  );
};

export default TestCases;
