import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';
import OverallScoreInfo from '../OverallScoreInfo';

const hoverInfo = async (suite: TestSuite, metricCount = 2) => {
  const user = userEvent.setup();
  render(<OverallScoreInfo testSuite={suite} metricCount={metricCount} />);
  await user.hover(screen.getByRole('button', { name: TestSuitesI18nKey.OverallScoreCalculationMethod }));
  return (await screen.findByRole('tooltip')).textContent ?? '';
};

describe('OverallScoreInfo', () => {
  test('describes the mean method', async () => {
    const text = await hoverInfo({ overallScore: { type: OverallScoreType.Mean } }, 4);

    expect(text).toContain(TestSuitesI18nKey.TrendsMeanOfNMetrics);
    expect(text).toContain(TestSuitesI18nKey.OverallScoreMeanFormula);
  });

  test('lists every metric and weight for the weighted mean', async () => {
    const text = await hoverInfo({
      overallScore: {
        type: OverallScoreType.WeightedMean,
        weights: [
          { metricName: 'aidial_rag_eval.retrieval', outputField: 'f1', weight: 0.7 },
          { metricName: 'deepeval.context_prec', outputField: 'score', weight: 0.3 },
        ],
      },
    });

    expect(text).toContain(TestSuitesI18nKey.TrendsWeightedMeanOfNMetrics);
    expect(text).toContain('aidial_rag_eval.retrieval.f1 × 0.7');
    expect(text).toContain('deepeval.context_prec.score × 0.3');
  });

  test('describes the dataset and P columns for a specific function', async () => {
    const text = await hoverInfo({
      overallScore: {
        type: OverallScoreType.Function,
        expression: { mode: 'aggregate', entity: 'eval_summaries', select: [] } as never,
      },
    });

    expect(text).toContain(TestSuitesI18nKey.OverallScoreFunctionLabel);
    expect(text).toContain(TestSuitesI18nKey.OverallScoreDatasetColumn);
    expect(text).toContain(TestSuitesI18nKey.OverallScoreParameterP);
  });
});
