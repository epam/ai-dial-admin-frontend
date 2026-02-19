import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  DialPrimaryButton,
  DialConfirmationPopup,
  DialTextAreaField,
  DialSwitch,
  DialNeutralButton,
} from '@epam/ai-dial-ui-kit';
import { IconCircleX, IconTrashX, IconWorldOff, IconWorldShare } from '@tabler/icons-react';
import classNames from 'classnames';

import {
  ButtonsI18nKey,
  DeleteI18nKey,
  EntitiesI18nKey,
  ErrorI18nKey,
  PublicationsI18nKey,
} from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { ActionType } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { getModalsTranslations, isAddAction } from '@/src/utils/publications';

interface Props {
  onApprove: () => void;
  onDecline: (comment: string) => void;
  onDelete: () => void;
  route: ApplicationRoute;
  action: ActionType;
  setIsJsonView: (value: boolean) => void;
  isJsonView: boolean;
  isDelete?: boolean;
}

const PublicationHeader: FC<Props> = ({
  onApprove,
  onDecline,
  onDelete,
  route,
  action,
  isJsonView,
  setIsJsonView,
  isDelete,
}) => {
  const t = useI18n();
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();

  const [keys, setKeys] = useState<Record<string, string>>({});

  const staticContainerClassName = 'flex flex-row gap-3 divide-x divide-primary';
  const approveButtonClassName = `${isAddAction(action) ? '' : 'bg-red-400'}`;

  const [containerClassName, setContainerClassName] = useState(staticContainerClassName);
  const [buttonsClassName, setButtonsClassName] = useState('');
  const [isApproveModalOpen, setIsOpenApproveModal] = useState(false);
  const [isDeclineModalOpen, setIsOpenDeclineModal] = useState(false);
  const [isDeleteModalOpen, setIsOpenDeleteModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const isDeclineInvalid = useMemo(() => {
    const value = declineReason.trim();
    return !value || value.length < 15 || value.length > 255;
  }, [declineReason]);

  useEffect(() => {
    setKeys(getModalsTranslations(route, action));
  }, [route, action]);

  useEffect(() => {
    setContainerClassName(
      classNames(
        staticContainerClassName,
        (isTablet || isMobile) && 'fixed bottom-0 left-0 right-0 h-[62px] bg-layer-3 px-6',
      ),
    );
    setButtonsClassName(classNames((isTablet || isMobile) && 'w-1/2 flex justify-center'));
  }, [isTablet, isMobile]);

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

  return (
    <>
      <div className={containerClassName}>
        <div className="flex flex-row gap-3 w-full p-3 lg:p-0">
          {isDelete ? (
            <DialNeutralButton
              className={buttonsClassName}
              label={t(ButtonsI18nKey.Delete)}
              onClick={() => setIsOpenDeleteModal(true)}
              iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
            />
          ) : (
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

          <DialSwitch
            switchId="jsonView"
            isOn={isJsonView}
            onChange={() => setIsJsonView(!isJsonView)}
            label={t(EntitiesI18nKey.JSONViewer)}
          />
        </div>
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
          />,
          document.body,
        )}
      {isDeclineModalOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isDeclineModalOpen}
            header={t(keys.DeclineModalTitle)}
            onConfirm={decline}
            disableConfirmButton={isDeclineInvalid}
            onClose={() => {
              setIsOpenDeclineModal(false);
            }}
            confirmLabel={t(ButtonsI18nKey.Decline)}
          >
            <div className="px-6">
              <DialTextAreaField
                elementId="reason"
                fieldTitle={t(PublicationsI18nKey.DeclineReason)}
                placeholder={t(PublicationsI18nKey.DeclineReasonPlaceholder)}
                value={declineReason}
                onChange={setDeclineReason}
                elementClassName="min-h-[120px]"
                invalid={isDeclineInvalid}
                errorText={isDeclineInvalid ? t(ErrorI18nKey.CommentError) : ''}
              />
            </div>
          </DialConfirmationPopup>,
          document.body,
        )}
    </>
  );
};

export default PublicationHeader;
