'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';

import DeleteAdapter from '@/src/components/Adapter/Modals/DeleteAdapter';
import DeleteAppRunner from '@/src/components/ApplicationRunners/Modals/DeleteAppRunner';
import AddVersionModal from '@/src/components/Common/AddVersionModal/AddVersionModal';
import Button from '@/src/components/Common/Button/Button';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import Switch from '@/src/components/Common/Switch/Switch';
import { isValidEntity } from '@/src/utils/validation/is-valid-entity';
import { deleteModalTitleMap } from '@/src/components/EntityListView/constants';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { showEditorErrorNotifications } from '@/src/components/JSONEditor/JSONEditor.utils';
import { ButtonsI18nKey, DeleteI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { usePromptFolder } from '@/src/context/PromptFolderContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialKey } from '@/src/models/dial/key';
import { ServerActionResponse } from '@/src/models/server-action';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { getErrorNotification } from '@/src/utils/notification';
import { generateNewInitialVersion } from '@/src/utils/prompts/versions';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import DeleteInterceptorTemplate from '@/src/components/InterceptorTemplates/Modals/Delete';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  isChanged: boolean;
  jsonEditorEnabled: boolean;
  jsonErrors: JSONEditorError[] | null;
  hideJsonEditor?: boolean;
  children?: ReactNode;
  hasErrors?: boolean;
  onDiscard: () => void;
  onSave: (newVersion?: string) => void;
  removeEntity: (entity?: string) => Promise<ServerActionResponse>;
  toggleJsonEditor?: () => void;
  setErrorNotifications?: (notification: JSONEditorErrorNotification[]) => void;
  contentJsonErrors?: JSONEditorError[] | null;
  promptVersions?: string[];
}

const HeaderButtons = <T extends DialBaseEntity | DialKey>({
  view,
  entity,
  isChanged,
  onDiscard,
  onSave,
  removeEntity,
  hasErrors,
  jsonEditorEnabled,
  toggleJsonEditor,
  jsonErrors,
  setErrorNotifications,
  hideJsonEditor,
  children,
  contentJsonErrors,
  promptVersions,
}: Props<T>) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const isSimple = isSimpleEntity(view);
  const { fetchFiles, filePath } = usePromptFolder();

  const [modalState, setIsOpenModal] = useState(PopUpState.Closed);
  const [versionModalState, setVersionModalState] = useState(PopUpState.Closed);
  const [isValidJSON, setIsValidJSON] = useState<boolean>(true);

  const staticContainerClassnames = 'flex flex-row gap-3 divide-x divide-primary lg:h-[35px]';
  const staticEditorClassNames = 'pl-6';
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [containerClassNames, setContainerClassNames] = useState(staticContainerClassnames);
  const [buttonsClassNames, setButtonsClassNames] = useState('');
  const [editorClassNames, setEditorClassNames] = useState(staticEditorClassNames);

  const onOpenModal = useCallback(() => {
    setIsOpenModal(PopUpState.Opened);
  }, [setIsOpenModal]);

  const onCloseModal = useCallback(() => {
    setIsOpenModal(PopUpState.Closed);
  }, [setIsOpenModal]);

  const onConfirmRemoving = useCallback(() => {
    const removeKey = getEntityPath(view, entity, true);

    removeEntity(removeKey).then((res) => {
      if (res.success) {
        onCloseModal();

        if (view === ApplicationRoute.Prompts) {
          fetchFiles(filePath);
        }

        router.push(view);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [onCloseModal, showNotification, router, entity, view, removeEntity, fetchFiles, filePath]);

  useEffect(() => {
    setIsValidJSON(!jsonErrors?.length);
  }, [jsonErrors]);

  const onTryToSave = useCallback(
    (newVersion?: string) => {
      if (newVersion) {
        setVersionModalState(PopUpState.Closed);
      }
      if (jsonErrors?.length || contentJsonErrors?.length) {
        setIsValidJSON(false);
        const errors = (jsonErrors?.length ? jsonErrors : contentJsonErrors) as JSONEditorError[];
        const errorNotifications = showEditorErrorNotifications({
          errors,
          showNotification,
          t,
        });
        setErrorNotifications?.(errorNotifications);
      } else {
        onSave(newVersion);
      }
    },
    [jsonErrors, contentJsonErrors, showNotification, t, setErrorNotifications, onSave],
  );

  useEffect(() => {
    setContainerClassNames(
      classNames(
        staticContainerClassnames,
        isTablet || isMobile ? 'fixed bottom-0 left-0 right-0 h-[62px] bg-layer-3 px-6' : '',
      ),
    );
    setButtonsClassNames(classNames(isTablet || isMobile ? 'w-1/2 flex justify-center' : ''));
    setEditorClassNames(
      classNames(
        staticEditorClassNames,
        isTablet ? 'ml-3 pl-3 border-l-tertiary border-l h-full flex items-center' : isMobile ? 'hidden' : '',
      ),
    );
  }, [isTablet, isMobile]);

  const deleteModalContent =
    view === ApplicationRoute.ApplicationRunners ? (
      <DeleteAppRunner entity={entity as DialApplicationScheme} isEntityView={true} />
    ) : view === ApplicationRoute.Adapters ? (
      <DeleteAdapter entity={entity as DialAdapter} isEntityView={true} />
    ) : view === ApplicationRoute.InterceptorTemplates ? (
      <DeleteInterceptorTemplate template={entity as InterceptorTemplate} />
    ) : null;

  return (
    <>
      <div className={containerClassNames}>
        {isChanged ? (
          <div className="flex flex-row gap-3 w-full p-3 lg:p-0">
            <Button
              cssClass={classNames(`secondary ${buttonsClassNames}`)}
              title={t(ButtonsI18nKey.Discard)}
              onClick={onDiscard}
            />
            {view === ApplicationRoute.Prompts && (
              <Button
                cssClass={`secondary ${buttonsClassNames}`}
                title={t(ButtonsI18nKey.SaveAsNewVersion)}
                onClick={() => setVersionModalState(PopUpState.Opened)}
                disable={(jsonEditorEnabled && !isValidJSON) || !isValidEntity(view, entity)}
              />
            )}
            <Button
              cssClass={`primary ${buttonsClassNames}`}
              title={t(ButtonsI18nKey.Save)}
              onClick={() => onTryToSave()}
              disable={hasErrors || (jsonEditorEnabled && !isValidJSON) || !isValidEntity(view, entity)}
            />
          </div>
        ) : (
          <div className="flex flex-row items-center w-full">
            <div className={`flex-1 flex flex-row gap-3 ${isSimple ? 'justify-center' : ''}`}>
              <Button
                cssClass={`secondary ${buttonsClassNames} ${isSimple ? 'min-w-[150px] lg:min-w-0' : ''}`}
                title={t(ButtonsI18nKey.Delete)}
                iconBefore={<IconTrashX {...BASE_ICON_PROPS} />}
                onClick={onOpenModal}
              />
              {children}
            </div>
            {!hideJsonEditor && (
              <div className={editorClassNames}>
                <Switch
                  isOn={jsonEditorEnabled}
                  title="JSON Editor"
                  switchId="jsonEditor"
                  onChange={toggleJsonEditor}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {modalState === PopUpState.Opened &&
        createPortal(
          <ConfirmationModal
            description={`${t(DeleteI18nKey.Confirming)} ${t(deleteModalTitleMap[view])}?`}
            heading={`${t(DeleteI18nKey.Title)} ${t(deleteModalTitleMap[view])}`}
            onConfirm={onConfirmRemoving}
            modalState={modalState}
            onClose={onCloseModal}
            confirmLabel={t(ButtonsI18nKey.Delete)}
          >
            {deleteModalContent}
          </ConfirmationModal>,
          document.body,
        )}
      {versionModalState === PopUpState.Opened &&
        createPortal(
          <AddVersionModal
            heading={t(PromptsI18nKey.NewVersionSave)}
            modalState={versionModalState}
            prefilledVersion={generateNewInitialVersion(entity.version)}
            existingVersions={promptVersions || []}
            onClose={() => setVersionModalState(PopUpState.Closed)}
            onConfirm={onTryToSave}
          />,
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
