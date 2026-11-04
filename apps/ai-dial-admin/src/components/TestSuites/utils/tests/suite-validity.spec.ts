import { describe, expect, test } from 'vitest';

import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';
import { mergeSuiteValidity, omitSuiteValidity } from '../suite-validity';

describe('omitSuiteValidity', () => {
  test('strips valid and validationWarnings so dirty checks ignore badge-only updates', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      description: 'Suite',
      valid: false,
      validationWarnings: [{ code: 'MISSING_DATASET', message: 'Dataset is required', path: '', fieldName: '' }],
      overallScore: { type: OverallScoreType.Mean },
    };

    expect(omitSuiteValidity(suite)).toEqual({
      id: 'suite-1',
      description: 'Suite',
      overallScore: { type: OverallScoreType.Mean },
    });
  });
});

describe('mergeSuiteValidity', () => {
  test('returns the same suite reference when validity is unchanged', () => {
    const suite: TestSuite = { id: 'suite-1', valid: true, validationWarnings: [] };
    const refreshed: TestSuite = { id: 'suite-1', valid: true, validationWarnings: [] };

    expect(mergeSuiteValidity(suite, refreshed)).toBe(suite);
  });

  test('merges valid and validationWarnings from the refreshed suite', () => {
    const suite: TestSuite = {
      id: 'suite-1',
      valid: true,
      overallScore: {
        type: OverallScoreType.WeightedMean,
        weights: [{ metricName: 'Metric One', outputField: 'score', weight: 1 }],
      },
    };
    const refreshed: TestSuite = {
      id: 'suite-1',
      valid: false,
      validationWarnings: [
        {
          code: 'MISSING_OVERALL_SCORE_METRIC',
          message: 'Metric One no longer exists in Overall score weights',
          path: '',
          fieldName: '',
        },
      ],
      overallScore: { type: OverallScoreType.Mean },
    };

    expect(mergeSuiteValidity(suite, refreshed)).toEqual({
      ...suite,
      valid: false,
      validationWarnings: refreshed.validationWarnings,
    });
  });
});
