import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { CellClickedEvent, ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { useRouter } from 'next/navigation';

import ListView from '@/src/components/ListView/ListView';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { getDeleteOperation, getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';

import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { emptyDataTitleMap, listViewTitleMap } from '../constants';
import HeaderButtons from './Header';

interface Props<T> {
  data: T[];
  names: string[];
  route: ApplicationRoute;
  baseColumns: ColDef[];
  onCreateEntity?: (entity: T) => Promise<ServerActionResponse>;
  onRemoveEntity: (entity: string) => Promise<ServerActionResponse>;
}

const EvaluationListView = <T extends object>({
  names,
  data,
  baseColumns,
  route,
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
    onCellClicked: (e: CellClickedEvent) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        router.push(getUrnForEntity(route, e.data));
      }
    },
  };

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
        data={data}
        view={route}
        columnDefs={columnDefs}
        additionalGridOptions={gridOptions}
        title={t(listViewTitleMap[route])}
        emptyDataTitle={t(emptyDataTitleMap[route])}
        showColumnsPanel
        toggleColumnsPanel={toggleColumnsPanel}
        storageKey={route}
        onGridReady={onGridReady}
      >
        <HeaderButtons
          route={route}
          names={names}
          toggleColumnsPanel={toggleColumnsPanel}
          onCreateEntity={onCreateEntity}
          gridApi={gridApi}
        />
      </ListView>

      {isModalOpen &&
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
