import { DotReporter } from 'vitest/node';
import type { SerializedError, TestCase, TestModule, TestRunEndReason } from 'vitest/node';

const getErrorMessage = (error: SerializedError) => error.message?.split('\n')[0]?.trim() ?? 'Unknown error';

export const getTestFailureMessage = (testName: string, error?: SerializedError) =>
  `\n❌ ${testName}${error ? ` — ${getErrorMessage(error)}` : ''}\n`;

export const getUnhandledErrorMessage = (error: SerializedError) =>
  `\n❌ Unhandled Vitest error — ${getErrorMessage(error)}\n`;

export const getRunFailureMessage = (
  reason: Exclude<TestRunEndReason, 'passed'>,
  failedModules: number,
  errors: number,
) =>
  `\n❌ Vitest run ${reason}: ${failedModules} failed test module${failedModules === 1 ? '' : 's'}, ${errors} unhandled error${errors === 1 ? '' : 's'}\n`;

export class InlineReporter extends DotReporter {
  override onTestCaseResult(testCase: TestCase) {
    const result = testCase.result();

    if (result.state === 'failed') {
      process.stdout.write(getTestFailureMessage(testCase.fullName, result.errors[0]));
    }

    super.onTestCaseResult(testCase);
  }

  override onTestRunEnd(
    testModules: ReadonlyArray<TestModule>,
    unhandledErrors: ReadonlyArray<SerializedError>,
    reason: TestRunEndReason,
  ) {
    unhandledErrors.forEach((error) => process.stdout.write(getUnhandledErrorMessage(error)));

    if (reason !== 'passed') {
      const failedModules = testModules.filter((testModule) => testModule.state() === 'failed').length;
      process.stdout.write(getRunFailureMessage(reason, failedModules, unhandledErrors.length));
    }

    super.onTestRunEnd(testModules, unhandledErrors, reason);
  }
}
