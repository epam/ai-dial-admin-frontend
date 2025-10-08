import { FC, useEffect, useState } from 'react';

import classNames from 'classnames';
import { DialLoader } from '@epam/ai-dial-ui-kit';

import { getActivityById, getRevisionDetails } from '@/src/app/[lang]/activity-audit/actions';
import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import Popup from '@/src/components/Common/Popup/Popup';
import { ActivityAuditI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { PopUpState } from '@/src/types/pop-up';
import { getRevisionRouteForEntityType } from '@/src/utils/audit/get-revision-route';

interface Props {
  auditViewId?: string;
  modalState: PopUpState;
  onClose: () => void;
  partialActivity?: DialActivity;
  currentState?: ActivityAuditEntity;
  rollBackState?: ActivityAuditEntity;
  entity?: BaseEntity;
  heading?: string;
}

const ActivityDetails: FC<Props> = ({
  auditViewId,
  modalState,
  onClose,
  partialActivity,
  currentState,
  rollBackState,
  entity,
  heading,
}) => {
  const t = useI18n();

  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<DialActivity | null>(partialActivity || null);
  const [activityRevision, setActivityRevision] = useState<ActivityAuditEntity | null>(currentState || null);
  const [previousRevision, setPreviousRevision] = useState<ActivityAuditEntity | null>(rollBackState || null);

  const containerClassName = classNames('h-[800px] lg:max-w-[75%] md:max-w-[90%]');
  useEffect(() => {
    if (!auditViewId) return;
    setLoading(true);
    getActivityById(auditViewId as string)
      .then((activityDetails) => {
        if (!activityDetails) return;
        setActivity({
          activityId: activityDetails.activityId,
          epochTimestampMs: activityDetails.epochTimestampMs,
          initiatedEmail: activityDetails.initiatedEmail,
          activityType: activityDetails.activityType,
          resourceType: activityDetails.resourceType,
        } as DialActivity);
        const route = getRevisionRouteForEntityType(
          activityDetails?.resourceType,
          decodeURIComponent(activityDetails?.resourceId as string),
        );
        if (!route) return;
        Promise.all([
          getRevisionDetails(`${route}${activityDetails.revision}`),
          getRevisionDetails(`${route}${activityDetails.revision - 1}`),
        ])
          .then(([revision, prevRevision]) => {
            setActivityRevision(revision);
            setPreviousRevision(prevRevision);
          })
          .catch((err) => {
            console.error('Error fetching revisions:', err);
          });
      })
      .catch((err) => {
        console.error('Error fetching activity:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [auditViewId]);

  return (
    <Popup
      onClose={onClose}
      heading={heading || t(ActivityAuditI18nKey.ActivityDetails)}
      portalId="ActivityDetailsModal"
      state={modalState}
      containerClassName={containerClassName}
      dividers={true}
    >
      <div className="flex-1 min-h-0 px-6 py-4">
        {loading ? (
          <DialLoader />
        ) : (
          <AuditView
            activity={activity || ({} as DialActivity)}
            activityRevision={activityRevision}
            previousRevision={previousRevision}
            isModalView={true}
            hideComparator={!auditViewId}
            entity={entity}
          />
        )}
      </div>
      <></>
    </Popup>
  );
};

export default ActivityDetails;
