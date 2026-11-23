'use client';

import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant, Spinner } from '@epam/ai-dial-ui-kit';

import { formatPassRatePercent } from '@/src/components/Common/PassRateBar/utils';
import { ACTIVITY_KIND_TITLE_KEY } from '@/src/components/EvalSystemHealth/constants';
import { ActivityCardModel, ActivityKind, CoverageStatus } from '@/src/components/EvalSystemHealth/models';
import { formatActivityDelta, formatCount } from '@/src/components/EvalSystemHealth/utils/format-activity';
import EvalMonthCostDeltaBadge from '@/src/components/EvalTrendsTab/EvalMonthCostDeltaBadge';
import { MonthCostWindows } from '@/src/components/EvalTrendsTab/deployment-month-cost';
import KpiCardFrame from '@/src/components/TestSuites/Trends/Kpi/KpiCardFrame';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  card: ActivityCardModel;
  windows: MonthCostWindows;
  className?: string;
}

const EMPTY_VALUE = '—';

const ActivityCard: FC<Props> = ({ card, windows, className }) => {
  const t = useI18n();
  const { kind, status, value, delta, total, rate, evaluateeCount } = card;
  const title = t(ACTIVITY_KIND_TITLE_KEY[kind]);
  const deltaLabel = formatActivityDelta(delta);

  let caption = '';
  if (kind === ActivityKind.SuitesRun) {
    caption = t(EvalSystemHealthI18nKey.SuitesRunCaption, {
      total: formatCount(total ?? 0),
      percent: rate == null ? EMPTY_VALUE : formatPassRatePercent(rate),
    });
  } else {
    caption = t(EvalSystemHealthI18nKey.SuitesAddedCaption, { count: evaluateeCount ?? 0 });
  }

  let content;
  if (status === CoverageStatus.Error) {
    content = (
      <Notification
        variant={NotificationVariant.Error}
        type={NotificationType.SectionMessage}
        iconSize={20}
        message={t(EvalSystemHealthI18nKey.ActivityLoadFailed)}
        role="alert"
      />
    );
  } else if (status === CoverageStatus.Loading) {
    content = <Spinner size={24} />;
  } else {
    content = (
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="dial-display2-text text-primary">{formatCount(value)}</p>
          {deltaLabel != null && <EvalMonthCostDeltaBadge deltaLabel={deltaLabel} isIncreaseGood />}
        </div>
        <p className="dial-small-text text-secondary">{caption}</p>
        <span className="sr-only">
          {t(EvalSystemHealthI18nKey.ActivityPeriods, {
            current: windows.current.label,
            previous: windows.previous.label,
          })}
        </span>
      </div>
    );
  }

  return (
    <KpiCardFrame className={className} ariaLabel={title} title={title}>
      {content}
    </KpiCardFrame>
  );
};

export default ActivityCard;
