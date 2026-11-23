'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { GridApi, GridOptions, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';

import { getDatasetTestSuitesPage } from '@/src/app/[lang]/datasets/actions';
import { withNameLink } from '@/src/components/Grid/columns/name-link-column';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN, infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import { getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { DATASET_TEST_SUITES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { DatasetsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';

interface Props {
  datasetId: string;
}

const openTestSuite = (testSuite?: TestSuite) => onOpenInNewTab(ApplicationRoute.TestSuites, testSuite);

const getTestSuiteHref = (testSuite?: unknown) => getUrnForEntity(ApplicationRoute.TestSuites, testSuite);

const gridOptions: GridOptions = {
  ...infiniteGridOptions,
};

const columnDefs = [
  ...withNameLink(DATASET_TEST_SUITES_COLUMN, getTestSuiteHref, 'name'),
  ACTION_COLUMN([getOpenInNewTabOperation(openTestSuite)], true),
];

const DatasetTestSuites: FC<Props> = ({ datasetId }) => {
  const t = useI18n();

  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    setGridApi(api);
  }, []);

  // Changes only with the grid or the dataset, so the grid asks for its first page exactly once.
  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        gridApi?.hideOverlay();
        gridApi?.setGridOption('loading', true);

        const page = Math.floor(params.startRow / PAGE_SIZE);
        const sorts = getRequestSorts(params.sortModel);
        const filters = getRequestFilters(params.filterModel);

        getDatasetTestSuitesPage(datasetId, page, PAGE_SIZE, sorts, filters)
          .then((res) => {
            const totalElements = res?.totalElements ?? 0;
            params.successCallback(res?.content ?? [], totalElements);
            if (totalElements === 0) {
              gridApi?.showNoRowsOverlay();
            }
          })
          .catch(() => params.failCallback())
          .finally(() => gridApi?.setGridOption('loading', false));
      },
    }),
    [gridApi, datasetId],
  );

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  return (
    <div className="size-full flex flex-col gap-4">
      <span className="dial-small-text shrink-0">{t(DatasetsI18nKey.TestSuitesDescription)}</span>
      <div className="flex-1 min-h-0">
        <GridView
          columnDefs={columnDefs}
          additionalGridOptions={gridOptions}
          emptyDataProps={{ title: t(EntitiesI18nKey.NoTestSuites) }}
          onGridReady={onGridReady}
          getHref={getTestSuiteHref}
          storageKey={`${ApplicationRoute.Datasets}/test-suites`}
        />
      </div>
    </div>
  );
};

export default DatasetTestSuites;
