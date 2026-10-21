import { CoreValidationWarning } from '@/src/models/dial/resource';
import { ValidationWarning } from '@/src/models/evaluation/test-suite';

const joinWarnings = (parts: (string | undefined)[][]): string =>
  parts
    .map((warning) => warning.filter(Boolean).join(': '))
    .filter(Boolean)
    .join('; ');

/** Core warnings: `field: message`; a missing part is dropped. */
export const formatValidationWarnings = (warnings: CoreValidationWarning[] = []): string =>
  joinWarnings(warnings.map((warning) => [warning.field, warning.message]));

/** Eval-service test suite warnings: `code: message`; a missing part is dropped. */
export const formatTestSuiteWarnings = (warnings: ValidationWarning[] = []): string =>
  joinWarnings(warnings.map((warning) => [warning.code, warning.message]));
