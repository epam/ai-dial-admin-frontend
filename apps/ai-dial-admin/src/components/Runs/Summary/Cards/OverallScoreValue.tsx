'use client';

import { FC } from 'react';

import classNames from 'classnames';

import { Tooltip } from '@epam/ai-dial-ui-kit';

import { ChevronBadge } from '@/src/components/Common/ChevronBadge/ChevronBadge';
import OverallScoreInfo from '@/src/components/Runs/Summary/Cards/OverallScoreInfo';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { OverallScoreConfig } from '@/src/models/evaluation/test-suite';
import { NO_DATA_VALUE } from './constants';
import { formatOverallScore, formatThreshold } from './utils';

interface Props {
  score: number | null;
  /** The run's snapshotted threshold; no glyph and no value tooltip without one. */
  threshold?: number | null;
  /** Renders only the info control, at the end of the score row (compare); otherwise the card places the labelled method itself. */
  isInfoInline?: boolean;
  /** The method the info tooltip describes; the control is omitted when the run records none. */
  scoreMethod?: OverallScoreConfig | null;
  metricCount?: number;
}

const OverallScoreValue: FC<Props> = ({ score, threshold, isInfoInline, scoreMethod, metricCount = 0 }) => {
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
    <div className={classNames('flex items-center gap-2', { 'w-full': isInfoInline })}>
      {threshold != null && <ChevronBadge isPositive={isAbove} />}
      <Tooltip tooltip={thresholdMessage} hideTooltip={!thresholdMessage} asChild>
        <button type="button" className="cursor-default dial-display2-text text-primary">
          {formatOverallScore(score)}
          {thresholdMessage && <span className="sr-only">{thresholdMessage}</span>}
        </button>
      </Tooltip>
      {isInfoInline && scoreMethod && (
        <span className="ml-auto">
          <OverallScoreInfo scoreMethod={scoreMethod} metricCount={metricCount} />
        </span>
      )}
    </div>
  );
};

export default OverallScoreValue;
