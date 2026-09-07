'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonAppearance, DialDangerButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import AdaptiveHeaderActions from '@/src/components/EntityHeaderControls/AdaptiveHeaderActions/AdaptiveHeaderActions';
import { AdaptiveHeaderActionsConfig } from '@/src/components/EntityHeaderControls/AdaptiveHeaderActions/models';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { showEditorErrorNotifications } from '@/src/components/EntityHeaderControls/Buttons/utils';
import JsonToggleWithFormats from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggleWithFormats';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import {
  BASE_BUTTON_ICON_PROPS,
  SELECT_ENTITY_HEADER_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_CLASS,
} from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';

export interface SimpleButtonsWrapperProps<T> {
  view: ApplicationRoute;
  isChanged: boolean;
  jsonConfiguration?: JsonConfiguration;
  children?: ReactNode;
  leadingActions?: ReactNode;
  /** When set, replaces leadingActions + children with overflow-aware actions (Delete stays owned here). */
  adaptiveActions?: AdaptiveHeaderActionsConfig;
  entity: T;
  etag?: string;
  getAssetContext?: () => AssetsFolderContext;

  onDiscard: () => void;
  onSave: () => void;
  onRemove: (entity: string) => Promise<ServerActionResponse>;
}

const SimpleButtonsWrapper = <T extends object>({
  view,
  entity,
  etag,
  jsonConfiguration,
  children,
  leadingActions,
  adaptiveActions,
  isChanged,
  onDiscard,
  onSave,
  onRemove,
  getAssetContext,
}: SimpleButtonsWrapperProps<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isEditorEnabled = jsonConfiguration?.isEditorEnabled;
  const { isValid, dispatch, jsonErrors } = useSaveValidationContext();
  const { showNotification } = useNotification();

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [containerClassName, setContainerClassName] = useState(SELECT_ENTITY_HEADER_CLASS);
  const [buttonsClassName, setButtonsClassName] = useState('');
  const isDisableSave = useMemo(() => (isEditorEnabled ? false : !isValid), [isEditorEnabled, isValid]);

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  useEffect(() => {
    setContainerClassName(
      classNames(SELECT_ENTITY_HEADER_CLASS, (isTablet || isMobile) && SELECT_ENTITY_MOBILE_HEADER_CLASS),
    );
    setButtonsClassName(classNames((isTablet || isMobile) && SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS));
  }, [isTablet, isMobile]);

  const onStartDiscard = useCallback(() => {
    dispatch({ type: ValidationActionType.Reset });

    onDiscard?.();
  }, [dispatch, onDiscard]);

  const onTryToSave = useCallback(() => {
    if (jsonErrors?.length) {
      const errorNotifications = showEditorErrorNotifications(jsonErrors, showNotification, t);
      dispatch({ type: ValidationActionType.SetJsonEditorNotifications, errors: errorNotifications });
    } else {
      onSave?.();
    }
  }, [jsonErrors, showNotification, t, dispatch, onSave]);

  const deleteAction = useMemo(
    () => ({
      id: 'delete',
      label: t(ButtonsI18nKey.Delete),
      icon: <IconTrashX {...BASE_BUTTON_ICON_PROPS} />,
      onClick: onOpenModal,
      appearance: 'danger' as const,
    }),
    [t, onOpenModal],
  );

  return (
    <>
      <div className={classNames(containerClassName, adaptiveActions && 'min-w-0 flex-1 lg:h-auto lg:min-h-[35px]')}>
        {isReadOnlyAdmin ? (
          jsonConfiguration && <JsonToggleWithFormats view={view} {...jsonConfiguration} />
        ) : isChanged ? (
          <ChangedEntityButtons disableSave={isDisableSave} onDiscard={onStartDiscard} onSave={onTryToSave} />
        ) : (
          <div className="flex flex-row items-center w-full min-w-0 gap-x-4">
            {!isEditorEnabled &&
              (adaptiveActions ? (
                <AdaptiveHeaderActions
                  actions={adaptiveActions}
                  deleteAction={deleteAction}
                  buttonsClassName={buttonsClassName}
                />
              ) : (
                <div className="flex-1 flex flex-row gap-x-4 justify-center">
                  {leadingActions}
                  <DialDangerButton
                    className={buttonsClassName}
                    label={t(ButtonsI18nKey.Delete)}
                    appearance={ButtonAppearance.Outlined}
                    iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
                    onClick={onOpenModal}
                  />
                  {children}
                </div>
              ))}
            {jsonConfiguration && <JsonToggleWithFormats view={view} {...jsonConfiguration} />}
          </div>
        )}
      </div>
      {isModalOpen &&
        createPortal(
          <DeleteConfirmationModal
            entity={entity}
            onRemoveEntity={onRemove}
            view={view}
            onCloseModal={onCloseModal}
            isSelectedView={true}
            etag={etag}
            getAssetContext={getAssetContext}
          />,
          document.body,
        )}
    </>
  );
};

export default SimpleButtonsWrapper;
