'use client';

import { IconRestore } from '@tabler/icons-react';
import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { ActivityAuditI18nKey, ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { ActivityAuditEntity, CompareView, DiffView } from '@/src/types/activity-audit';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { rollbackEntityPerRevision } from '@/src/utils/audit/get-rollback-request';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { useRouter } from 'next/navigation';
import { generateCurrentResource } from './activity-audit.utils';
import ActivityAuditEntityDiff from './ActivityAuditViewDiff/ActivityAuditEntityDiff';
import ActivityAuditEntityDiffCompare from './ActivityAuditViewDiff/ActivityAuditEntityDiffCompare';
import ActivityAuditEntityDiffFilter from './ActivityAuditViewDiff/ActivityAuditEntityDiffFilter';
import ActivityAuditViewHeader from './ActivityAuditViewHeader/ActivityAuditViewHeader';

interface Props {
  activity: DialActivity;
  activityRevision: ActivityAuditEntity | null;
  previousRevision: ActivityAuditEntity | null;
  isModalView?: boolean;
  hideComparator?: boolean;
  entity?: DialBaseEntity;
}

const ActivityAuditView: FC<Props> = ({
  activity,
  activityRevision,
  previousRevision,
  isModalView,
  hideComparator,
  entity,
}) => {
  const t = useI18n() as (t: string) => string;
  const router = useRouter();

  const { showNotification } = useNotification();

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [isLoading, setIsLoading] = useState(false);
  const [diffView, setDiffView] = useState(DiffView.ALL);
  const [compareView, setCompareView] = useState(CompareView.NEXT);

  const before = generateCurrentResource(
    compareView === CompareView.NEXT ? activityRevision : (entity as ActivityAuditEntity),
    previousRevision,
    activity.resourceType,
    true,
    t,
  );
  const after = generateCurrentResource(
    previousRevision,
    compareView === CompareView.NEXT ? activityRevision : (entity as ActivityAuditEntity),
    activity.resourceType,
    false,
    t,
  );

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
  }, [setIsLoading, activity, activityRevision, previousRevision, showNotification, t, onCloseModal, router]);

  return (
    <>
      <div
        className={classNames(
          'flex flex-col flex-1 min-h-0 w-full rounded p-4 pb-14 lg:pb-4',
          isModalView ? 'h-full bg-layer-3' : 'bg-layer-2',
        )}
      >
        {!isModalView && (
          <div className="flex flex-row justify-between mb-6">
            <h1 className="flex flex-row items-center gap-x-3">
              {activity.activityId} <CopyButton field={activity.activityId} title={t(CreateI18nKey.IdTitle)} />
            </h1>
            <div className="flex flex-row items-center gap-4">
              <ActivityAuditEntityDiffCompare compareView={compareView} setCompareView={setCompareView} />
              <ActivityAuditEntityDiffFilter diffView={diffView} setDiffView={setDiffView} />
              <Button
                iconBefore={<IconRestore {...BASE_ICON_PROPS} />}
                cssClass="secondary"
                title={t(ActivityAuditI18nKey.RollbackResource)}
                onClick={onOpenModal}
              />
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col relative divide-y divide-primary min-h-0">
          <ActivityAuditViewHeader activity={activity} isModalView={isModalView}>
            {isModalView && (
              <div className="flex flex-row gap-3">
                {!hideComparator && (
                  <ActivityAuditEntityDiffCompare compareView={compareView} setCompareView={setCompareView} />
                )}
                <ActivityAuditEntityDiffFilter diffView={diffView} setDiffView={setDiffView} />
              </div>
            )}
          </ActivityAuditViewHeader>
          <ActivityAuditEntityDiff
            currentEntity={before}
            compareEntity={after}
            type={activity.resourceType}
            diffView={diffView}
            compareView={compareView}
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
