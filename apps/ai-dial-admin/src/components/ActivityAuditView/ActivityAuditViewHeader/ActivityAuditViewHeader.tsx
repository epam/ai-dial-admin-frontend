import { FC } from 'react';

import { IconExternalLink } from '@tabler/icons-react';

import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import { ActivityAuditI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/dial/activity-audit';
import { ActivityAuditType } from '@/src/types/activity-audit';
import { formatTimestampToDate } from '@/src/utils/formatting/date';
import { auditResourceRoute } from './ActivityAuditViewHeader.utils';
import { getFormattedResourceType } from '@/src/constants/grid-columns/formatters';

interface Props {
  activity: DialActivity;
}
const ActivityAuditViewHeader: FC<Props> = ({ activity }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();

  const openInNewTab = (activity: DialActivity) => {
    window.open(
      `/${currentLocale}${auditResourceRoute[activity.resourceType]}/${encodeURIComponent(activity.resourceId)}`,
      '_blank',
    );
  };

  return (
    <div className="flex flex-row gap-10 w-full">
      <LabeledText label={t(ActivityAuditI18nKey.ActivityType)} text={activity.activityType} />
      <LabeledText
        label={t(ActivityAuditI18nKey.ResourceType)}
        text={getFormattedResourceType(activity.resourceType)}
      />
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
      <LabeledText label={t(ActivityAuditI18nKey.Time)} text={formatTimestampToDate(activity.epochTimestampMs)} />
      <LabeledText label={t(ActivityAuditI18nKey.Initiated)} text={activity.initiatedEmail} />
    </div>
  );
};

export default ActivityAuditViewHeader;
