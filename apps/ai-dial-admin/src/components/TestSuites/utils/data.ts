import { TestCase } from '@/src/models/evaluation/test-suite';
import { v4 as uuidv4 } from 'uuid';

export function createNewTestCaseRow(): Record<string, unknown> {
  return {
    id: uuidv4(),
    enabled: true,
    testCaseName: '',
    data: {},
    createdAt: 0,
    updatedAt: 0,
  };
}

export const getTestCaseGridData = (testCases?: TestCase[] | null) => {
  return (
    testCases?.reduce((acc: Record<string, unknown>[], testCase: TestCase) => {
      const factsData = Object.keys(testCase.data || {}).reduce((factsAcc: Record<string, string>, factKey: string) => {
        factsAcc[factKey] = testCase.data?.[factKey] as string;
        return factsAcc;
      }, {});

      acc.push({
        ...testCase,
        ...factsData,
      });
      return acc;
    }, []) || []
  );
};

export const rowToTestCase = (row: Record<string, unknown>): TestCase => {
  return {
    id: row.id as string,
    enabled: row.enabled as boolean,
    testCaseName: row.testCaseName as string | undefined,
    createdAt: row.createdAt as number,
    updatedAt: row.updatedAt as number | undefined,
    valid: row.valid as boolean | undefined,
    validationWarnings: row.validationWarnings as TestCase['validationWarnings'],
    data: row.data as Record<string, unknown>,
  };
};
