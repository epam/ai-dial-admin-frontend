'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { GridApi, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';

import { getRuns } from '@/src/app/[lang]/test-suites/actions';
import { infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import { TEST_SUITE_RUNS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite, TestSuiteRun } from '@/src/models/evaluation/test-suite';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import GridView from '@/src/components/Grid/GridView/GridView';
import { RUN_FILTER } from './constants';

interface Props {
  selectedTestSuite: TestSuite;
}

const Runs: FC<Props> = ({ selectedTestSuite }) => {
  const t = useI18n();

  let isLoading = false;
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [runs, setRuns] = useState<TestSuiteRun[] | null>(null);
  const [totalElements, setTotalElements] = useState(0);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
  };

  useEffect(() => {
    if (!runs && !isLoading) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      isLoading = true;
      getRuns(0, PAGE_SIZE, [], [RUN_FILTER(selectedTestSuite.id as string)]).then((res) => {
        if (runs) {
          return;
        }
        isLoading = false;
        const runsData = (res?.content || []) as TestSuiteRun[];
        setTotalElements(res?.totalElements || 0);
        setRuns(runsData);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTestSuite.id]);

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        gridApi?.hideOverlay();
        gridApi?.setGridOption('loading', true);
        const page = Math.floor(params.startRow / PAGE_SIZE);
        if (page === 0) {
          onSetData(runs, totalElements, params);
          return;
        }
        const sorts = getRequestSorts(params.sortModel);
        const filters = getRequestFilters(params.filterModel);

        getRuns(page, PAGE_SIZE, sorts, [RUN_FILTER(selectedTestSuite.id as string), ...filters])
          .then((res) => {
            const data = res == null || res.content.length === 0 ? [] : res?.content || [];

            onSetData(data, res?.totalElements || 0, params);
          })
          .catch(() => {
            params.failCallback();
            gridApi?.setGridOption('loading', false);
          });
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gridApi, selectedTestSuite.id, runs, totalElements],
  );

  const onSetData = useCallback(
    (data: TestSuiteRun[] | null, totalElements: number, params: IGetRowsParams) => {
      params.successCallback(data || [], totalElements);
      if (totalElements === 0) {
        gridApi?.showNoRowsOverlay();
      }
      gridApi?.setGridOption('loading', false);
    },
    [gridApi],
  );

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    setGridApi(api);
  }, []);

  return (
    <GridView
      columnDefs={TEST_SUITE_RUNS_COLUMNS}
      additionalGridOptions={gridOptions}
      listLabel={t(TabsI18nKey.Runs)}
      emptyDataProps={{ title: t(EntitiesI18nKey.NoRuns) }}
      onGridReady={onGridReady}
    />
  );
};

export default Runs;
