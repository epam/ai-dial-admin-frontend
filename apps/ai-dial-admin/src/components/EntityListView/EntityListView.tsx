'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useState } from 'react';

import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';

import ListView from '@/src/components/ListView/ListView';
import { ENTITIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useAppContext } from '@/src/context/AppContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetWithVersion } from '@/src/utils/is-view';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { emptyDataTitleMap, listViewTitleMap } from '../ListView/constants';
import Actions from './Components/Actions';
import { onCellClicked } from './utils/on-cell-clicked';
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
  getAssetContext?: () => AssetsFolderContext;
  /** Rendered alongside the header buttons — the `config-file-entity-views` toggle. */
  headerExtra?: ReactNode;
  /** True when `data` came from Core's config-file population rather than the admin backend. */
  isConfigFileSource?: boolean;
}

/** `config-file-entity-views`: routes a config-file-sourced row to the same detail page, read-only. */
const CONFIG_FILE_URL_SUFFIX = '?configFile=true';

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
  showColumnsButton,
  getAssetContext,
  headerExtra,
  isConfigFileSource,
}: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { setEntityReadOnly } = useAppContext();

  // Config-file entities have no write endpoint — mirrors the `configFile=true` detail page's own
  // read-only wiring so this list's existing isReadOnlyAdmin-gated create/remove/duplicate/move
  // affordances disappear for free, with no separate read-only prop to check at each call site.
  useEffect(() => {
    setEntityReadOnly(!!isConfigFileSource);
    return () => setEntityReadOnly(false);
  }, [isConfigFileSource, setEntityReadOnly]);

  const gridOptions: GridOptions = {
    onCellClicked: (e) => onCellClicked(e, route, router.push, isConfigFileSource ? CONFIG_FILE_URL_SUFFIX : undefined),
  };
  // entity for which the modals (delete and duplicate) is open
  const [currentEntity, setCurrentEntity] = useState<T | undefined>(void 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | undefined>(void 0);

  const [showColumnsPanel, setShowColumnsPanel] = useState(false);

  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const onGridReady = useCallback(({ api }: GridReadyEvent) => {
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
    const remove = isReadOnlyAdmin ? undefined : onOpenDeleteModal;
    const duplicate = isReadOnlyAdmin ? undefined : onOpenDuplicateModal;
    const move = isReadOnlyAdmin ? undefined : onOpenMoveModal;
    if (isAssetWithVersion(route)) {
      return ENTITIES_COLUMNS(baseColumns, remove, duplicate, openInNewTab, move);
    } else if (route === ApplicationRoute.Files) {
      return ENTITIES_COLUMNS(baseColumns, remove, void 0, openInNewTab, move);
    }
    return ENTITIES_COLUMNS(baseColumns, remove, duplicate, openInNewTab);
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
        onGridReady={onGridReady}
        getHref={(data) => `${getUrnForEntity(route, data)}${isConfigFileSource ? CONFIG_FILE_URL_SUFFIX : ''}`}
        headerExtra={headerExtra}
      >
        <EntityListHeaderButtons
          names={names}
          keys={keys}
          versionsMap={versionsMap}
          runners={runners}
          route={route}
          showColumnsButton={showColumnsButton && data.length > 0}
          toggleColumnsPanel={toggleColumnsPanel}
          createEntity={isReadOnlyAdmin ? undefined : onCreateEntity}
          context={getAssetContext}
          gridApi={gridApi}
          isReadOnlyAdmin={isReadOnlyAdmin}
        />
      </ListView>
      <Actions
        names={names}
        keys={keys}
        route={route}
        versionsMap={versionsMap}
        onCreateEntity={isReadOnlyAdmin ? undefined : onCreateEntity}
        onRemoveEntity={onRemoveEntity}
        isModalOpen={isModalOpen}
        onChangeIsModalOpen={setIsModalOpen}
        modalType={modalType}
        onChangeModalType={setModalType}
        currentEntity={currentEntity}
        onChangeCurrentEntity={setCurrentEntity}
      />
    </>
  );
};

export default BaseEntityList;
