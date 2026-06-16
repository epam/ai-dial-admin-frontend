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

import { duplicateTestSuite, runTestSuite } from '@/src/app/[lang]/test-suites/actions';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import ListEntities from '@/src/components/ListView/List';
import ExportRunModal from '@/src/components/Runs/Export/ExportRunModal';
import RunModal from '@/src/components/TestSuites/Runs/RunModal';
import { onCellClicked } from '@/src/components/EntityListView/utils/on-cell-clicked';
import { ACTION_COLUMN, infiniteGridOptions, PAGE_SIZE } from '@/src/constants/ag-grid';
import {
  getCompareOperation,
  getDeleteOperation,
  getDuplicateOperation,
  getExportOperation,
  getOpenInNewTabOperation,
  getRunTestSuiteOperation,
} from '@/src/constants/grid-columns/actions';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { RunStatus } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { EvaluationPageData, FilterDto, SortDto } from '@/src/models/request';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { getRequestFilters } from '@/src/utils/request/get-request-filters';
import { getRequestSorts } from '@/src/utils/request/get-request-sorts';
import { emptyDataTitleMap, listViewTitleMap } from '../constants';
import DuplicateTestSuite from './Duplicate';
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
  const { featureFlags } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();
  const [currentEntity, setCurrentEntity] = useState<T | undefined>(undefined);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportRunId, setExportRunId] = useState<string | undefined>(undefined);
  const { showNotification } = useNotification();

  const gridOptions: GridOptions = {
    ...infiniteGridOptions,
    onCellClicked: (e: CellClickedEvent) => onCellClicked(e, route, router.push),
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
    setCurrentEntity(undefined);
    setModalType(undefined);
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

  const onCompareRun = useCallback((entity?: T) => {
    onOpenInNewTab(ApplicationRoute.RunsCompare, entity);
  }, []);

  const onOpenModal = useCallback(
    (modalType: ModalType) => {
      onModalOpen();
      setModalType(modalType);
    },
    [onModalOpen],
  );

  const onOpenDuplicateModal = useCallback(
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

  const onOpenExportModal = useCallback((entity?: T) => {
    const id = (entity as { id?: string })?.id;
    if (id) {
      setExportRunId(id);
      setIsExportModalOpen(true);
    }
  }, []);

  const onCloseExportModal = useCallback(() => {
    setExportRunId(undefined);
    setIsExportModalOpen(false);
  }, []);

  const onRun = useCallback(
    (num?: string | number) => {
      runTestSuite((currentEntity as TestSuite)?.id as string, num).then((res) => {
        if (res.success) {
          showNotification(
            getSuccessNotification(t(TestSuitesI18nKey.RunSuccess), t(TestSuitesI18nKey.RunSuccessDescription)),
          );
          onModalClose();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [currentEntity, onModalClose, showNotification, t],
  );

  const onDuplicate = useCallback(
    (entity: TestSuite) => {
      duplicateTestSuite((currentEntity as TestSuite)?.id as string, entity).then((res) => {
        if (res.success) {
          showNotification(
            getSuccessNotification(
              getCreateNotificationTitle(route, t),
              getCreateNotificationDescription(route, res.response.suite.name, t),
            ),
          );
          router.push(getUrnForEntity(route, res.response.suite));
          router.refresh();
          onModalClose();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [currentEntity, onModalClose, route, router, showNotification, t],
  );

  const actionColumn = [getOpenInNewTabOperation(onOpenInNewTabAction)];

  if (route === ApplicationRoute.TestSuites) {
    actionColumn.push(
      ...[getRunTestSuiteOperation(onOpenRunTestSuiteModal), getDuplicateOperation(onOpenDuplicateModal)],
    );
  }

  if (route === ApplicationRoute.Runs) {
    actionColumn.push(getExportOperation(onOpenExportModal, (_, node) => node.data?.status === RunStatus.RUNNING));
    if (featureFlags.runsCompareEnabled) {
      actionColumn.push(getCompareOperation(onCompareRun, (_, node) => node.data?.status !== RunStatus.COMPLETED));
    }
  }

  const columnDefs = [...baseColumns, ACTION_COLUMN([...actionColumn, getDeleteOperation(onOpenDeleteModal)], true)];

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
        getHref={(data) => getUrnForEntity(route, data)}
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
        modalType === ModalType.runTestSuite &&
        createPortal(
          <RunModal
            isModalOpen={isModalOpen}
            onClose={onModalClose}
            selectedTestSuite={currentEntity as TestSuite}
            onRun={onRun}
          />,
          document.body,
        )}

      {isModalOpen &&
        modalType === ModalType.duplicate &&
        createPortal(
          <SaveValidationContextProvider>
            <DuplicateTestSuite
              isModalOpen={isModalOpen}
              onClose={onModalClose}
              onDuplicate={onDuplicate}
              entity={currentEntity as TestSuite}
            />
          </SaveValidationContextProvider>,
          document.body,
        )}

      {isExportModalOpen &&
        exportRunId &&
        createPortal(<ExportRunModal runId={exportRunId} onClose={onCloseExportModal} />, document.body)}
    </>
  );
};

export default EvaluationListView;
