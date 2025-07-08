'use client';

import { IconRestore } from '@tabler/icons-react';
import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import Button from '@/src/components/Common/Button/Button';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { ActivityAuditI18nKey, ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { rollbackEntityPerRevision } from '@/src/utils/audit/get-rollback-request';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { useRouter } from 'next/navigation';
import ActivityAuditEntityDiff from './ActivityAuditViewDiff/ActivityAuditEntityDiff';
import ActivityAuditViewHeader from './ActivityAuditViewHeader/ActivityAuditViewHeader';
import { generateCurrentResource } from './activity-audit.utils';

interface Props {
  activity: DialActivity;
  activityRevision: ActivityAuditEntity | null;
  previousRevision: ActivityAuditEntity | null;
}

const ActivityAuditView: FC<Props> = ({ activity, activityRevision, previousRevision }) => {
  const t = useI18n();
  const router = useRouter();

  const { showNotification } = useNotification();

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [isLoading, setIsLoading] = useState(false);

  const currentEntity = generateCurrentResource(activityRevision, previousRevision, activity.resourceType, true);
  const compareEntity = generateCurrentResource(previousRevision, activityRevision, activity.resourceType);

  const onOpenModal = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, [setModalState]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

  const resourceRollback = useCallback(() => {
    setIsLoading(true);
    rollbackEntityPerRevision(activity, activityRevision, previousRevision)
      .then(() => {
        setIsLoading(false);
        showNotification(
          getSuccessNotification(
            t(ActivityAuditI18nKey.ResourceRollback),
            t(ActivityAuditI18nKey.ResourceRollbackDescription),
          ),
        );
        onCloseModal();
        router.push(ApplicationRoute.ActivityAudit);
      })
      .catch(() => {
        setIsLoading(false);
        showNotification(
          getErrorNotification(
            t(ActivityAuditI18nKey.ResourceRollbackErrorTitle),
            t(ActivityAuditI18nKey.ResourceRollbackErrorDescription),
          ),
        );
      });
  }, [onCloseModal, showNotification, activity, router, activityRevision, previousRevision, t]);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4">
        <div className="flex flex-row justify-between mb-6">
          <h1 className="flex flex-row items-center gap-x-3">
            {activity.activityId} <CopyButton field={activity.activityId} title={t(CreateI18nKey.IdTitle)} />
          </h1>
          <Button
            iconBefore={<IconRestore {...BASE_ICON_PROPS} />}
            cssClass="secondary"
            title={t(ActivityAuditI18nKey.RollbackResource)}
            onClick={onOpenModal}
          />
        </div>
        <div className="flex-1 flex flex-col relative divide-y divide-primary min-h-0">
          <ActivityAuditViewHeader activity={activity} />
          <ActivityAuditEntityDiff
            currentEntity={currentEntity}
            compareEntity={compareEntity}
            type={activity.resourceType}
          />
        </div>
      </div>
      {modalState === PopUpState.Opened &&
        createPortal(
          <ConfirmationModal
            isLoading={isLoading}
            heading={t(ActivityAuditI18nKey.ConfirmRollback)}
            onConfirm={resourceRollback}
            modalState={modalState}
            confirmLabel={t(ButtonsI18nKey.Rollback)}
            onClose={onCloseModal}
          >
            <div className="text-secondary small-150 px-6 py-4">
              <p>
                <span>{t(ActivityAuditI18nKey.ConfirmSelectionRollbackDescription)}</span>
                <span className="important-text-part">{formatDateTimeToLocalString(activity?.epochTimestampMs)}</span>
              </p>
              <p>{t(ActivityAuditI18nKey.ConfirmRollbackAsking)}</p>
            </div>
          </ConfirmationModal>,
          document.body,
        )}
    </>
  );
};

export default ActivityAuditView;
