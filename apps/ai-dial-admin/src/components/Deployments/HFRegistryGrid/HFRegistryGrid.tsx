import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { GridApi, GridOptions, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { isEqual } from 'lodash';

import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { FilterDto, SortDto } from '@/src/models/request';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { getHuggingFaceModels } from '@/src/app/actions/deployments';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { DialGhostButton } from '@epam/ai-dial-ui-kit';
import { IconColumns2 } from '@tabler/icons-react';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { infiniteGridOptions, RADIO_BUTTON_COL_DEF } from '@/src/constants/ag-grid';
import { HF_REGISTRY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { emptyDataTitleMap, listViewTitleMap } from '@/src/components/ListView/constants';
import { useI18n } from '@/src/locales/client';

import ListView from '@/src/components/ListView/ListView';
import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';

interface Props {
  route: ApplicationRoute;
  modelName: string;
  setModelName: (name: string) => void;
}

const HfRegistryGrid: FC<Props> = ({ route, modelName, setModelName }) => {
  const t = useI18n();
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
    rowSelection: { mode: 'singleRow', enableClickSelection: true },
    selectionColumnDef: {
      ...RADIO_BUTTON_COL_DEF,
      cellRenderer: (data: { data?: { id: string } }) => (
        <RadioButtonRenderer inputId={data.data?.id as string} isChecked={data.data?.id === modelName} />
      ),
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        setModelName(event.data?.id);
      }
    },
  };

  const gridDataSource: IDatasource = useMemo(() => {
    let nextPageUrl = '';
    let filters: FilterDto[] = [];
    let sorts: SortDto[] = [];
    return {
      getRows: (params: IGetRowsParams) => {
        gridApi?.setGridOption('loading', true);
        const currentSorts = getRequestSorts(params.sortModel);
        const currentFilters = getRequestFilters(params.filterModel);
        if (!isEqual(filters, currentFilters) || !isEqual(sorts, currentSorts)) {
          nextPageUrl = '';
        }
        filters = currentFilters;
        sorts = currentSorts;

        const requestFilters = Object.fromEntries(
          currentFilters.map(({ column, value }) => [column === 'id' ? 'search' : column, encodeURIComponent(value)]),
        );

        getHuggingFaceModels({
          pageUrl: nextPageUrl,
          sort: sorts.length ? sorts[0].column : '',
          ...requestFilters,
        })
          .then(({ response, success }) => {
            if (success) {
              if (response.models.length === 0) {
                params.successCallback([], 0);
              } else {
                nextPageUrl = response.nextPageUrl || '';

                params.successCallback(
                  response.models || [],
                  nextPageUrl ? undefined : params.startRow + response.models.length,
                );
              }
            } else {
              params.failCallback();
              gridApi?.setGridOption('loading', false);
            }

            gridApi?.setGridOption('loading', false);
          })
          .catch(() => {
            params.failCallback();
            gridApi?.setGridOption('loading', false);
          });
      },
    };
  }, [gridApi]);

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const onGridReady = useCallback((api: GridApi) => {
    setGridApi(api);
  }, []);

  const columnDefs = [...HF_REGISTRY_COLUMNS];
  const toggleColumnsPanel = () => setShowColumnsPanel(!showColumnsPanel);

  return (
    <ListView
      view={route}
      columnDefs={columnDefs}
      additionalGridOptions={gridOptions}
      title={t(listViewTitleMap[route])}
      emptyDataTitle={t(emptyDataTitleMap[route])}
      showColumnsPanel={showColumnsPanel}
      toggleColumnsPanel={toggleColumnsPanel}
      storageKey={`${route}/registry`}
      onGridReady={onGridReady}
    >
      <div className="flex gap-4 items-end">
        <ResetFiltersButton gridApi={gridApi} />
        <DialGhostButton
          label={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
          onClick={toggleColumnsPanel}
        />
      </div>
    </ListView>
  );
};

export default HfRegistryGrid;
