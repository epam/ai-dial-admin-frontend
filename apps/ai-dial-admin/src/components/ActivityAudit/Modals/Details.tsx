import { FC, useEffect, useState } from 'react';

import { DialLoader, DialPopup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getActivityById, getRevisionDetails } from '@/src/app/[lang]/activity-audit/actions';
import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import { ActivityAuditI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { getRevisionRouteForEntityType } from '@/src/utils/audit/get-revision-route';

interface Props {
  auditViewId?: string;
  isModalOpen: boolean;
  onClose: () => void;
  partialActivity?: DialActivity;
  currentState?: ActivityAuditEntity;
  rollBackState?: ActivityAuditEntity;
  entity?: BaseEntity;
  heading?: string;
}

const ActivityDetails: FC<Props> = ({
  auditViewId,
  isModalOpen,
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
    <DialPopup
      onClose={onClose}
      title={heading || t(ActivityAuditI18nKey.ActivityDetails)}
      portalId="ActivityDetailsModal"
      open={isModalOpen}
      size={PopupSize.Lg}
      cssClass="h-[800px]"
      dividers={true}
    >
      <div className="h-full px-6 py-4">
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
    </DialPopup>
  );
};

export default ActivityDetails;
