import { RunTestCaseSegments, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import {
  fillEmptySegmentsFromOverallScore,
  parseRunTestCaseSegments,
} from '@/src/components/TestSuites/Trends/TestCases/utils/parse-test-cases-segments';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';

export interface TestCasesEvalParseResult {
  segments: RunTestCaseSegments[];
}

export const parseTestCasesEvalResult = (
  result: StructuredQueryResult | null,
  runOrder: TrendsRunPoint[],
  hasThreshold: boolean,
  overallScoreThreshold?: number | null,
): TestCasesEvalParseResult => {
  const segments = fillEmptySegmentsFromOverallScore(
    parseRunTestCaseSegments(result, runOrder, hasThreshold),
    runOrder,
    overallScoreThreshold,
  );
  return { segments };
};
