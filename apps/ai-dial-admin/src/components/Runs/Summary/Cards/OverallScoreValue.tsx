'use client';

import { FC } from 'react';

import { Tooltip } from '@epam/ai-dial-ui-kit';

import { ChevronBadge } from '@/src/components/Common/ChevronBadge/ChevronBadge';
import OverallScoreInfo from '@/src/components/Runs/Summary/Cards/OverallScoreInfo';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { NO_DATA_VALUE } from './constants';
import { formatOverallScore, formatThreshold } from './utils';

interface Props {
  score: number | null;
  /** The run's snapshotted threshold; no glyph and no value tooltip without one. */
  threshold?: number | null;
  /** Renders the info control right after the score (compare); otherwise the card places it itself. */
  isInfoInline?: boolean;
  /** The suite the info tooltip describes; the control is omitted until it has loaded. */
  testSuite?: TestSuite | null;
  metricCount?: number;
}

const OverallScoreValue: FC<Props> = ({ score, threshold, isInfoInline, testSuite, metricCount = 0 }) => {
  const t = useI18n();

  if (score == null) {
    return <span className="dial-display2-text text-secondary">{NO_DATA_VALUE}</span>;
  }

  const isAbove = threshold != null && score >= threshold;
  const thresholdMessageKey = isAbove
    ? TestSuitesI18nKey.TrendsOverallScoreAboveThresholdTooltip
    : TestSuitesI18nKey.TrendsOverallScoreBelowThresholdTooltip;
  const thresholdMessage =
    threshold != null ? t(thresholdMessageKey, { threshold: formatThreshold(threshold) }) : undefined;

  return (
    <div className="flex items-center gap-2">
      {threshold != null && <ChevronBadge isPositive={isAbove} />}
      <Tooltip tooltip={thresholdMessage} hideTooltip={!thresholdMessage} asChild>
        <button type="button" className="cursor-default dial-display2-text text-primary">
          {formatOverallScore(score)}
          {thresholdMessage && <span className="sr-only">{thresholdMessage}</span>}
        </button>
      </Tooltip>
      {isInfoInline && testSuite && <OverallScoreInfo testSuite={testSuite} metricCount={metricCount} />}
    </div>
  );
};

export default OverallScoreValue;
