import { FC, useEffect, useState } from 'react';

import classNames from 'classnames';

import { getActivityById, getRevisionDetails } from '@/src/app/[lang]/activity-audit/actions';
import ActivityAuditView from '@/src/components/ActivityAuditView/ActivityAuditView';
import Loader from '@/src/components/Common/Loader/Loader';
import Popup from '@/src/components/Common/Popup/Popup';
import { ActivityAuditI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { PopUpState } from '@/src/types/pop-up';
import { getRevisionRouteForEntityType } from '@/src/utils/audit/get-revision-route';

interface Props {
  auditViewId?: string;
  modalState: PopUpState;
  onClose: () => void;
}

const ActivityDetails: FC<Props> = ({ auditViewId, modalState, onClose }) => {
  const t = useI18n();

  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<DialActivity | null>(null);
  const [activityRevision, setActivityRevision] = useState<ActivityAuditEntity | null>(null);
  const [previousRevision, setPreviousRevision] = useState<ActivityAuditEntity | null>(null);

  const containerClassName = classNames('h-[800px] lg:max-w-[75%] md:max-w-[90%]');
  useEffect(() => {
    if (!auditViewId) return;
    getActivityById(auditViewId as string)
      .then((activityDetails) => {
        if (!activityDetails) return;
        setActivity(activityDetails);
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
      heading={t(ActivityAuditI18nKey.ActivityDetails)}
      portalId="ActivityDetailsModal"
      state={modalState}
      containerClassName={containerClassName}
      dividers={true}
    >
      <div className="flex-1 min-h-0 px-6 py-4">
        {loading ? (
          <Loader />
        ) : (
          <ActivityAuditView
            activity={activity || ({} as DialActivity)}
            activityRevision={activityRevision}
            previousRevision={previousRevision}
            isModalView={true}
          />
        )}
      </div>
      <></>
    </Popup>
  );
};

export default ActivityDetails;
