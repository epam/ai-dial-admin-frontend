import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonVariant, DialConfirmationPopup, DialButton, DialTextAreaField } from '@epam/ai-dial-ui-kit';
import { IconCircleX, IconWorldOff, IconWorldShare } from '@tabler/icons-react';
import classNames from 'classnames';

import { ButtonsI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { ActionType } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { getModalsTranslations } from '@/src/utils/publications';

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
  const [isApproveModalOpen, setIsOpenApproveModal] = useState(false);
  const [isDeclineModalOpen, setIsOpenDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const isDeclineInvalid = useMemo(() => {
    const value = declineReason.trim();
    return !value || value.length < 15 || value.length > 255;
  }, [declineReason]);

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
    setIsOpenApproveModal(false);
  }, [onApprove]);

  const decline = useCallback(() => {
    onDecline(declineReason);
    setIsOpenDeclineModal(false);
  }, [declineReason, onDecline]);

  return (
    <>
      <div className={containerClassNames}>
        <div className="flex flex-row gap-3 w-full p-3 lg:p-0">
          <DialButton
            variant={ButtonVariant.Secondary}
            cssClass={buttonsClassNames}
            title={t(ButtonsI18nKey.Decline)}
            onClick={() => setIsOpenDeclineModal(true)}
            iconBefore={<IconCircleX {...BASE_ICON_PROPS} />}
          />
          {action === ActionType.ADD ? (
            <DialButton
              variant={ButtonVariant.Primary}
              cssClass={classNames(buttonsClassNames, approveButtonClassNames)}
              title={t(ButtonsI18nKey.Publish)}
              onClick={() => setIsOpenApproveModal(true)}
              iconBefore={<IconWorldShare {...BASE_ICON_PROPS} />}
            />
          ) : (
            <DialButton
              variant={ButtonVariant.Primary}
              cssClass={classNames(buttonsClassNames, approveButtonClassNames)}
              title={t(ButtonsI18nKey.Unpublish)}
              onClick={() => setIsOpenApproveModal(true)}
              iconBefore={<IconWorldOff {...BASE_ICON_PROPS} />}
            />
          )}
        </div>
      </div>
      {isApproveModalOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isApproveModalOpen}
            title={t(keys.ApproveModalTitle)}
            onConfirm={approve}
            onClose={() => {
              setIsOpenApproveModal(false);
            }}
            confirmClassName={approveButtonClassNames}
            confirmLabel={t(action === ActionType.ADD ? ButtonsI18nKey.Publish : ButtonsI18nKey.Unpublish)}
            description={t(keys.ApproveDescription)}
          />,
          document.body,
        )}
      {isDeclineModalOpen &&
        createPortal(
          <DialConfirmationPopup
            open={isDeclineModalOpen}
            title={t(keys.DeclineModalTitle)}
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
                elementCssClass={'min-h-[120px]'}
              />
            </div>
          </DialConfirmationPopup>,
          document.body,
        )}
    </>
  );
};

export default BasePublicationHeader;
