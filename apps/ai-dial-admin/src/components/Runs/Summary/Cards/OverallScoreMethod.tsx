'use client';

import { FC } from 'react';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';

import OverallScoreInfo from '@/src/components/Runs/Summary/Cards/OverallScoreInfo';
import { getOverallScoreMethodName } from '@/src/components/TestSuites/Metrics/ScoreSettings/overall-score-method-tooltip';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { OverallScoreConfig } from '@/src/models/evaluation/test-suite';

interface Props {
  /** The method the run was evaluated with (see `resolveRunScoreMethod`). */
  scoreMethod: OverallScoreConfig;
  metricCount: number;
}

const lowerFirst = (value: string): string => value.charAt(0).toLowerCase() + value.slice(1);

/**
 * "Based on <method name>", truncated with an ellipsis when the card is too narrow, with the info control that
 * opens the method's "Calculation method" tooltip.
 */
const OverallScoreMethod: FC<Props> = ({ scoreMethod, metricCount }) => {
  const t = useI18n();
  const label = t(TestSuitesI18nKey.TrendsBasedOnMethod, {
    method: lowerFirst(getOverallScoreMethodName(scoreMethod, t, metricCount)),
  });

  return (
    <div className="flex w-full min-w-0 items-center gap-1">
      <EllipsisTooltip text={label} className="dial-tiny-text text-secondary flex-auto" />
      <OverallScoreInfo scoreMethod={scoreMethod} metricCount={metricCount} />
    </div>
  );
};

export default OverallScoreMethod;
