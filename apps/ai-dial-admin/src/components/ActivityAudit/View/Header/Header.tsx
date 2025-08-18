import { FC, ReactNode } from 'react';

import { IconExternalLink } from '@tabler/icons-react';

import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { getFormattedResourceType } from '@/src/constants/grid-columns/formatters';
import { ActivityAuditI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { ActivityAuditType } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { auditResourceRoute } from '@/src/components/ActivityAudit/View/Header/constants';

interface Props {
  activity: DialActivity;
  isModalView?: boolean;
  children?: ReactNode;
}
const ViewHeader: FC<Props> = ({ activity, isModalView, children }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();

  const openResourceInNewTab = (activity: DialActivity) => {
    window.open(
      `/${currentLocale}${auditResourceRoute[activity.resourceType]}/${encodeURIComponent(activity.resourceId)}`,
      '_blank',
    );
  };

  const openActivityInNewTab = (activity: DialActivity) => {
    window.open(
      `${ApplicationRoute.ActivityAudit}/${getEntityPath(ApplicationRoute.ActivityAudit, activity)}`,
      '_blank',
    );
  };

  return (
    <div className="flex flex-row w-full justify-between">
      <div className="flex flex-row gap-10 w-full">
        {activity.activityType && (
          <LabeledText label={t(ActivityAuditI18nKey.ActivityType)} text={activity.activityType} />
        )}
        {activity.resourceType && (
          <LabeledText
            label={t(ActivityAuditI18nKey.ResourceType)}
            text={getFormattedResourceType(activity.resourceType)}
          />
        )}
        {activity.resourceId && (
          <LabeledText label={t(ActivityAuditI18nKey.ResourceId)}>
            <div className="flex flex-row gap-1 items-center">
              <div>{activity.resourceId}</div>
              {activity.activityType != ActivityAuditType.Delete && (
                <button onClick={() => openResourceInNewTab(activity)} className="text-secondary">
                  <IconExternalLink {...BASE_ICON_PROPS} />
                </button>
              )}
            </div>
          </LabeledText>
        )}
        {activity.epochTimestampMs && (
          <LabeledText
            label={t(ActivityAuditI18nKey.Time)}
            text={formatDateTimeToLocalString(activity.epochTimestampMs)}
          />
        )}
        {activity.initiatedEmail && (
          <LabeledText label={t(ActivityAuditI18nKey.Initiated)} text={activity.initiatedEmail} />
        )}
        {activity.initiatedAuthor && (
          <LabeledText label={t(ActivityAuditI18nKey.UserId)} text={activity.initiatedAuthor} />
        )}
        {activity.activityId && isModalView && (
          <LabeledText label={t(ActivityAuditI18nKey.ActivityId)}>
            <div className="flex flex-row gap-1 items-center">
              <div>{activity.activityId}</div>
              <button onClick={() => openActivityInNewTab(activity)} className="text-secondary">
                <IconExternalLink {...BASE_ICON_PROPS} />
              </button>
            </div>
          </LabeledText>
        )}
      </div>
      {children}
    </div>
  );
};

export default ViewHeader;
