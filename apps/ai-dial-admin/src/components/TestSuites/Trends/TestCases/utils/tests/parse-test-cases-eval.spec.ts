import { describe, expect, test } from 'vitest';

import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { parseTestCasesEvalResult } from '@/src/components/TestSuites/Trends/TestCases/utils/parse-test-cases-eval';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';

const runOrder: TrendsRunPoint[] = [
  {
    runId: 'run-1',
    runName: 'R1',
    computedAtMs: 1,
    overallScore: 0.9,
    overallScoreThreshold: 0.5,
    durationMs: 10,
    isFailed: false,
  },
  {
    runId: 'run-2',
    runName: 'R2',
    computedAtMs: 2,
    overallScore: 0.4,
    overallScoreThreshold: 0.5,
    durationMs: 20,
    isFailed: false,
  },
];

describe('parseTestCasesEvalResult', () => {
  test('derives threshold segments from one aggregate result', () => {
    const { segments } = parseTestCasesEvalResult(
      {
        rows: [
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.SUCCESS,
            passed: true,
            count: 4,
          },
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.SUCCESS,
            passed: false,
            count: 1,
          },
          {
            test_suite_run_id: 'run-1',
            execution_status: ExtractionResultStatus.ERROR,
            passed: null,
            count: 2,
          },
        ],
      },
      runOrder,
    );

    expect(segments[0]).toMatchObject({
      runId: 'run-1',
      above: 4,
      below: 1,
      errorOrNa: 2,
      total: 7,
    });
  });

  test('fills empty segments from overall score when threshold is set', () => {
    const { segments } = parseTestCasesEvalResult(null, runOrder);
    expect(segments[0]).toMatchObject({ above: 1, below: 0, errorOrNa: 0, total: 1 });
    expect(segments[1]).toMatchObject({ above: 0, below: 1, errorOrNa: 0, total: 1 });
  });
});
