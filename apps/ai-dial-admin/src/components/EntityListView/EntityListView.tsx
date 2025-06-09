'use client';

import { ColDef, GridOptions } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import DuplicateAdapter from '@/src/components/AdaptersList/Duplicate/DuplicateAdapter';
import DuplicateScheme from '@/src/components/ApplicationRunners/ListView/Duplicate/DuplicateAppRunner';
import DuplicateEntityPopup from '@/src/components/DuplicateEntityPopup/DuplicateEntityPopup';
import DuplicateKey from '@/src/components/KeysList/Popup/DuplicateKey';
import ListView from '@/src/components/ListView/ListView';
import DuplicatePrompt from '@/src/components/PromptsList/DuplicatePrompt';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ROOT_FOLDER } from '@/src/constants/file';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialFile } from '@/src/models/dial/file';
import { DialKey } from '@/src/models/dial/key';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ServerActionResponse } from '@/src/models/server-action';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { prepareEntityForDuplicate } from '@/src/utils/entities/prepare-entity-for-duplicate';
import { getListOfPathsToMove } from '@/src/utils/files/path';
import { getErrorNotification } from '@/src/utils/notification';
import { emptyDataTitleMap, ENTITIES_COLUMNS, getEntityPath, listViewTitleMap } from './entity-list-view';
import EntityListModals, { ModalType } from './EntityListModals';
import EntityListHeaderButtons from './HeaderButtons/EntityListHeaderButtons';

interface Props<T> {
  data: T[];
  names?: string[];
  keys?: string[];
  versionsMap?: Record<string, string[]>;
  baseColumns: ColDef[];
  runners?: DialApplicationScheme[];
  route: ApplicationRoute;
  createEntity?: (entity: T) => Promise<ServerActionResponse>;
  removeEntity: (entity?: string) => Promise<ServerActionResponse>;
  moveFiles?: (paths: string[], newPath: string) => Promise<ServerActionResponse[]>;
  showColumnsButton?: boolean;
  showFolders?: boolean;
  showExport?: boolean;
  context?: () => PromptFolderContextType | FileFolderContextType;
}

const BaseEntityList = <T extends DialBaseEntity | DialKey | DialApplicationScheme>({
  data,
  baseColumns,
  names,
  keys,
  route,
  runners,
  versionsMap,
  createEntity,
  removeEntity,
  moveFiles,
  showColumnsButton,
  showFolders,
  showExport,
  context,
}: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const folderContext = context?.();
  const gridOptions: GridOptions = {
    onCellClicked: (e) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        const originalRoute = route.split('/')[1]; // route starts with `/`
        router.push(`${originalRoute}/${getEntityPath(route, e.data)}`);
      }
    },
  };
  // entity for which the modals (delete and duplicate) is open
  const [currentEntity, setCurrentEntity] = useState<T | undefined>(void 0);

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [modalType, setModalType] = useState<ModalType | undefined>(void 0);

  const [showColumnsPanel, setShowColumnsPanel] = useState(false);

  const entityRef = useRef(currentEntity);
  const filesRef = useRef(folderContext?.fetchedFoldersData);
  useEffect(() => {
    entityRef.current = currentEntity;
    filesRef.current = folderContext?.fetchedFoldersData;
  }, [currentEntity, folderContext?.fetchedFoldersData]);

  const handleModalClose = useCallback(() => {
    setModalState(PopUpState.Closed);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setModalState(PopUpState.Opened);
  }, []);

  const onOpenDeleteModal = useCallback(
    (entity: T) => {
      setCurrentEntity(entity);
      handleModalOpen(ModalType.delete);
    },
    [handleModalOpen],
  );

  const onOpenDuplicateModal = useCallback(
    (entity: T) => {
      setCurrentEntity(entity);
      handleModalOpen(ModalType.duplicate);
    },
    [handleModalOpen],
  );

  const onOpenMoveModal = useCallback(
    (entity: T) => {
      setCurrentEntity(entity);
      handleModalOpen(ModalType.move);
    },
    [handleModalOpen],
  );

  const onConfirm = useCallback(() => {
    removeEntity(getEntityPath(route, currentEntity, true)).then((res) => {
      if (res.success) {
        handleModalClose();
        setCurrentEntity(void 0);
        if (route === ApplicationRoute.Prompts || route === ApplicationRoute.Files) {
          folderContext?.fetchFiles?.(folderContext?.filePath);
        }
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [currentEntity, folderContext, handleModalClose, removeEntity, route, router, showNotification]);

  const onDuplicate = useCallback(
    (clonedEntity: T) => {
      createEntity?.(prepareEntityForDuplicate(route, clonedEntity) as T).then((res) => {
        if (res.success) {
          handleModalClose();
          setCurrentEntity(void 0);
          if (route === ApplicationRoute.Prompts) {
            folderContext?.fetchFiles?.(folderContext?.filePath);
          }
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [createEntity, route, handleModalClose, router, folderContext, showNotification],
  );

  const onMove = useCallback(
    (newPath: string) => {
      const pathsToMove = getListOfPathsToMove(
        entityRef.current as DialFile,
        folderContext?.fetchedFoldersData as Record<string, DialFile[]>,
        null,
        route === ApplicationRoute.Files,
      );
      moveFiles?.(pathsToMove, newPath).then((res) => {
        if (res.every((r) => r.success)) {
          folderContext?.fetchFiles?.(`${ROOT_FOLDER}/`, true);
        }
      });
    },
    [route, folderContext, moveFiles],
  );

  const openInNewTab = useCallback(
    (entity: T) => {
      const originalRoute = route.split('/')[1];
      window.open(`${originalRoute}/${getEntityPath(route, entity)}`, '_blank');
    },
    [route],
  );

  const closeColumnsPanel = useCallback(() => setShowColumnsPanel(false), [setShowColumnsPanel]);

  useEffect(() => {
    window.addEventListener('click', closeColumnsPanel);
    return () => window.removeEventListener('click', closeColumnsPanel);
  }, [closeColumnsPanel]);

  const getColumns = () => {
    if (route === ApplicationRoute.Prompts) {
      return ENTITIES_COLUMNS(baseColumns, onOpenDeleteModal, onOpenDuplicateModal, openInNewTab, onOpenMoveModal);
    } else if (route === ApplicationRoute.Files) {
      return ENTITIES_COLUMNS(baseColumns, onOpenDeleteModal, void 0, openInNewTab, onOpenMoveModal);
    }
    return ENTITIES_COLUMNS(baseColumns, onOpenDeleteModal, onOpenDuplicateModal, openInNewTab);
  };

  const columns = getColumns();

  const toggleColumnsPanel = () => setShowColumnsPanel(!showColumnsPanel);

  const getDuplicateModal = () => {
    if (route === ApplicationRoute.ApplicationRunners) {
      return (
        <DuplicateScheme
          entity={currentEntity as DialApplicationScheme}
          onDuplicate={onDuplicate as (entity: DialApplicationScheme) => Promise<ServerActionResponse>}
          modalState={modalState}
          onClose={handleModalClose}
        />
      );
    }

    if (route === ApplicationRoute.Adapters) {
      return (
        <DuplicateAdapter
          adapter={currentEntity as DialAdapter}
          onDuplicate={onDuplicate as (entity: DialAdapter) => Promise<ServerActionResponse>}
          modalState={modalState}
          onClose={handleModalClose}
        />
      );
    }

    if (route === ApplicationRoute.Keys) {
      return (
        <DuplicateKey
          entity={currentEntity as DialKey}
          onDuplicate={onDuplicate as (entity: DialKey) => Promise<ServerActionResponse>}
          modalState={modalState}
          names={names || []}
          keys={keys || []}
          onClose={handleModalClose}
        />
      );
    }

    if (route === ApplicationRoute.Prompts) {
      return (
        <DuplicatePrompt
          entity={currentEntity as DialPrompt}
          versionsMap={versionsMap as Record<string, string[]>}
          onDuplicate={onDuplicate as (entity: DialBaseEntity) => Promise<ServerActionResponse>}
          modalState={modalState}
          onClose={handleModalClose}
        />
      );
    }
    return (
      <DuplicateEntityPopup
        view={route}
        entity={currentEntity}
        onDuplicate={onDuplicate as (entity: DialBaseEntity) => Promise<ServerActionResponse>}
        modalState={modalState}
        onClose={handleModalClose}
      />
    );
  };

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
        showFolders={showFolders}
        view={route}
        context={context}
      >
        <EntityListHeaderButtons
          names={names}
          keys={keys}
          versionsMap={versionsMap}
          runners={runners}
          route={route}
          showColumnsButton={showColumnsButton && data.length > 0}
          showExportImportButtons={showExport}
          toggleColumnsPanel={toggleColumnsPanel}
          createEntity={createEntity}
          context={context}
        />
      </ListView>
      {modalType ? (
        <EntityListModals
          entity={currentEntity as DialBaseEntity}
          route={route}
          initialPath={(currentEntity as DialPrompt)?.folderId}
          modalState={modalState}
          modalType={modalType}
          duplicateModal={getDuplicateModal()}
          handleClose={handleModalClose}
          handleDelete={onConfirm}
          handleMove={onMove}
          context={context}
        />
      ) : null}
    </>
  );
};

export default BaseEntityList;
