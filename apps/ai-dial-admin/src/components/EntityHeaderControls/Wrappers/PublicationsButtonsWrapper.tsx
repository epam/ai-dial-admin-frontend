'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  NotificationVariant,
  ButtonAppearance,
  DialNotification,
  DialConfirmationPopup,
  DialDangerButton,
  DialNeutralButton,
  DialPrimaryButton,
  DialTextarea,
} from '@epam/ai-dial-ui-kit';
import { IconCircleX, IconTrashX, IconWorldOff, IconWorldShare } from '@tabler/icons-react';
import classNames from 'classnames';

import { approvePublication, declinePublication, deletePublication } from '@/src/app/actions/publications';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { DECLINE_REASON_MAX_LENGTH, DECLINE_REASON_MIN_LENGTH } from '@/src/components/EntityHeaderControls/constants';
import { showEditorErrorNotifications } from '@/src/components/EntityHeaderControls/Buttons/utils';
import JsonToggles from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggle';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import { ButtonsI18nKey, DeleteI18nKey, ErrorI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
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
import { useI18n } from '@/src/locales/client';
import { ActionType, Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { getModalsTranslations, isAddAction } from '@/src/utils/publications';

export interface PublicationsButtonsWrapperProps<T> {
  view: ApplicationRoute;
  isChanged: boolean;
  jsonConfiguration?: JsonConfiguration;
  entity: T;
  isOnlyDeleteAvailable?: boolean;

  onDiscard: () => void;
  onSave: () => void;
}

const PublicationsButtonsWrapper = <T extends Publication>({
  view,
  entity,
  jsonConfiguration,
  isChanged,
  isOnlyDeleteAvailable,
  onDiscard,
  onSave,
}: PublicationsButtonsWrapperProps<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isEditorEnabled = jsonConfiguration?.isEditorEnabled;
  const { isValid, dispatch, jsonErrors } = useSaveValidationContext();
  const { showNotification } = useNotification();
  const router = useRouter();

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const isDisableSave = useMemo(() => (isEditorEnabled ? false : !isValid), [isEditorEnabled, isValid]);
  const action = useMemo(() => entity.action, [entity.action]);

  const [containerClassName, setContainerClassName] = useState(SELECT_ENTITY_HEADER_CLASS);
  const [buttonsClassName, setButtonsClassName] = useState('');

  const [keys, setKeys] = useState<Record<string, string>>({});

  const approveButtonClassName = `${isAddAction(action) ? '' : 'bg-red-400'}`;

  const [isApproveModalOpen, setIsOpenApproveModal] = useState(false);
  const [isDeclineModalOpen, setIsOpenDeclineModal] = useState(false);
  const [isDeleteModalOpen, setIsOpenDeleteModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const declineErrorMessage = useMemo(() => {
    const value = declineReason.trim();
    if (!value || value.length < DECLINE_REASON_MIN_LENGTH)
      return t(ErrorI18nKey.CommentError, { min: DECLINE_REASON_MIN_LENGTH });
    if (value.length > DECLINE_REASON_MAX_LENGTH)
      return t(ErrorI18nKey.CommentMaxLengthError, { max: DECLINE_REASON_MAX_LENGTH });
    return '';
  }, [declineReason, t]);

  const onApprove = useCallback(() => {
    approvePublication(entity.path).then((res) => {
      if (res.success) {
        router.push(view);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [entity.path, router, showNotification, view]);

  const onDecline = useCallback(
    (comment: string) => {
      declinePublication(entity.path, comment).then((res) => {
        if (res.success) {
          router.push(view);
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [entity.path, router, showNotification, view],
  );

  const onDelete = useCallback(() => {
    deletePublication(entity.path).then((res) => {
      if (res.success) {
        router.push(view);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [entity.path, router, showNotification, view]);

  useEffect(() => {
    setKeys(getModalsTranslations(view, action));
  }, [view, action]);

  const approve = useCallback(() => {
    onApprove();
    setIsOpenApproveModal(false);
  }, [onApprove]);

  const decline = useCallback(() => {
    onDecline(declineReason);
    setIsOpenDeclineModal(false);
  }, [declineReason, onDecline]);

  const remove = useCallback(() => {
    onDelete();
    setIsOpenDeleteModal(false);
  }, [onDelete]);

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

  const publishWarning = useMemo(() => {
    if (isAddAction(action) && !entity.rules?.length) {
      return (
        <div className="flex flex-col gap-2 px-6 py-4">
          <DialNotification
            variant={NotificationVariant.Info}
            message={<span className="text-sm">{t(PublicationsI18nKey.PublishWarningTitle)}</span>}
          />
          <span className="text-sm text-secondary">{t(PublicationsI18nKey.PublishWarningDescription)}</span>
        </div>
      );
    }
    return null;
  }, [action, entity.rules?.length, t]);

  return (
    <>
      <div className={containerClassName}>
        {isReadOnlyAdmin ? (
          jsonConfiguration && !isOnlyDeleteAvailable && <JsonToggles {...jsonConfiguration} />
        ) : isChanged ? (
          <ChangedEntityButtons disableSave={isDisableSave} onDiscard={onStartDiscard} onSave={onTryToSave} />
        ) : (
          <div className="flex flex-row items-center w-full gap-x-4">
            {!isEditorEnabled && (
              <div className="flex-1 flex flex-row gap-x-4 justify-center">
                <div className="flex flex-row gap-3 w-full p-3 lg:p-0">
                  <DialDangerButton
                    className={buttonsClassName}
                    label={t(ButtonsI18nKey.Delete)}
                    appearance={ButtonAppearance.Outlined}
                    onClick={() => setIsOpenDeleteModal(true)}
                    iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
                  />
                  {!isOnlyDeleteAvailable && (
                    <>
                      <DialNeutralButton
                        className={buttonsClassName}
                        label={t(ButtonsI18nKey.Decline)}
                        onClick={() => setIsOpenDeclineModal(true)}
                        iconBefore={<IconCircleX {...BASE_BUTTON_ICON_PROPS} />}
                      />
                      {isAddAction(action) && (
                        <DialPrimaryButton
                          className={classNames(buttonsClassName, approveButtonClassName)}
                          label={t(ButtonsI18nKey.Publish)}
                          onClick={() => setIsOpenApproveModal(true)}
                          iconBefore={<IconWorldShare {...BASE_BUTTON_ICON_PROPS} />}
                        />
                      )}
                      {action === ActionType.DELETE && (
                        <DialPrimaryButton
                          className={classNames(buttonsClassName, approveButtonClassName)}
                          label={t(ButtonsI18nKey.Unpublish)}
                          onClick={() => setIsOpenApproveModal(true)}
                          iconBefore={<IconWorldOff {...BASE_BUTTON_ICON_PROPS} />}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            {jsonConfiguration && !isOnlyDeleteAvailable && <JsonToggles {...jsonConfiguration} />}
          </div>
        )}
      </div>
      {isDeleteModalOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isDeleteModalOpen}
            header={t(DeleteI18nKey.Title, { entity: t(PublicationsI18nKey.Publication) })}
            onConfirm={remove}
            onClose={() => {
              setIsOpenDeleteModal(false);
            }}
            confirmLabel={t(ButtonsI18nKey.Delete)}
            description={t(DeleteI18nKey.Confirming, { entity: t(PublicationsI18nKey.Publication) })}
          />,

          document.body,
        )}
      {isApproveModalOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isApproveModalOpen}
            header={t(keys.ApproveModalTitle)}
            onConfirm={approve}
            onClose={() => {
              setIsOpenApproveModal(false);
            }}
            confirmClassName={approveButtonClassName}
            confirmLabel={t(isAddAction(action) ? ButtonsI18nKey.Publish : ButtonsI18nKey.Unpublish)}
            description={t(keys.ApproveDescription)}
          >
            {publishWarning}
          </DialConfirmationPopup>,
          document.body,
        )}
      {isDeclineModalOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isDeclineModalOpen}
            header={t(keys.DeclineModalTitle)}
            onConfirm={decline}
            disableConfirmButton={!!declineErrorMessage}
            onClose={() => {
              setIsOpenDeclineModal(false);
            }}
            confirmLabel={t(ButtonsI18nKey.Decline)}
          >
            <div className="px-6">
              <DialTextarea
                id="reason"
                labelProps={{ label: t(PublicationsI18nKey.DeclineReason) }}
                placeholder={t(PublicationsI18nKey.DeclineReasonPlaceholder)}
                value={declineReason}
                onChange={setDeclineReason}
                invalid={!!declineErrorMessage}
                error={declineErrorMessage}
              />
            </div>
          </DialConfirmationPopup>,
          document.body,
        )}
    </>
  );
};

export default PublicationsButtonsWrapper;
