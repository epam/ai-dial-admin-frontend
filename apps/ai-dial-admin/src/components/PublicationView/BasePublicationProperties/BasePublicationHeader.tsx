import React, { FC, useCallback, useEffect, useState } from 'react';
import Button from '@/src/components/Common/Button/Button';
import classNames from 'classnames';
import { ButtonsI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { PopUpState } from '@/src/types/pop-up';
import { createPortal } from 'react-dom';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import TextAreaField from '@/src/components/Common/TextAreaField/TextAreaField';
import { ActionType } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { getModalsTranslations } from '@/src/utils/publications';
import { IconCircleX, IconWorldShare, IconWorldOff } from '@tabler/icons-react';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  onApprove: () => void;
  onDecline: (comment: string) => void;
  route: ApplicationRoute;
  action: ActionType;
}

const BasePublicationHeader: FC<Props> = ({ onApprove, onDecline, route, action }) => {
  const t = useI18n() as (t: string) => string;
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();

  const [keys, setKeys] = useState<Record<string, string>>({});

  const staticContainerClassnames = 'flex flex-row gap-3 divide-x divide-primary';
  const approveButtonClassNames = `${action === ActionType.ADD ? '' : 'bg-red-400'}`;

  const [containerClassNames, setContainerClassNames] = useState(staticContainerClassnames);
  const [buttonsClassNames, setButtonsClassNames] = useState('');
  const [approveModalState, setIsOpenApproveModal] = useState(PopUpState.Closed);
  const [declineModalState, setIsOpenDeclineModal] = useState(PopUpState.Closed);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    setKeys(getModalsTranslations(route, action));
  }, [route, action]);

  useEffect(() => {
    setContainerClassNames(
      classNames(
        staticContainerClassnames,
        isTablet || isMobile ? 'fixed bottom-0 left-0 right-0 h-[62px] bg-layer-3 px-6' : '',
      ),
    );
    setButtonsClassNames(classNames(isTablet || isMobile ? 'w-1/2 flex justify-center' : ''));
  }, [isTablet, isMobile]);

  const approve = useCallback(() => {
    onApprove();
    setIsOpenApproveModal(PopUpState.Closed);
  }, [onApprove]);

  const decline = useCallback(() => {
    onDecline(declineReason);
    setIsOpenDeclineModal(PopUpState.Closed);
  }, [declineReason, onDecline]);

  return (
    <>
      <div className={containerClassNames}>
        <div className="flex flex-row gap-3 w-full p-3 lg:p-0">
          <Button
            cssClass={classNames(`secondary ${buttonsClassNames}`)}
            title={t(ButtonsI18nKey.Decline)}
            onClick={() => setIsOpenDeclineModal(PopUpState.Opened)}
            dataTestId={'publication-decline-button'}
            iconBefore={<IconCircleX {...BASE_ICON_PROPS} />}
          />
          {action === ActionType.ADD ? (
            <Button
              cssClass={`primary ${buttonsClassNames} ${approveButtonClassNames}`}
              title={t(ButtonsI18nKey.Publish)}
              onClick={() => setIsOpenApproveModal(PopUpState.Opened)}
              dataTestId={'publication-approve-button'}
              iconBefore={<IconWorldShare {...BASE_ICON_PROPS} />}
            />
          ) : (
            <Button
              cssClass={`primary ${buttonsClassNames} ${approveButtonClassNames}`}
              title={t(ButtonsI18nKey.Unpublish)}
              onClick={() => setIsOpenApproveModal(PopUpState.Opened)}
              dataTestId={'publication-approve-button'}
              iconBefore={<IconWorldOff {...BASE_ICON_PROPS} />}
            />
          )}
        </div>
      </div>
      {approveModalState === PopUpState.Opened &&
        createPortal(
          <ConfirmationModal
            dataTestId={'publication-approve-modal'}
            heading={t(keys.ApproveModalTitle)}
            onConfirm={approve}
            modalState={approveModalState}
            onClose={() => {
              setIsOpenApproveModal(PopUpState.Closed);
            }}
            confirmClassName={approveButtonClassNames}
            confirmLabel={t(action === ActionType.ADD ? ButtonsI18nKey.Publish : ButtonsI18nKey.Unpublish)}
            description={t(keys.ApproveDescription)}
          />,
          document.body,
        )}
      {declineModalState === PopUpState.Opened &&
        createPortal(
          <ConfirmationModal
            dataTestId={'publication-decline-modal'}
            heading={t(keys.DeclineModalTitle)}
            onConfirm={decline}
            modalState={declineModalState}
            onClose={() => {
              setIsOpenDeclineModal(PopUpState.Closed);
            }}
            confirmLabel={t(ButtonsI18nKey.Decline)}
          >
            <div className="px-6">
              <TextAreaField
                elementId="reason"
                fieldTitle={t(PublicationsI18nKey.DeclineReason)}
                placeholder={t(PublicationsI18nKey.DeclineReasonPlaceholder)}
                value={declineReason}
                onChange={setDeclineReason}
                elementCssClass={'min-h-[120px]'}
              />
            </div>
          </ConfirmationModal>,
          document.body,
        )}
    </>
  );
};

export default BasePublicationHeader;
