import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { CellClickedEvent, ColDef, GridApi, GridOptions, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { useRouter } from 'next/navigation';

import ListView from '@/src/components/ListView/ListView';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID, infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import { getDeleteOperation, getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';

import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { EvaluationPageData, FilterDto, SortDto } from '@/src/models/request';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { emptyDataTitleMap, listViewTitleMap } from '../constants';
import HeaderButtons from './Header';

interface Props<T> {
  route: ApplicationRoute;
  baseColumns: ColDef[];
  getData: (
    page: number,
    size: number,
    sorts: SortDto[],
    filters: FilterDto[],
  ) => Promise<EvaluationPageData<T> | null>;
  onCreateEntity?: (entity: T) => Promise<ServerActionResponse>;
  onRemoveEntity?: (entity: string) => Promise<ServerActionResponse>;
}

const EvaluationListView = <T extends object>({
  baseColumns,
  route,
  getData,
  onCreateEntity,
  onRemoveEntity,
}: Props<T>) => {
  const t = useI18n();
  const router = useRouter();

  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEntity, setCurrentEntity] = useState<T | undefined>(undefined);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
    onCellClicked: (e: CellClickedEvent) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        router.push(getUrnForEntity(route, e.data));
      }
    },
  };

  const gridDataSource: IDatasource = useMemo(
    () => ({
      getRows: (params: IGetRowsParams) => {
        gridApi?.setGridOption('loading', true);
        const page = Math.floor(params.startRow / PAGE_SIZE);
        const sorts = getRequestSorts(params.sortModel);
        const filters = getRequestFilters(params.filterModel);

        getData(page, PAGE_SIZE, sorts, filters)
          .then((res) => {
            if (res == null || res.content.length === 0) {
              params.successCallback([], 0);
            } else {
              params.successCallback(res.content || [], res.total);
            }
          })
          .catch(() => {
            params.failCallback();
            gridApi?.setGridOption('loading', false);
          });
      },
    }),
    [gridApi, getData],
  );

  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption('datasource', gridDataSource);
    }
  }, [gridApi, gridDataSource]);

  const onModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const onModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onGridReady = useCallback((api: GridApi) => {
    setGridApi(api);
  }, []);

  const onOpenInNewTabAction = useCallback(
    (entity?: T) => {
      onOpenInNewTab(route, entity);
    },
    [route],
  );

  const onOpenDeleteModal = useCallback(
    (entity?: T) => {
      setCurrentEntity(entity);
      onModalOpen();
    },
    [onModalOpen],
  );

  const actionColumn = ACTION_COLUMN([
    getOpenInNewTabOperation(onOpenInNewTabAction),
    // getDuplicateOperation(onDuplicateAction), // TODO: implement duplication for evaluations
    getDeleteOperation(onOpenDeleteModal),
  ]);

  const columnDefs = [...baseColumns, actionColumn];

  const toggleColumnsPanel = () => setShowColumnsPanel(!showColumnsPanel);

  return (
    <>
      <ListView
        view={route}
        columnDefs={columnDefs}
        additionalGridOptions={gridOptions}
        title={t(listViewTitleMap[route])}
        emptyDataTitle={t(emptyDataTitleMap[route])}
        showColumnsPanel={showColumnsPanel}
        toggleColumnsPanel={toggleColumnsPanel}
        storageKey={route}
        onGridReady={onGridReady}
      >
        <HeaderButtons
          route={route}
          toggleColumnsPanel={toggleColumnsPanel}
          onCreateEntity={onCreateEntity}
          gridApi={gridApi}
        />
      </ListView>

      {isModalOpen &&
        onRemoveEntity &&
        createPortal(
          <DeleteConfirmationModal
            entity={currentEntity}
            view={route}
            onCloseModal={onModalClose}
            onRemoveEntity={onRemoveEntity}
          />,
          document.body,
        )}
    </>
  );
};

export default EvaluationListView;
