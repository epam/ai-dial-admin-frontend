'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridOptions,
  GridReadyEvent,
  IDatasource,
  IGetRowsParams,
} from 'ag-grid-community';
import { useRouter } from 'next/navigation';

import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID, infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import {
  getDeleteOperation,
  getDuplicateOperation,
  getOpenInNewTabOperation,
  getRunTestSuiteOperation,
} from '@/src/constants/grid-columns/actions';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';

import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { EvaluationPageData, FilterDto, SortDto } from '@/src/models/request';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { emptyDataTitleMap, listViewTitleMap } from '../constants';
import ListEntities from '@/src/components/ListView/List';
import HeaderButtons from './Header';
import { ModalType } from '../../EntityListView/Components/Modals';
import RunModal from '../../TestSuites/Runs/RunModal';
import { TestSuite } from '../../../models/evaluation/test-suite';

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();
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

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
    setGridApi(api);
  }, []);

  const onOpenInNewTabAction = useCallback(
    (entity?: T) => {
      onOpenInNewTab(route, entity);
    },
    [route],
  );

  const onOpenModal = useCallback(
    (modalType: ModalType) => {
      onModalOpen();
      setModalType(modalType);
    },
    [onModalOpen],
  );

  const onOpenCloneModal = useCallback(
    (entity?: T) => {
      setCurrentEntity(entity);
      onOpenModal(ModalType.duplicate);
    },
    [onOpenModal],
  );

  const onOpenDeleteModal = useCallback(
    (entity?: T) => {
      setCurrentEntity(entity);
      onOpenModal(ModalType.delete);
    },
    [onOpenModal],
  );

  const onOpenRunTestSuiteModal = useCallback(
    (entity?: T) => {
      setCurrentEntity(entity);
      onOpenModal(ModalType.runTestSuite);
    },
    [onOpenModal],
  );

  const onRun = useCallback(() => {
    console.log('Run test suite:', currentEntity);
  }, []);

  const actionColumn = ACTION_COLUMN([
    getOpenInNewTabOperation(onOpenInNewTabAction),
    getDuplicateOperation(onOpenCloneModal),
    getRunTestSuiteOperation(onOpenRunTestSuiteModal),
    getDeleteOperation(onOpenDeleteModal),
  ]);

  const columnDefs = [...baseColumns, actionColumn];

  return (
    <>
      <ListEntities
        columnDefs={columnDefs}
        additionalGridOptions={gridOptions}
        listLabel={t(listViewTitleMap[route])}
        emptyDataProps={{ title: t(emptyDataTitleMap[route]) }}
        isEnableColumnPanel
        isMainListView
        storageKey={route}
        onGridReady={onGridReady}
      >
        <HeaderButtons route={route} onCreateEntity={onCreateEntity} />
      </ListEntities>

      {isModalOpen &&
        modalType === ModalType.delete &&
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

      {isModalOpen &&
        modalType === ModalType.duplicate &&
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

      {isModalOpen &&
        modalType === ModalType.runTestSuite &&
        onRemoveEntity &&
        createPortal(
          <RunModal
            isModalOpen={isModalOpen}
            onClose={onModalClose}
            selectedTestSuite={currentEntity as TestSuite}
            onRun={onRun}
          />,
          document.body,
        )}
    </>
  );
};

export default EvaluationListView;
