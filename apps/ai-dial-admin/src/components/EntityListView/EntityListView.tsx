'use client';

import { useCallback, useMemo, useState } from 'react';

import { ColDef } from 'ag-grid-community';

import { withNameLink } from '@/src/components/Grid/columns/name-link-column';
import ListEntities from '@/src/components/ListView/List';
import { ENTITIES_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetWithVersion } from '@/src/utils/is-view';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { emptyDataTitleMap, listViewTitleMap } from '../ListView/constants';
import Actions from './Components/Actions';
import { ModalType } from './Components/Modals';
import EntityListHeaderButtons from './HeaderButtons/HeaderButtons';

const RUNNER_NAME_FIELD = 'dial:applicationTypeDisplayName';

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
  getAssetContext?: () => AssetsFolderContextReader<AssetListItem>;
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
  showColumnsButton,
  getAssetContext,
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  // entity for which the modals (delete and duplicate) is open
  const [currentEntity, setCurrentEntity] = useState<T | undefined>(void 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType | undefined>(void 0);

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

  const getEntityHref = useCallback((row?: unknown) => getUrnForEntity(route, row), [route]);

  const linkedColumns = useMemo(
    () => withNameLink(baseColumns, getEntityHref, RUNNER_NAME_FIELD),
    [baseColumns, getEntityHref],
  );

  const columns = useMemo(() => {
    const remove = isReadOnlyAdmin ? undefined : onOpenDeleteModal;
    const duplicate = isReadOnlyAdmin ? undefined : onOpenDuplicateModal;
    const move = isReadOnlyAdmin ? undefined : onOpenMoveModal;
    if (isAssetWithVersion(route)) {
      return ENTITIES_COLUMNS(linkedColumns, remove, duplicate, openInNewTab, move);
    } else if (route === ApplicationRoute.Files) {
      return ENTITIES_COLUMNS(linkedColumns, remove, void 0, openInNewTab, move);
    }
    return ENTITIES_COLUMNS(linkedColumns, remove, duplicate, openInNewTab);
  }, [isReadOnlyAdmin, linkedColumns, onOpenDeleteModal, onOpenDuplicateModal, onOpenMoveModal, openInNewTab, route]);

  return (
    <>
      <ListEntities
        rowData={data}
        columnDefs={columns}
        listLabel={t(listViewTitleMap[route])}
        emptyDataProps={{ title: t(emptyDataTitleMap[route]) }}
        storageKey={route}
        getHref={getEntityHref}
        isEnableColumnPanel={showColumnsButton}
      >
        <EntityListHeaderButtons
          names={names}
          keys={keys}
          versionsMap={versionsMap}
          runners={runners}
          route={route}
          createEntity={isReadOnlyAdmin ? undefined : onCreateEntity}
          context={getAssetContext}
          isReadOnlyAdmin={isReadOnlyAdmin}
        />
      </ListEntities>
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
