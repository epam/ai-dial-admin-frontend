'use client';

import { FC } from 'react';

import { Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';

import SuiteScorePillTooltip from '@/src/components/EvalTrendsTab/SuiteScorePillTooltip';
import { SuiteRecentRunAverage } from '@/src/components/EvalTrendsTab/suite-recent-run-averages';
import { formatRunCost } from '@/src/components/Runs/Summary/utils';
import { roundScore } from '@/src/components/TestSuites/Trends/utils/format';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const MISSING = '—';

interface Props {
  suiteName: string;
  average: SuiteRecentRunAverage;
}

const formatAvgScore = (value: number): string => roundScore(value).toFixed(3);

const SuiteScorePill: FC<Props> = ({ suiteName, average }) => {
  const t = useI18n();
  if (average.avgScore == null || average.runCount <= 0) {
    return null;
  }

  const scoreDisplay = formatAvgScore(average.avgScore);
  const costDisplay = formatRunCost(average.avgCost) ?? MISSING;
  const runsLabel = t(TestSuitesI18nKey.EvalTrendsLastRuns, { count: average.runCount });
  const avgScoreLabel = t(TestSuitesI18nKey.EvalTrendsAvgOverallScore);
  const avgCostLabel = t(TestSuitesI18nKey.EvalTrendsAvgCost);

  return (
    <Tooltip
      placement={TooltipPlacement.Bottom}
      triggerClassName="ml-auto shrink-0"
      tooltip={
        <SuiteScorePillTooltip
          suiteName={suiteName}
          runsLabel={runsLabel}
          avgScoreLabel={avgScoreLabel}
          avgCostLabel={avgCostLabel}
          avgScoreDisplay={scoreDisplay}
          avgCostDisplay={costDisplay}
        />
      }
    >
      <span className="dial-tiny-semi-text text-secondary bg-control-neutral-hover-muted relative rounded-full px-2 py-0.5 whitespace-nowrap">
        {scoreDisplay}
        <span className="sr-only">
          {suiteName}. {runsLabel}. {avgScoreLabel}: {scoreDisplay}. {avgCostLabel}: {costDisplay}.
        </span>
      </span>
    </Tooltip>
  );
};

export default SuiteScorePill;
