import { TestSuite } from '@/src/models/evaluation/test-suite';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';

/** Drop server validity projections so dirty checks ignore badge-only updates. */
export const omitSuiteValidity = (suite: TestSuite): TestSuite => {
  const { valid: __valid, validationWarnings: __warnings, ...rest } = suite;
  return rest;
};

/** Merge `valid` / `validationWarnings` from a refreshed suite onto the in-memory draft. */
export const mergeSuiteValidity = (suite: TestSuite, refreshed: TestSuite): TestSuite => {
  if (
    suite.valid === refreshed.valid &&
    isEqualSkippingUndefined({ warnings: suite.validationWarnings }, { warnings: refreshed.validationWarnings })
  ) {
    return suite;
  }

  return {
    ...suite,
    valid: refreshed.valid,
    validationWarnings: refreshed.validationWarnings,
  };
};
