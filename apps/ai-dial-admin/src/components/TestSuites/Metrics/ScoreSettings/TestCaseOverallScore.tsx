'use client';

import { Radio } from '@epam/ai-dial-ui-kit';
import { FC, useCallback } from 'react';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Metric } from '@/src/models/evaluation/metric';
import { OverallScoreType, OverallScoreWeight, TestSuite } from '@/src/models/evaluation/test-suite';
import { createDefaultWeightedMeanWeights } from './utils';
import WeightedMean from './WeightedMean';

interface Props {
  selectedTestSuite: TestSuite;
  metrics?: Metric[];
  onChange: (testSuite: TestSuite) => void;
}

const TestCaseOverallScore: FC<Props> = ({ selectedTestSuite, metrics, onChange }) => {
  const t = useI18n();

  const scoreType = selectedTestSuite.testCaseOverallScore?.type ?? OverallScoreType.Mean;

  const onSelectMean = useCallback(() => {
    onChange({ ...selectedTestSuite, testCaseOverallScore: { type: OverallScoreType.Mean } });
  }, [onChange, selectedTestSuite]);

  const onSelectWeightedMean = useCallback(() => {
    if (scoreType === OverallScoreType.WeightedMean) {
      return;
    }

    onChange({
      ...selectedTestSuite,
      testCaseOverallScore: {
        type: OverallScoreType.WeightedMean,
        weights: createDefaultWeightedMeanWeights(metrics),
      },
    });
  }, [metrics, onChange, scoreType, selectedTestSuite]);

  const onWeightsChange = useCallback(
    (weights: OverallScoreWeight[]) => {
      onChange({
        ...selectedTestSuite,
        testCaseOverallScore: { type: OverallScoreType.WeightedMean, weights },
      });
    },
    [onChange, selectedTestSuite],
  );

  return (
    <div className="flex flex-col gap-3">
      <span className="dial-tiny-semi-text text-secondary">{t(TestSuitesI18nKey.TestCaseOverallScore)}</span>

      <div className="flex flex-col gap-3">
        <Radio
          id="testCaseOverallScoreType-mean"
          name="testCaseOverallScoreType"
          value={OverallScoreType.Mean}
          isSelected={scoreType === OverallScoreType.Mean}
          labelProps={{ label: t(TestSuitesI18nKey.OverallScoreMean) }}
          caption={t(TestSuitesI18nKey.OverallScoreMeanFormula)}
          onChange={onSelectMean}
        />

        <Radio
          id="testCaseOverallScoreType-weighted-mean"
          name="testCaseOverallScoreType"
          value={OverallScoreType.WeightedMean}
          isSelected={scoreType === OverallScoreType.WeightedMean}
          labelProps={{ label: t(TestSuitesI18nKey.OverallScoreWeightedMean) }}
          caption={t(TestSuitesI18nKey.OverallScoreWeightedMeanFormula)}
          onChange={onSelectWeightedMean}
        />
      </div>

      {selectedTestSuite.testCaseOverallScore?.type === OverallScoreType.WeightedMean && (
        <WeightedMean
          weights={selectedTestSuite.testCaseOverallScore.weights}
          metrics={metrics}
          onChange={onWeightsChange}
        />
      )}
    </div>
  );
};

export default TestCaseOverallScore;
