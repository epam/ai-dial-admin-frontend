'use client';

import { FC, useMemo } from 'react';

import { Tooltip } from '@epam/ai-dial-ui-kit';

import { hasOverallScoreThreshold } from '@/src/components/Runs/Summary/utils';
import KpiCardFrame from '@/src/components/TestSuites/Trends/Kpi/KpiCardFrame';
import KpiDeltaBadge from '@/src/components/TestSuites/Trends/Kpi/KpiDeltaBadge';
import { formatScoreDelta } from '@/src/components/TestSuites/Trends/Kpi/utils/kpi-delta';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { formatScore, roundScore } from '@/src/components/TestSuites/Trends/utils/format';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ChevronBadge } from '@/src/components/Common/ChevronBadge/ChevronBadge';

const formatOverallScore = (value: number): string => roundScore(value).toFixed(3);

interface Props {
  runOrder: TrendsRunPoint[];
  selectedTestSuite: TestSuite;
  className?: string;
}

const OverallScoreOfLatestRunCard: FC<Props> = ({ runOrder, selectedTestSuite, className }) => {
  const t = useI18n();
  const threshold = selectedTestSuite.overallScoreThreshold;
  const hasThreshold = hasOverallScoreThreshold(threshold);

  const latest = runOrder.length > 0 ? runOrder[runOrder.length - 1] : null;
  const previous = runOrder.length > 1 ? runOrder[runOrder.length - 2] : null;
  const score = latest?.overallScore ?? null;
  const previousScore = previous?.overallScore ?? null;

  const isAboveThreshold = hasThreshold && score != null && threshold != null && score >= threshold;
  const isBelowThreshold = hasThreshold && score != null && threshold != null && score < threshold;

  const scoreTooltip = isAboveThreshold
    ? t(TestSuitesI18nKey.TrendsOverallScoreAboveThresholdTooltip, { threshold: formatScore(threshold) })
    : isBelowThreshold
      ? t(TestSuitesI18nKey.TrendsOverallScoreBelowThresholdTooltip, { threshold: formatScore(threshold) })
      : undefined;

  const deltaLabel = useMemo(() => formatScoreDelta(score, previousScore), [score, previousScore]);

  const title = t(TestSuitesI18nKey.OverallScoreOfLatestRun);

  return (
    <KpiCardFrame className={className} ariaLabel={title} title={title}>
      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="flex items-center gap-2">
          {score == null ? (
            <p className="dial-display2-text text-secondary">—</p>
          ) : (
            <>
              {hasThreshold && <ChevronBadge isPositive={isAboveThreshold} />}
              <Tooltip tooltip={scoreTooltip} hideTooltip={!scoreTooltip} asChild>
                <p className="dial-display2-text cursor-default text-primary">{formatOverallScore(score)}</p>
              </Tooltip>
              {deltaLabel != null && <KpiDeltaBadge label={deltaLabel} higherIsBetter />}
            </>
          )}
        </div>
        <p className="dial-tiny-text text-secondary">{t(TestSuitesI18nKey.TrendsBasedOnCompletedStatic)}</p>
      </div>
    </KpiCardFrame>
  );
};

export default OverallScoreOfLatestRunCard;
