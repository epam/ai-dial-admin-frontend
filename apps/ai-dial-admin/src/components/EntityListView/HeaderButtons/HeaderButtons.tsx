'use client';

import { Dispatch, MouseEvent, SetStateAction, useCallback, useRef, useState } from 'react';

import { DialGhostButton, DialNeutralButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconColumns2, IconFileArrowLeft, IconPlus, IconSquareCheck } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';

import CreateAdapter from '@/src/components/Adapter/Modals/CreateAdapter';
import CreateAppRunner from '@/src/components/ApplicationRunners/Modals/CreateAppRunner';
import Modals, { ModalType } from '@/src/components/EntityListView/Components/Modals';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import { getImportResults } from '@/src/components/EntityListView/Import/utils';
import CreateInterceptorTemplate from '@/src/components/InterceptorTemplates/Modals/Create';
import CreateKey from '@/src/components/Keys/Modals/CreateKey';
import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import { MAX_FILE_SIZE_MB } from '@/src/constants/file';
import { ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ImportResult } from '@/src/models/import';
import { ImportData } from '@/src/models/import-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getFolderName } from '@/src/utils/files/folder';
import { isAssetView } from '@/src/utils/is-asset-view';
import { getErrorNotification, getPrepareNotification } from '@/src/utils/notification';
import { getFormDataForImport, getImportFunction, getImportTitle } from './utils';

interface Props<T> {
  names?: string[];
  keys?: string[];
  versionsMap?: Record<string, string[]>;
  runners?: DialApplicationScheme[];
  route: ApplicationRoute;
  showColumnsButton?: boolean;
  gridApi?: GridApi | null;
  toggleColumnsPanel: () => void;
  createEntity?: (entity: T) => Promise<ServerActionResponse>;
  context?: () => AssetsFolderContext<AssetWithVersion>;
  setIsBulkView?: Dispatch<SetStateAction<boolean>>;
  isBulkView?: boolean;
}

const EntityListHeaderButtons = <T extends BaseEntity>({
  names,
  keys,
  versionsMap,
  runners,
  route,
  showColumnsButton,
  gridApi,
  toggleColumnsPanel,
  createEntity,
  context,
  setIsBulkView,
  isBulkView,
}: Props<T>) => {
  const t = useI18n();
  const { showNotification, removeNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const folderContext = context?.();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();
  const isTabletScreen = useIsTabletScreen();
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setIsModalOpen(true);
  }, []);

  const onImport = useCallback(
    (
      fileType: ImportFileType,
      file: ImportData,
      conflictResolutionStrategy: string,
      path: string,
      ignorePaths?: boolean,
    ) => {
      const { body, fileSize } = getFormDataForImport(
        path,
        file,
        fileType,
        conflictResolutionStrategy,
        void 0,
        ignorePaths,
        route,
      );
      const folderName = getFolderName(path) || '';
      const prepareNotificationId = showNotification(
        getPrepareNotification(
          t(ImportI18nKey.PrepareTitle, { folder: folderName }),
          t(ImportI18nKey.PrepareDescription, { folder: folderName }),
        ),
      );

      const importFunction = getImportFunction(route);
      const translatedType = t(getImportTitle(route)).toLowerCase();
      if (!importFunction) return;

      if (fileSize > MAX_FILE_SIZE_MB * (1024 * 1024)) {
        removeNotification(prepareNotificationId);
        showNotification(
          getErrorNotification(
            t(ImportI18nKey.FileSizeErrorHeader),
            t(ImportI18nKey.FileSizeErrorDescription, { size: `${MAX_FILE_SIZE_MB} MB` }),
          ),
        );
      } else {
        getReqRef.current(importFunction, body, fileType).then((res) => {
          removeNotification(prepareNotificationId);
          if (res.success) {
            const error = (res.response as { error: string })?.error;
            if (error) {
              showNotification(getErrorNotification(t(ImportI18nKey.ArchiveErrorTitle), error));
            } else {
              const results = (res.response as { importResults: ImportResult[] }).importResults;
              getImportResults(results, folderName, translatedType, t, showNotification);
              folderContext?.fetchFiles(`${path}`);
            }
          } else {
            showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
          }
        });
      }

      handleModalClose();
    },
    [folderContext, handleModalClose, removeNotification, route, showNotification, t],
  );

  const onToggleColumnsPanel = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      toggleColumnsPanel();
    },
    [toggleColumnsPanel],
  );

  const getCreateModal = () => {
    if (route === ApplicationRoute.ApplicationRunners) {
      return <CreateAppRunner isModalOpen={isModalOpen} names={names || []} onClose={handleModalClose} />;
    }

    if (route === ApplicationRoute.InterceptorTemplates) {
      return (
        <CreateInterceptorTemplate
          isModalOpen={isModalOpen}
          onClose={handleModalClose}
          route={route}
          names={names || []}
        />
      );
    }
    if (route === ApplicationRoute.Adapters) {
      return <CreateAdapter isModalOpen={isModalOpen} onClose={handleModalClose} names={names || []} />;
    }

    if (route === ApplicationRoute.Keys) {
      return <CreateKey isModalOpen={isModalOpen} onClose={handleModalClose} names={names || []} keys={keys || []} />;
    }
    return (
      <CreateEntity
        route={route}
        runners={runners}
        isModalOpen={isModalOpen}
        createEntity={createEntity}
        onClose={handleModalClose}
        names={names || []}
        versionsMap={versionsMap}
        context={context}
      />
    );
  };

  return (
    <div className="flex gap-4">
      <ResetFiltersButton gridApi={gridApi} />
      {showColumnsButton && (
        <DialGhostButton
          label={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onToggleColumnsPanel}
        />
      )}
      {!isBulkView && (
        <>
          {isAssetView(route) && (
            <>
              <DialNeutralButton
                label={isTabletScreen ? '' : t(ButtonsI18nKey.BulkActions)}
                iconBefore={<IconSquareCheck {...BASE_BUTTON_ICON_PROPS} />}
                onClick={() => setIsBulkView?.(true)}
              />
              <DialNeutralButton
                label={isTabletScreen ? '' : t(ButtonsI18nKey.Import)}
                iconBefore={<IconFileArrowLeft {...BASE_BUTTON_ICON_PROPS} />}
                onClick={() => handleModalOpen(ModalType.import)}
              />
            </>
          )}
          {!!createEntity && (
            <DialPrimaryButton
              label={isTabletScreen ? '' : t(ButtonsI18nKey.Create)}
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              onClick={() => handleModalOpen(ModalType.create)}
            />
          )}
        </>
      )}

      <Modals
        route={route}
        isModalOpen={isModalOpen}
        modalType={modalType}
        createModal={<SaveValidationContextProvider>{getCreateModal()}</SaveValidationContextProvider>}
        onImport={onImport}
        onClose={handleModalClose}
        getAssetContext={context}
      />
    </div>
  );
};

export default EntityListHeaderButtons;
