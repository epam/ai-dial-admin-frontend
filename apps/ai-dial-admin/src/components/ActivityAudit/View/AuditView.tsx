'use client';

import { IconRestore } from '@tabler/icons-react';
import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';
import { useRouter } from 'next/navigation';
import { ButtonVariant, DialButton, DialConfirmationPopup, DialTooltip } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { ActivityAuditI18nKey, ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ActivityAuditEntity, CompareView, DiffView } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';
import { rollbackEntityPerRevision } from '@/src/utils/audit/get-rollback-request';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import EntityDiff from '@/src/components/ActivityAudit/View/DiffReport/EntityDiff';
import CompareControl from '@/src/components/ActivityAudit/View/DiffReport/CompareControl';
import FilterControl from '@/src/components/ActivityAudit/View/DiffReport/FilterControl';
import ViewHeader from '@/src/components/ActivityAudit/View/Header/Header';
import { generateCurrentResource } from './utils/generate-diffs';

interface Props {
  activity: DialActivity;
  activityRevision: ActivityAuditEntity | null;
  previousRevision: ActivityAuditEntity | null;
  isModalView?: boolean;
  hideComparator?: boolean;
  entity?: BaseEntity;
}

const AuditView: FC<Props> = ({
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

  const [isOpenModal, setIsOpenModal] = useState(false);
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
    setIsOpenModal(true);
  }, [setIsOpenModal]);

  const onCloseModal = useCallback(() => {
    setIsOpenModal(false);
  }, [setIsOpenModal]);

  const resourceRollback = useCallback(() => {
    setIsLoading(true);
    rollbackEntityPerRevision(activity, activityRevision, previousRevision)
      .then((res) => {
        setIsLoading(false);
        if (res?.success) {
          showNotification(
            getSuccessNotification(
              t(ActivityAuditI18nKey.ResourceRollback),
              t(ActivityAuditI18nKey.ResourceRollbackDescription),
            ),
          );
          router.push(ApplicationRoute.ActivityAudit);
        } else {
          showNotification(
            getErrorNotification(
              res?.errorHeader || t(ActivityAuditI18nKey.ResourceRollbackErrorTitle),
              res?.errorMessage,
            ),
          );
        }

        onCloseModal();
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
          <div className="flex flex-row flex-wrap justify-between mb-6 gap-3">
            <h1 className="flex flex-row items-center gap-x-3">
              <DialTooltip tooltip={activity.activityId}>{activity.activityId}</DialTooltip>
              <CopyButton field={activity.activityId} title={t(EntityFieldsI18nKey.id)} />
            </h1>
            <div className="flex flex-row items-center gap-4 flex-wrap">
              <CompareControl compareView={compareView} setCompareView={setCompareView} />
              <FilterControl diffView={diffView} setDiffView={setDiffView} />
              <DialButton
                iconBefore={<IconRestore {...BASE_ICON_PROPS} />}
                variant={ButtonVariant.Secondary}
                title={t(ActivityAuditI18nKey.RollbackResource)}
                onClick={onOpenModal}
              />
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col relative divide-y divide-primary min-h-0">
          <ViewHeader activity={activity} isModalView={isModalView}>
            {isModalView && (
              <div className="flex flex-row gap-3">
                {!hideComparator && <CompareControl compareView={compareView} setCompareView={setCompareView} />}
                <FilterControl diffView={diffView} setDiffView={setDiffView} />
              </div>
            )}
          </ViewHeader>
          <EntityDiff
            currentEntity={before}
            compareEntity={after}
            type={activity.resourceType}
            diffView={diffView}
            compareView={compareView}
          />
        </div>
      </div>
      {isOpenModal &&
        createPortal(
          <DialConfirmationPopup
            open={isOpenModal}
            isLoading={isLoading}
            title={t(ActivityAuditI18nKey.ConfirmRollback)}
            onConfirm={resourceRollback}
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
          </DialConfirmationPopup>,
          document.body,
        )}
    </>
  );
};

export default AuditView;
