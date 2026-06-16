import { FC, ReactNode } from 'react';

import { DialIconButton, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import { auditResourceRoute } from '@/src/constants/activity-audit';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { getFormattedResourceType } from '@/src/constants/grid-columns/formatters';
import { ActivityAuditI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';

interface Props {
  activity: DialActivity;
  children?: ReactNode;
}
const ViewHeader: FC<Props> = ({ activity, children }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();
  const epochTimestamp = useLocalDateTimeString(activity.epochTimestampMs);

  const openResourceInNewTab = (activity: DialActivity) => {
    window.open(
      `/${currentLocale}${auditResourceRoute[activity.resourceType]}/${encodeURIComponent(activity.resourceId)}`,
      '_blank',
    );
  };

  return (
    <div className="flex flex-row w-full justify-between flex-wrap lg:flex-nowrap">
      <div className="flex flex-row gap-x-10 w-full flex-wrap">
        {activity.action && <LabelledText label={t(EntitiesI18nKey.Action)} text={activity.action} />}
        {activity.activityType && (
          <LabelledText label={t(ActivityAuditI18nKey.ActivityType)} text={activity.activityType} />
        )}
        {activity.resourceType && (
          <LabelledText
            label={t(ActivityAuditI18nKey.ResourceType)}
            text={getFormattedResourceType(activity.resourceType, t)}
          />
        )}
        {activity.resourceId &&
          activity.resourceType !== ActivityAuditResourceType.SYSTEM_PROPERTIES &&
          activity.resourceType !== ActivityAuditResourceType.ADMIN_PROPERTIES &&
          activity.resourceType !== ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST && (
            <LabelledText label={t(ActivityAuditI18nKey.ResourceId)}>
              <div className="flex flex-row gap-1 items-center">
                <DialTooltip tooltip={activity.resourceId}>{activity.resourceId}</DialTooltip>
                {activity.activityType != ActivityAuditType.Delete && (
                  <DialIconButton
                    onClick={() => openResourceInNewTab(activity)}
                    className="text-secondary size-auto"
                    icon={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
                  />
                )}
              </div>
            </LabelledText>
          )}
        {activity.epochTimestampMs && <LabelledText label={t(ActivityAuditI18nKey.Time)} text={epochTimestamp} />}
        {activity.initiatedEmail && (
          <LabelledText label={t(ActivityAuditI18nKey.Initiated)} text={activity.initiatedEmail} />
        )}
        {activity.initiatedAuthor && (
          <LabelledText label={t(ActivityAuditI18nKey.UserId)} text={activity.initiatedAuthor} />
        )}
      </div>
      {children}
    </div>
  );
};

export default ViewHeader;
