'use client';

import { FC } from 'react';

import { Tooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import { buildOverallScoreMethodTooltip } from '@/src/components/TestSuites/Metrics/ScoreSettings/overall-score-method-tooltip';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { OverallScoreConfig } from '@/src/models/evaluation/test-suite';

interface Props {
  /** The method the run was evaluated with (see `resolveRunScoreMethod`). */
  scoreMethod: OverallScoreConfig;
  metricCount: number;
}

/** Info control whose tooltip describes how the run's overall score was calculated. */
const OverallScoreInfo: FC<Props> = ({ scoreMethod, metricCount }) => {
  const t = useI18n();

  return (
    <Tooltip tooltip={buildOverallScoreMethodTooltip({ overallScore: scoreMethod }, t, metricCount)} asChild>
      <button
        type="button"
        aria-label={t(TestSuitesI18nKey.OverallScoreCalculationMethod)}
        className="-my-1 flex size-6 shrink-0 items-center justify-center rounded text-secondary hover:text-accent-primary focus-visible:text-accent-primary"
      >
        <IconInfoCircle size={16} aria-hidden />
      </button>
    </Tooltip>
  );
};

export default OverallScoreInfo;
