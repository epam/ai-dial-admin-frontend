'use client';

import { MouseEvent, useCallback, useState } from 'react';

import { IconFileArrowLeft, IconFileArrowRight, IconPlus } from '@tabler/icons-react';

import Columns from '@/public/images/icons/columns.svg';
import { exportFiles, importFiles } from '@/src/app/[lang]/files/actions';
import { exportPrompts, importPrompts } from '@/src/app/[lang]/prompts/actions';
import CreateAdapter from '@/src/components/AdaptersList/Create/CreateAdapter';
import CreateScheme from '@/src/components/ApplicationRunners/ListView/Create/CreateAppRunner';
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
import { DialKey } from '@/src/models/dial/key';
import { ImportResult } from '@/src/models/import';
import { ParsedPrompts } from '@/src/models/prompts';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileTypes } from '@/src/types/import';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { downloadFile } from '@/src/utils/download';
import { getFolderName } from '@/src/utils/files/folder';
import { getErrorNotification, getPrepareNotification, getSuccessNotification } from '@/src/utils/notification';
import CreateEntity from '../CreateEntity/CreateEntity';
import { createModalTitleMap } from '../entity-list-view';
import EntityListModals, { ModalType } from '../EntityListModals';
import { getFormDataForImport } from './EntityListHeaderButtons.utils';

interface Props<T> {
  names?: string[];
  keys?: string[];
  versionsMap?: Record<string, string[]>;
  runners?: DialApplicationScheme[];
  route: ApplicationRoute;
  showColumnsButton?: boolean;
  showExportImportButtons?: boolean;
  toggleColumnsPanel: () => void;
  createEntity?: (entity: T) => Promise<ServerActionResponse>;
  context?: () => PromptFolderContextType | FileFolderContextType;
}

const EntityListHeaderButtons = <T extends DialBaseEntity | DialKey | DialApplicationScheme>({
  names,
  keys,
  versionsMap,
  runners,
  route,
  showColumnsButton,
  showExportImportButtons,
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
            getSuccessNotification(
              t(ExportI18nKey.ExportSuccessTitle, { type }),
              t(ExportI18nKey.ExportSuccessDescription),
            ),
          );

          downloadFile(blob, fileName);
        })
        .catch(() => {
          showNotification(
            getErrorNotification(t(ExportI18nKey.ExportErrorTitle, { type }), t(ExportI18nKey.ExportErrorDescription)),
          );
        });
      handleModalClose();
    },
    [handleModalClose, route, showNotification, t],
  );

  const onImport = useCallback(
    (
      fileType: ImportFileTypes,
      file: File | File[] | ParsedPrompts,
      conflictResolutionStrategy: string,
      path: string,
    ) => {
      const body = getFormDataForImport(path, file, fileType, conflictResolutionStrategy);
      const folderName = getFolderName(path) || '';
      const prepareNotificationId = showNotification(
        getPrepareNotification(
          t(ImportI18nKey.ImportPrepareTitle, { folder: folderName }),
          t(ImportI18nKey.ImportPrepareDescription, { folder: folderName }),
        ),
      );
      const importFunction = route === ApplicationRoute.Prompts ? importPrompts : importFiles;
      const translatedType = t(
        route === ApplicationRoute.Prompts ? MenuI18nKey.Prompts : MenuI18nKey.Files,
      ).toLowerCase();

      importFunction(body, fileType).then((res) => {
        removeNotification(prepareNotificationId);
        if (res.success) {
          const results = (res.response as { importResults: ImportResult[] }).importResults;
          getImportResults(results, folderName, translatedType, t, showNotification);
          folderContext?.fetchFiles(`${path}`);
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
      return <CreateScheme modalState={modalState} onClose={handleModalClose} route={route} />;
    }

    if (route === ApplicationRoute.Adapters) {
      return <CreateAdapter modalState={modalState} onClose={handleModalClose} route={route} names={names || []} />;
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
      {showColumnsButton && (
        <Button
          cssClass="tertiary"
          title={t(ButtonsI18nKey.Columns)}
          iconBefore={<Columns />}
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
        createModal={getCreateModal()}
        handleExport={onExport}
        handleImport={onImport}
        handleClose={handleModalClose}
        context={context}
      />
    </div>
  );
};

export default EntityListHeaderButtons;
