'use client';

import { FC } from 'react';

import { Tooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import { buildOverallScoreMethodTooltip } from '@/src/components/TestSuites/Trends/Kpi/utils/overall-score-method-tooltip';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  testSuite: TestSuite;
  metricCount: number;
}

/** Info control whose tooltip describes how the suite's overall score is calculated. */
const OverallScoreInfo: FC<Props> = ({ testSuite, metricCount }) => {
  const t = useI18n();

  return (
    <Tooltip tooltip={buildOverallScoreMethodTooltip(testSuite, t, metricCount)} asChild>
      <button
        type="button"
        aria-label={t(TestSuitesI18nKey.OverallScoreCalculationMethod)}
        className="flex size-6 shrink-0 items-center justify-center rounded text-secondary hover:text-accent-primary focus-visible:text-accent-primary"
      >
        <IconInfoCircle size={16} aria-hidden />
      </button>
    </Tooltip>
  );
};

export default OverallScoreInfo;
