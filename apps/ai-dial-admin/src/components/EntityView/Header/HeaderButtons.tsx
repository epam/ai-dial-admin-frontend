'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import Switch from '@/src/components/Common/Switch/Switch';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import DeleteConfirmationModal from './Modals/Delete';
import ModifiedEntityButtons from './ModifiedEntityButtons';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  isChanged: boolean;
  jsonEditorEnabled: boolean;
  jsonErrors: JSONEditorError[] | null;
  hideJsonEditor?: boolean;
  children?: ReactNode;
  onDiscard: () => void;
  onSave: (newVersion?: string) => void;
  removeEntity: (entity?: string) => Promise<ServerActionResponse>;
  toggleJsonEditor?: () => void;
  setErrorNotifications?: (notification: JSONEditorErrorNotification[]) => void;
  contentJsonErrors?: JSONEditorError[] | null;
  promptVersions?: string[];
}

const HeaderButtons = <T extends object>({
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
  contentJsonErrors,
  promptVersions,
}: Props<T>) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const isSimple = isSimpleEntity(view);

  const [modalState, setIsOpenModal] = useState(PopUpState.Closed);
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
          <ModifiedEntityButtons
            entity={entity}
            jsonEditorEnabled={jsonEditorEnabled}
            jsonErrors={jsonErrors}
            onDiscard={onDiscard}
            onSave={onSave}
            view={view}
            contentJsonErrors={contentJsonErrors}
            promptVersions={promptVersions}
            setErrorNotifications={setErrorNotifications}
          />
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
          <DeleteConfirmationModal
            entity={entity}
            removeEntity={removeEntity}
            view={view}
            modalState={modalState}
            onCloseModal={onCloseModal}
          />,
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
