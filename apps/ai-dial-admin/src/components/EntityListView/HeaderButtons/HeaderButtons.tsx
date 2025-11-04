'use client';

import { Dispatch, MouseEvent, SetStateAction, useCallback, useState } from 'react';

import { IconColumns2, IconFileArrowLeft, IconPlus, IconSquareCheck } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import { importFiles } from '@/src/app/[lang]/files/actions';
import { importPrompts } from '@/src/app/[lang]/prompts/actions';
import CreateAdapter from '@/src/components/Adapter/Modals/CreateAdapter';
import CreateAppRunner from '@/src/components/ApplicationRunners/Modals/CreateAppRunner';
import Modals, { ModalType } from '@/src/components/EntityListView/Components/Modals';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import { getImportResults } from '@/src/components/EntityListView/Import/import';
import CreateInterceptorTemplate from '@/src/components/InterceptorTemplates/Modals/Create';
import CreateKey from '@/src/components/Keys/Modals/CreateKey';
import { ButtonsI18nKey, ImportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialFile } from '@/src/models/dial/file';
import { ImportResult } from '@/src/models/import';
import { ParsedPrompts } from '@/src/models/prompts';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getFolderName } from '@/src/utils/files/folder';
import { getErrorNotification, getPrepareNotification } from '@/src/utils/notification';
import ResetFiltersButton from './ResetFiltersButton';
import { getFormDataForImport } from './utils';
import { Asset } from '@/src/models/dial/deployment-asset';
import { isAssetView } from '@/src/utils/is-asset-view';

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
  context?: () => AssetsFolderContext<Asset | DialFile>;
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
  const t = useI18n() as (t: string, options?: Record<string, string | number>) => string;
  const { showNotification, removeNotification } = useNotification();

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
      file: File | File[] | ParsedPrompts,
      conflictResolutionStrategy: string,
      path: string,
      ignorePaths?: boolean,
    ) => {
      const body = getFormDataForImport(path, file, fileType, conflictResolutionStrategy, void 0, ignorePaths);
      const folderName = getFolderName(path) || '';
      const prepareNotificationId = showNotification(
        getPrepareNotification(
          t(ImportI18nKey.PrepareTitle, { folder: folderName }),
          t(ImportI18nKey.PrepareDescription, { folder: folderName }),
        ),
      );
      const importFunction = route === ApplicationRoute.Prompts ? importPrompts : importFiles;
      const translatedType = t(
        route === ApplicationRoute.Prompts ? MenuI18nKey.Prompts : MenuI18nKey.Files,
      ).toLowerCase();

      importFunction(body, fileType).then((res) => {
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
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
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
      return <CreateAppRunner isModalOpen={isModalOpen} onClose={handleModalClose} />;
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
        <DialButton
          variant={ButtonVariant.Tertiary}
          title={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_ICON_PROPS} />}
          onClick={onToggleColumnsPanel}
        />
      )}
      {!isBulkView && (
        <>
          {isAssetView(route) && (
            <>
              <DialButton
                variant={ButtonVariant.Secondary}
                title={isTabletScreen ? '' : t(ButtonsI18nKey.BulkActions)}
                iconBefore={<IconSquareCheck {...BASE_ICON_PROPS} />}
                onClick={() => setIsBulkView?.(true)}
              />
              <DialButton
                variant={ButtonVariant.Secondary}
                title={isTabletScreen ? '' : t(ButtonsI18nKey.Import)}
                iconBefore={<IconFileArrowLeft {...BASE_ICON_PROPS} />}
                onClick={() => handleModalOpen(ModalType.import)}
              />
            </>
          )}
          {!!createEntity && (
            <DialButton
              variant={ButtonVariant.Primary}
              title={isTabletScreen ? '' : t(ButtonsI18nKey.Create)}
              iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
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
        handleImport={onImport}
        handleClose={handleModalClose}
        context={context}
      />
    </div>
  );
};

export default EntityListHeaderButtons;
