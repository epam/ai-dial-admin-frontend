'use client';

import { FC } from 'react';

import { ChevronBadge } from '@/src/components/Common/ChevronBadge/ChevronBadge';
import { OverallScoreThresholdStatus } from '@/src/components/Runs/models';
import {
  getOverallScoreThresholdMessage,
  getOverallScoreThresholdStatus,
} from '@/src/components/Runs/utils/test-case-scores';
import { useI18n } from '@/src/locales/client';

interface Props {
  raw: string;
  score: number;
  threshold: number;
}

/** An overall score followed by its above/below-threshold icon; the result is also spoken for screen readers. */
const ThresholdScoreValue: FC<Props> = ({ raw, score, threshold }) => {
  const t = useI18n();
  const message = getOverallScoreThresholdMessage(t, score, threshold);
  const isAbove = getOverallScoreThresholdStatus(score, threshold) === OverallScoreThresholdStatus.Above;

  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="text-primary dial-small-text">{raw}</span>
      <ChevronBadge isPositive={isAbove} />
      {message && <span className="sr-only">{message}</span>}
    </span>
  );
};

export default ThresholdScoreValue;
