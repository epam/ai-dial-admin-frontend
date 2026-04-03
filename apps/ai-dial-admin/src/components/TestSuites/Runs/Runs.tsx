'use client';

import { FC, RefObject, useCallback, useEffect, useMemo, useState } from 'react';

import { GridApi, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';

import { getRuns } from '@/src/app/[lang]/test-suites/actions';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN, infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { RUNS_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { RUN_FILTER } from './constants';

interface Props {
  runRefreshRef: RefObject<(() => void) | null>;
  selectedTestSuite: TestSuite;
}

const Runs: FC<Props> = ({ runRefreshRef, selectedTestSuite }) => {
  const t = useI18n();

  let isLoading = false;
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [runs, setRuns] = useState<Run[] | null>(null);
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
        const runsData = (res?.content || []) as Run[];
        setTotalElements(res?.totalElements || 0);
        setRuns(runsData);
      });
    }
  }, [selectedTestSuite.id]);

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        gridApi?.hideOverlay();
        gridApi?.setGridOption('loading', true);
        const page = Math.floor(params.startRow / PAGE_SIZE);
        if (page === 0 && runs) {
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
    (data: Run[] | null, totalElements: number, params: IGetRowsParams) => {
      params.successCallback(data || [], totalElements);
      if (totalElements === 0) {
        gridApi?.showNoRowsOverlay();
      }
      gridApi?.setGridOption('loading', false);
    },
    [gridApi],
  );

  const refreshGrid = useCallback(() => {
    setRuns(null);
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  useEffect(() => {
    runRefreshRef.current = refreshGrid;
  }, [refreshGrid, runRefreshRef]);

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource, refreshGrid]);

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    setGridApi(api);
  }, []);

  const onOpenInNewTabAction = useCallback((run?: Run) => {
    onOpenInNewTab(ApplicationRoute.Runs, run);
  }, []);

  const columnDefs = useMemo(
    () => [...RUNS_COLUMN, ACTION_COLUMN([getOpenInNewTabOperation(onOpenInNewTabAction, t)])],
    [onOpenInNewTabAction, t],
  );

  return (
    <GridView
      columnDefs={columnDefs}
      additionalGridOptions={gridOptions}
      emptyDataProps={{ title: t(EntitiesI18nKey.NoRuns) }}
      onGridReady={onGridReady}
    />
  );
};

export default Runs;
