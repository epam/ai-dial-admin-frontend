'use client';

import { FC, useMemo } from 'react';

import { Notification, NotificationType, NotificationVariant, Spinner } from '@epam/ai-dial-ui-kit';

import { hasOverallScoreThreshold } from '@/src/components/Runs/Summary/utils';
import KpiCardFrame from '@/src/components/TestSuites/Trends/Kpi/KpiCardFrame';
import KpiDeltaBadge from '@/src/components/TestSuites/Trends/Kpi/KpiDeltaBadge';
import {
  formatPassRateDelta,
  formatPassRatePercent,
  passRateBarColor,
  segmentPassRate,
} from '@/src/components/TestSuites/Trends/Kpi/utils/pass-rate';
import { RunTestCaseSegments } from '@/src/components/TestSuites/Trends/models';
import { formatScore } from '@/src/components/TestSuites/Trends/utils/format';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  segments: RunTestCaseSegments[];
  overallScoreThreshold?: number | null;
  isLoading?: boolean;
  hasError?: boolean;
  className?: string;
}

const PassRateCard: FC<Props> = ({ segments, overallScoreThreshold, isLoading, hasError, className }) => {
  const t = useI18n();
  const hasThreshold = hasOverallScoreThreshold(overallScoreThreshold);

  const latest = segments.length > 0 ? segments[segments.length - 1] : null;
  const previous = segments.length > 1 ? segments[segments.length - 2] : null;
  const latestRate = useMemo(() => segmentPassRate(latest), [latest]);
  const previousRate = useMemo(() => segmentPassRate(previous), [previous]);
  const deltaLabel = useMemo(() => formatPassRateDelta(latestRate, previousRate), [latestRate, previousRate]);

  const title = hasThreshold
    ? t(TestSuitesI18nKey.ThresholdPassRateOfLatestRun)
    : t(TestSuitesI18nKey.CompletionRateOfLatestRun);

  return (
    <KpiCardFrame className={className} ariaLabel={title} title={title}>
      {hasError ? (
        <Notification
          variant={NotificationVariant.Error}
          type={NotificationType.SectionMessage}
          iconSize={20}
          message={t(TestSuitesI18nKey.TrendsTestCasesLoadFailed)}
          role="alert"
        />
      ) : (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            {isLoading && segments.length === 0 ? (
              <Spinner size={24} />
            ) : latestRate == null ? (
              <p className="dial-display2-text text-secondary">—</p>
            ) : (
              <>
                <p className="dial-display2-text text-primary">{formatPassRatePercent(latestRate)}</p>
                {deltaLabel != null && <KpiDeltaBadge label={deltaLabel} higherIsBetter />}
              </>
            )}
          </div>
          {latestRate != null && (
            <div className="h-1 w-full overflow-hidden rounded-sm bg-layer-1" aria-hidden>
              <div
                className="h-full rounded-sm"
                style={{
                  width: `${Math.min(100, latestRate * 100)}%`,
                  backgroundColor: passRateBarColor(latestRate),
                }}
              />
            </div>
          )}
        </div>
      )}
      {hasThreshold && overallScoreThreshold != null && !hasError && (
        <div className="flex gap-1 dial-tiny-text">
          <span className="text-secondary">{t(TestSuitesI18nKey.TrendsThresholdLabel)}</span>
          <span className="text-primary">{formatScore(overallScoreThreshold)}</span>
        </div>
      )}
    </KpiCardFrame>
  );
};

export default PassRateCard;
