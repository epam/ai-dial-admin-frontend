import { describe, expect, test } from 'vitest';
import type { SerializedError } from 'vitest/node';

import { getRunFailureMessage, getTestFailureMessage, getUnhandledErrorMessage } from '@/vitest-reporter';

const error = (message: string): SerializedError => ({ message });

describe('Vitest reporter diagnostics', () => {
  test('prints a failed test name with its first error line', () => {
    expect(getTestFailureMessage('Asset view renders', error('Expected true to be false\nAssertionError'))).toBe(
      '\n❌ Asset view renders — Expected true to be false\n',
    );
  });

  test('prints the available unhandled error message', () => {
    expect(getUnhandledErrorMessage(error('Worker terminated\nstack trace'))).toBe(
      '\n❌ Unhandled Vitest error — Worker terminated\n',
    );
  });

  test('summarizes failed runs with module and error counts', () => {
    expect(getRunFailureMessage('failed', 1, 2)).toBe(
      '\n❌ Vitest run failed: 1 failed test module, 2 unhandled errors\n',
    );
  });
});
