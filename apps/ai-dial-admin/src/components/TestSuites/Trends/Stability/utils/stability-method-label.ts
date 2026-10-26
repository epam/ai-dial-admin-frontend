import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';

type Translate = (key: string, values?: Record<string, string | number>) => string;

export const getStabilityMethodLabel = (suite: TestSuite, metricCount: number, t: Translate): string | null => {
  if (suite.overallScore?.type !== OverallScoreType.Function) {
    return null;
  }

  const testCaseType = suite.testCaseOverallScore?.type ?? OverallScoreType.Mean;

  if (
    testCaseType === OverallScoreType.WeightedMean &&
    suite.testCaseOverallScore?.type === OverallScoreType.WeightedMean
  ) {
    const count = suite.testCaseOverallScore.weights.length || metricCount;
    return t(TestSuitesI18nKey.TrendsWeightedMeanOfNMetrics, { count });
  }

  return t(TestSuitesI18nKey.TrendsMeanOfNMetrics, { count: metricCount });
};
