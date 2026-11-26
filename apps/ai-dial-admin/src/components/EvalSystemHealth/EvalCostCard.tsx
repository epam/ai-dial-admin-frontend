'use client';

import { FC } from 'react';

import { Notification, NotificationType, NotificationVariant, Spinner } from '@epam/ai-dial-ui-kit';

import { CoverageStatus, EvalCostCardModel } from '@/src/components/EvalSystemHealth/models';
import { MonthCostWindows, formatGroupedMonthCost } from '@/src/components/EvalTrendsTab/deployment-month-cost';
import EvalMonthCostDeltaBadge from '@/src/components/EvalTrendsTab/EvalMonthCostDeltaBadge';
import { NO_DATA_VALUE } from '@/src/components/Runs/Summary/Cards/constants';
import KpiCardFrame from '@/src/components/TestSuites/Trends/Kpi/KpiCardFrame';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  card: EvalCostCardModel;
  windows: MonthCostWindows;
  className?: string;
}

const formatCost = (value: number | null): string => (value == null ? NO_DATA_VALUE : formatGroupedMonthCost(value));

const EvalCostCard: FC<Props> = ({ card, windows, className }) => {
  const t = useI18n();
  const { status, total, evaluateesCost, judgesCost, deltaLabel } = card;
  const title = t(EvalSystemHealthI18nKey.EvalCostThisMonth);

  let content;
  if (status === CoverageStatus.Error) {
    content = (
      <Notification
        variant={NotificationVariant.Error}
        type={NotificationType.SectionMessage}
        iconSize={20}
        message={t(EvalSystemHealthI18nKey.EvalCostLoadFailed)}
        role="alert"
      />
    );
  } else if (status === CoverageStatus.Loading) {
    content = <Spinner size={24} />;
  } else {
    content = (
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="dial-display2-text text-primary">{formatCost(total)}</p>
          {deltaLabel != null && <EvalMonthCostDeltaBadge deltaLabel={deltaLabel} />}
        </div>
        {total != null && (
          <p className="dial-small-text text-secondary">
            {t(EvalSystemHealthI18nKey.EvalCostSplit, {
              evaluatees: formatCost(evaluateesCost),
              judges: formatCost(judgesCost),
            })}
          </p>
        )}
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

export default EvalCostCard;
