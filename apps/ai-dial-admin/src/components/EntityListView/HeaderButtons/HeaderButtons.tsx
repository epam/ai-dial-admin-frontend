'use client';

import { MouseEvent, useCallback, useState } from 'react';

import { IconFileArrowLeft, IconFileArrowRight, IconPlus, IconColumns2 } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';

import { exportFiles, importFiles } from '@/src/app/[lang]/files/actions';
import { exportPrompts, importPrompts } from '@/src/app/[lang]/prompts/actions';
import CreateAdapter from '@/src/components/Adapter/Modals/CreateAdapter';
import CreateAppRunner from '@/src/components/ApplicationRunners/Modals/CreateAppRunner';
import Button from '@/src/components/Common/Button/Button';
import { getImportResults } from '@/src/components/EntityListView/Import/import';
import CreateKey from '@/src/components/KeysList/Popup/CreateKey';
import { ButtonsI18nKey, ExportI18nKey, ImportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { ImportResult } from '@/src/models/import';
import { ParsedPrompts } from '@/src/models/prompts';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { downloadFile } from '@/src/utils/download';
import { getFolderName } from '@/src/utils/files/folder';
import { getErrorNotification, getPrepareNotification, getSuccessNotification } from '@/src/utils/notification';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import { createModalTitleMap } from '@/src/components/EntityListView/constants';
import EntityListModals, { ModalType } from '@/src/components/EntityListView/EntityListModals';
import { getFormDataForImport } from './utils';
import CreateInterceptorTemplate from '@/src/components/InterceptorTemplates/Modals/Create';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import ResetFiltersButton from './ResetFiltersButton';

interface Props<T> {
  names?: string[];
  keys?: string[];
  versionsMap?: Record<string, string[]>;
  runners?: DialApplicationScheme[];
  route: ApplicationRoute;
  showColumnsButton?: boolean;
  showExportImportButtons?: boolean;
  gridApi?: GridApi | null;
  toggleColumnsPanel: () => void;
  createEntity?: (entity: T) => Promise<ServerActionResponse>;
  context?: () => PromptFolderContextType | FileFolderContextType;
}

const EntityListHeaderButtons = <T extends object>({
  names,
  keys,
  versionsMap,
  runners,
  route,
  showColumnsButton,
  showExportImportButtons,
  gridApi,
  toggleColumnsPanel,
  createEntity,
  context,
}: Props<T>) => {
  const t = useI18n() as (t: string, options?: Record<string, string | number>) => string;
  const { showNotification, removeNotification } = useNotification();

  const folderContext = context?.();
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [modalType, setModalType] = useState<ModalType>();
  const isTabletScreen = useIsTabletScreen();
  const handleModalClose = useCallback(() => {
    setModalState(PopUpState.Closed);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setModalState(PopUpState.Opened);
  }, []);

  const onExport = useCallback(
    (promptPaths: string[]) => {
      const type = t(route === ApplicationRoute.Prompts ? MenuI18nKey.Prompts : MenuI18nKey.Files);
      const exportFunction = route === ApplicationRoute.Prompts ? exportPrompts : exportFiles;

      exportFunction(promptPaths)
        .then(({ blob, fileName }) => {
          showNotification(
            getSuccessNotification(t(ExportI18nKey.SuccessTitle, { type }), t(ExportI18nKey.SuccessDescription)),
          );

          downloadFile(blob, fileName);
        })
        .catch(() => {
          showNotification(
            getErrorNotification(t(ExportI18nKey.ErrorTitle, { type }), t(ExportI18nKey.ErrorDescription)),
          );
        });
      handleModalClose();
    },
    [handleModalClose, route, showNotification, t],
  );

  const onImport = useCallback(
    (
      fileType: ImportFileType,
      file: File | File[] | ParsedPrompts,
      conflictResolutionStrategy: string,
      path: string,
    ) => {
      const body = getFormDataForImport(path, file, fileType, conflictResolutionStrategy);
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
      return <CreateAppRunner modalState={modalState} onClose={handleModalClose} route={route} />;
    }

    if (route === ApplicationRoute.InterceptorTemplates) {
      return (
        <CreateInterceptorTemplate
          modalState={modalState}
          onClose={handleModalClose}
          route={route}
          names={names || []}
        />
      );
    }
    if (route === ApplicationRoute.Adapters) {
      return <CreateAdapter modalState={modalState} onClose={handleModalClose} names={names || []} />;
    }

    if (route === ApplicationRoute.Keys) {
      return <CreateKey modalState={modalState} onClose={handleModalClose} names={names || []} keys={keys || []} />;
    }
    return (
      <CreateEntity
        route={route}
        runners={runners}
        modalTitle={t(createModalTitleMap[route])}
        modalState={modalState}
        createEntity={createEntity as (entity: DialBaseEntity) => Promise<ServerActionResponse>}
        onClose={handleModalClose}
        names={names || []}
        versionsMap={versionsMap}
      />
    );
  };

  return (
    <div className="flex gap-4">
      <ResetFiltersButton gridApi={gridApi} />
      {showColumnsButton && (
        <Button
          cssClass="tertiary"
          title={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_ICON_PROPS} />}
          onClick={onToggleColumnsPanel}
        />
      )}

      {showExportImportButtons && (
        <>
          <Button
            cssClass="secondary"
            title={t(ButtonsI18nKey.Export)}
            iconBefore={<IconFileArrowRight {...BASE_ICON_PROPS} />}
            onClick={() => handleModalOpen(ModalType.export)}
          />
          <Button
            cssClass="secondary"
            title={t(ButtonsI18nKey.Import)}
            iconBefore={<IconFileArrowLeft {...BASE_ICON_PROPS} />}
            onClick={() => handleModalOpen(ModalType.import)}
          />
        </>
      )}
      {!!createEntity && (
        <Button
          cssClass="primary"
          title={isTabletScreen ? '' : t(ButtonsI18nKey.Create)}
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
          onClick={() => handleModalOpen(ModalType.create)}
        />
      )}

      <EntityListModals
        route={route}
        modalState={modalState}
        modalType={modalType}
        createModal={<SaveValidationContextProvider>{getCreateModal()}</SaveValidationContextProvider>}
        handleExport={onExport}
        handleImport={onImport}
        handleClose={handleModalClose}
        context={context}
      />
    </div>
  );
};

export default EntityListHeaderButtons;
