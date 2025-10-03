import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialTextAreaField } from '@epam/ai-dial-ui-kit';
import { IconCircleX, IconWorldOff, IconWorldShare } from '@tabler/icons-react';
import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import { ButtonsI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { ActionType } from '@/src/models/dial/publications';
import { PopUpState } from '@/src/types/pop-up';
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
  const [approveModalState, setIsOpenApproveModal] = useState(PopUpState.Closed);
  const [declineModalState, setIsOpenDeclineModal] = useState(PopUpState.Closed);
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
            iconBefore={<IconCircleX {...BASE_ICON_PROPS} />}
          />
          {action === ActionType.ADD ? (
            <Button
              cssClass={`primary ${buttonsClassNames} ${approveButtonClassNames}`}
              title={t(ButtonsI18nKey.Publish)}
              onClick={() => setIsOpenApproveModal(PopUpState.Opened)}
              iconBefore={<IconWorldShare {...BASE_ICON_PROPS} />}
            />
          ) : (
            <Button
              cssClass={`primary ${buttonsClassNames} ${approveButtonClassNames}`}
              title={t(ButtonsI18nKey.Unpublish)}
              onClick={() => setIsOpenApproveModal(PopUpState.Opened)}
              iconBefore={<IconWorldOff {...BASE_ICON_PROPS} />}
            />
          )}
        </div>
      </div>
      {approveModalState === PopUpState.Opened &&
        createPortal(
          <ConfirmationModal
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
            heading={t(keys.DeclineModalTitle)}
            onConfirm={decline}
            modalState={declineModalState}
            disableConfirmButton={isDeclineInvalid}
            onClose={() => {
              setIsOpenDeclineModal(PopUpState.Closed);
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
          </ConfirmationModal>,
          document.body,
        )}
    </>
  );
};

export default BasePublicationHeader;
