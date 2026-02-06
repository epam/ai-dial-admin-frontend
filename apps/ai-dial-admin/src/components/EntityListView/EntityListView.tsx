'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { ColDef, GridApi, GridOptions } from 'ag-grid-community';

import ListView from '@/src/components/ListView/ListView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ENTITIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { Asset } from '@/src/models/dial/deployment-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { emptyDataTitleMap, listViewTitleMap } from '../ListView/constants';
import Actions from './Components/Actions';
import { ModalType } from './Components/Modals';
import EntityListHeaderButtons from './HeaderButtons/HeaderButtons';

interface Props<T> {
  data: T[];
  names?: string[];
  keys?: string[];
  versionsMap?: Record<string, string[]>;
  baseColumns: ColDef[];
  runners?: DialApplicationScheme[];
  route: ApplicationRoute;
  showColumnsButton?: boolean;
  onCreateEntity?: (entity: T) => Promise<ServerActionResponse>;
  onRemoveEntity: (entity: string) => Promise<ServerActionResponse>;
  onMoveFiles?: (paths: string[], newPath: string) => Promise<ServerActionResponse[]>;
  onBulkDelete?: (paths: { path: string }[]) => Promise<ServerActionResponse>;
  getAssetContext?: () => AssetsFolderContext<Asset>;
}

const BaseEntityList = <T extends object>({
  data,
  baseColumns,
  names,
  keys,
  route,
  runners,
  versionsMap,
  onCreateEntity,
  onRemoveEntity,
  onMoveFiles,
  onBulkDelete,
  showColumnsButton,
  getAssetContext,
}: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const gridOptions: GridOptions = {
    onCellClicked: (e) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        router.push(getUrnForEntity(route, e.data));
      }
    },
  };
  // entity for which the modals (delete and duplicate) is open
  const [currentEntity, setCurrentEntity] = useState<T | undefined>(void 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | undefined>(void 0);

  const [showColumnsPanel, setShowColumnsPanel] = useState(false);

  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [isBulkView, setIsBulkView] = useState(false);

  const onGridReady = useCallback((api: GridApi) => {
    setGridApi(api);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setIsModalOpen(true);
  }, []);

  const onOpenDeleteModal = useCallback(
    (entity?: T) => {
      setCurrentEntity(entity);
      handleModalOpen(ModalType.delete);
    },
    [handleModalOpen],
  );

  const onOpenDuplicateModal = useCallback(
    (entity?: T) => {
      setCurrentEntity(entity);
      handleModalOpen(ModalType.duplicate);
    },
    [handleModalOpen],
  );

  const onOpenMoveModal = useCallback(
    (entity?: T) => {
      setCurrentEntity(entity);
      handleModalOpen(ModalType.move);
    },
    [handleModalOpen],
  );

  const openInNewTab = useCallback(
    (entity?: T) => {
      onOpenInNewTab(route, entity);
    },
    [route],
  );

  const closeColumnsPanel = useCallback(() => setShowColumnsPanel(false), [setShowColumnsPanel]);

  useEffect(() => {
    window.addEventListener('click', closeColumnsPanel);
    return () => window.removeEventListener('click', closeColumnsPanel);
  }, [closeColumnsPanel]);

  const getColumns = () => {
    if (isAssetWithVersion(route)) {
      return ENTITIES_COLUMNS(baseColumns, onOpenDeleteModal, onOpenDuplicateModal, openInNewTab, onOpenMoveModal);
    } else if (route === ApplicationRoute.Files) {
      return ENTITIES_COLUMNS(baseColumns, onOpenDeleteModal, void 0, openInNewTab, onOpenMoveModal);
    }
    return ENTITIES_COLUMNS(baseColumns, onOpenDeleteModal, onOpenDuplicateModal, openInNewTab);
  };

  const columns = getColumns();

  const toggleColumnsPanel = () => setShowColumnsPanel(!showColumnsPanel);

  return (
    <>
      <ListView
        data={data}
        columnDefs={columns}
        title={t(listViewTitleMap[route])}
        emptyDataTitle={t(emptyDataTitleMap[route])}
        additionalGridOptions={gridOptions}
        showColumnsPanel={showColumnsPanel}
        toggleColumnsPanel={toggleColumnsPanel}
        view={route}
        context={getAssetContext}
        onGridReady={onGridReady}
        isBulkView={isBulkView}
      >
        <EntityListHeaderButtons
          names={names}
          keys={keys}
          versionsMap={versionsMap}
          runners={runners}
          route={route}
          showColumnsButton={showColumnsButton && data.length > 0}
          toggleColumnsPanel={toggleColumnsPanel}
          createEntity={onCreateEntity}
          context={getAssetContext}
          setIsBulkView={setIsBulkView}
          isBulkView={isBulkView}
          gridApi={gridApi}
        />
      </ListView>
      <Actions
        names={names}
        keys={keys}
        route={route}
        versionsMap={versionsMap}
        onCreateEntity={onCreateEntity}
        onRemoveEntity={onRemoveEntity}
        onMoveFiles={onMoveFiles}
        onBulkDelete={onBulkDelete}
        getAssetContext={getAssetContext}
        isModalOpen={isModalOpen}
        onChangeIsModalOpen={setIsModalOpen}
        modalType={modalType}
        onChangeModalType={setModalType}
        currentEntity={currentEntity}
        onChangeCurrentEntity={setCurrentEntity}
        isBulkView={isBulkView}
        onChangeIsBulkView={setIsBulkView}
      />
    </>
  );
};

export default BaseEntityList;
