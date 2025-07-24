import { FC } from 'react';

import { IconExternalLink } from '@tabler/icons-react';

import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { getEntityPath } from '@/src/components/EntityListView/entity-list-view';
import { getFormattedResourceType } from '@/src/constants/grid-columns/formatters';
import { ActivityAuditI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { ActivityAuditType } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { auditResourceRoute } from './ActivityAuditViewHeader.utils';

interface Props {
  activity: DialActivity;
  isModalView?: boolean;
}
const ActivityAuditViewHeader: FC<Props> = ({ activity, isModalView }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();

  const openInNewTab = (activity: DialActivity) => {
    if (isModalView) {
      window.open(
        `${ApplicationRoute.ActivityAudit}/${getEntityPath(ApplicationRoute.ActivityAudit, activity)}`,
        '_blank',
      );
    } else {
      window.open(
        `/${currentLocale}${auditResourceRoute[activity.resourceType]}/${encodeURIComponent(activity.resourceId)}`,
        '_blank',
      );
    }
  };

  return (
    <div className="flex flex-row gap-10 w-full">
      <LabeledText label={t(ActivityAuditI18nKey.ActivityType)} text={activity.activityType} />
      {!isModalView && (
        <LabeledText
          label={t(ActivityAuditI18nKey.ResourceType)}
          text={getFormattedResourceType(activity.resourceType)}
        />
      )}
      {!isModalView && (
        <LabeledText label={t(ActivityAuditI18nKey.ResourceId)}>
          <div className="flex flex-row gap-1 items-center">
            <div>{activity.resourceId}</div>
            {activity.activityType != ActivityAuditType.Delete && (
              <button onClick={() => openInNewTab(activity)} className="text-secondary">
                <IconExternalLink {...BASE_ICON_PROPS} />
              </button>
            )}
          </div>
        </LabeledText>
      )}
      <LabeledText label={t(ActivityAuditI18nKey.Time)} text={formatDateTimeToLocalString(activity.epochTimestampMs)} />
      <LabeledText label={t(ActivityAuditI18nKey.Initiated)} text={activity.initiatedEmail} />
      {!isModalView && <LabeledText label={t(ActivityAuditI18nKey.UserId)} text={activity.initiatedAuthor} />}
      {isModalView && (
        <LabeledText label={t(ActivityAuditI18nKey.ActivityId)}>
          <div className="flex flex-row gap-1 items-center">
            <div>{activity.activityId}</div>
            <button onClick={() => openInNewTab(activity)} className="text-secondary">
              <IconExternalLink {...BASE_ICON_PROPS} />
            </button>
          </div>
        </LabeledText>
      )}
    </div>
  );
};

export default ActivityAuditViewHeader;
