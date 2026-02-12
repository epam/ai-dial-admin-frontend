import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import { isEqual } from 'lodash';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getHuggingFaceModels } from '@/src/app/actions/deployments';
import { emptyDataTitleMap, listViewTitleMap } from '@/src/components/ListView/constants';
import { infiniteGridOptions, SINGLE_ROW_SELECTION, UTILITY_COLUMN } from '@/src/constants/ag-grid';
import { HF_REGISTRY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { FilterDto, SortDto } from '@/src/models/request';
import { ApplicationRoute } from '@/src/types/routes';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { IconFileDescription } from '@tabler/icons-react';

import RadioButtonRenderer from '@/src/components/Grid/CellRenderers/RadioButtonRenderer';
import ListEntities from '@/src/components/ListView/List';

interface Props {
  route: ApplicationRoute;
  modelName: string;
  setModelName: (name: string) => void;
  showModelDescription: (name: string, sha: string) => void;
}

const HfRegistryGrid: FC<Props> = ({ route, modelName, setModelName, showModelDescription }) => {
  const t = useI18n();

  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
    ...SINGLE_ROW_SELECTION,
    selectionColumnDef: {
      ...SINGLE_ROW_SELECTION.selectionColumnDef,
      cellRenderer: (data: { data?: { id: string } }) => (
        <RadioButtonRenderer inputId={data.data?.id as string} isChecked={data.data?.id === modelName} />
      ),
    },
    onRowSelected: (event) => {
      if (event.node.isSelected()) {
        setModelName(event.data?.id);
      }
    },
    onCellClicked: (event: CellClickedEvent) => {
      if (event.colDef.field === 'detailsColumn') {
        showModelDescription(event.data?.id, event.data?.sha);
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

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    setGridApi(api);
  }, []);

  const columnDefs = [
    ...HF_REGISTRY_COLUMNS,
    {
      ...UTILITY_COLUMN,
      field: 'detailsColumn',
      cellRenderer: () => <IconFileDescription className="text-secondary" />,
      cellClass: 'relative',
      pinned: 'right',
      lockPinned: true,
    } as ColDef,
  ];

  return (
    <ListEntities
      columnDefs={columnDefs}
      listLabel={t(listViewTitleMap[route])}
      emptyDataProps={{ title: t(emptyDataTitleMap[route]) }}
      storageKey={`${route}/registry`}
      additionalGridOptions={gridOptions}
      onGridReady={onGridReady}
      isEnableColumnPanel
    />
  );
};

export default HfRegistryGrid;
