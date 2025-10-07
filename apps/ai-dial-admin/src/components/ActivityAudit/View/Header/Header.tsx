import { FC, ReactNode } from 'react';

import { IconExternalLink } from '@tabler/icons-react';
import { DialButton } from '@epam/ai-dial-ui-kit';

import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { getFormattedResourceType } from '@/src/constants/grid-columns/formatters';
import { ActivityAuditI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditType } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { auditResourceRoute } from '@/src/components/ActivityAudit/View/Header/constants';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';

interface Props {
  activity: DialActivity;
  isModalView?: boolean;
  children?: ReactNode;
}
const ViewHeader: FC<Props> = ({ activity, isModalView, children }) => {
  const t = useI18n() as (key: string) => string;
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
    <div className="flex flex-row w-full justify-between flex-wrap lg:flex-nowrap">
      <div className="flex flex-row gap-10 w-full flex-wrap">
        {activity.action && <LabeledText label={t(EntitiesI18nKey.Action)} text={activity.action} />}
        {activity.activityType && (
          <LabeledText label={t(ActivityAuditI18nKey.ActivityType)} text={activity.activityType} />
        )}
        {activity.resourceType && (
          <LabeledText
            label={t(ActivityAuditI18nKey.ResourceType)}
            text={getFormattedResourceType(activity.resourceType, t)}
          />
        )}
        {activity.resourceId && (
          <LabeledText label={t(ActivityAuditI18nKey.ResourceId)}>
            <div className="flex flex-row gap-1 items-center">
              <Tooltip tooltip={activity.resourceId}>{activity.resourceId}</Tooltip>
              {activity.activityType != ActivityAuditType.Delete && (
                <DialButton
                  onClick={() => openResourceInNewTab(activity)}
                  cssClass="text-secondary"
                  iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
                />
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
              <Tooltip tooltip={activity.activityId}>{activity.activityId}</Tooltip>
              <DialButton
                onClick={() => openActivityInNewTab(activity)}
                cssClass="text-secondary"
                iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
              />
            </div>
          </LabeledText>
        )}
      </div>
      {children}
    </div>
  );
};

export default ViewHeader;
