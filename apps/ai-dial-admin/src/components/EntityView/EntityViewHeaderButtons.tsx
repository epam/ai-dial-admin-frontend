'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';

import DeleteAdapter from '@/src/components/AdaptersList/Delete/DeleteAdapter';
import DeleteScheme from '@/src/components/ApplicationRunners/ListView/Delete/DeleteAppRunner';
import Button from '@/src/components/Common/Button/Button';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import Switch from '@/src/components/Common/Switch/Switch';
import { isValidEntity } from '@/src/components/EntityListView/CreateEntity/validation';
import { deleteModalTitleMap, getEntityPath } from '@/src/components/EntityListView/entity-list-view';
import { showEditorErrorNotifications } from '@/src/components/JSONEditor/JSONEditor.utils';
import { ButtonsI18nKey, DeleteI18nKey } from '@/src/constants/i18n';
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

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  isChanged: boolean;
  jsonEditorEnabled: boolean;
  jsonErrors: JSONEditorError[] | null;
  hideJsonEditor?: boolean;
  children?: ReactNode;
  onDiscard: () => void;
  onSave: () => void;
  removeEntity: (entity?: string) => Promise<ServerActionResponse>;
  toggleJsonEditor?: () => void;
  setErrorNotifications?: (notification: JSONEditorErrorNotification[]) => void;
}

const EntityViewHeaderButtons = <T extends DialBaseEntity | DialKey>({
  view,
  entity,
  isChanged,
  onDiscard,
  onSave,
  removeEntity,
  jsonEditorEnabled,
  toggleJsonEditor,
  jsonErrors,
  setErrorNotifications,
  hideJsonEditor,
  children,
}: Props<T>) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const isSimple = isSimpleEntity(view);
  const { fetchFiles, filePath } = usePromptFolder();

  const [modalState, setIsOpenModal] = useState(PopUpState.Closed);
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

  const onTryToSave = useCallback(() => {
    if (jsonErrors?.length) {
      setIsValidJSON(false);
      const errorNotifications = showEditorErrorNotifications({ errors: jsonErrors, showNotification, t });
      setErrorNotifications?.(errorNotifications);
    } else {
      onSave();
    }
  }, [onSave, setErrorNotifications, showNotification, t, jsonErrors]);

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
            <Button
              cssClass={`primary ${buttonsClassNames}`}
              title={t(ButtonsI18nKey.Save)}
              onClick={onTryToSave}
              disable={(jsonEditorEnabled && !isValidJSON) || !isValidEntity(view, entity)}
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
            {view === ApplicationRoute.ApplicationRunners ? (
              <DeleteScheme entity={entity as DialApplicationScheme} isEntityView={true} />
            ) : null}

            {view === ApplicationRoute.Adapters ? (
              <DeleteAdapter entity={entity as DialAdapter} isEntityView={true} />
            ) : null}
          </ConfirmationModal>,
          document.body,
        )}
    </>
  );
};

export default EntityViewHeaderButtons;
