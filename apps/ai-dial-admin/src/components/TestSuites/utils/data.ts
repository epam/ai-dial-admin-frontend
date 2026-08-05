import { TestCase } from '@/src/models/evaluation/test-suite';
import { collapseRowsToCases } from '@/src/utils/evaluation/test-case-grouping';
import { v4 as uuidv4 } from 'uuid';

export const createNewTestCaseRow = (): Record<string, unknown> => {
  return {
    id: uuidv4(),
    enabled: true,
    testCaseName: `new-test-case-${uuidv4().slice(0, 5)}`,
    data: {},
    createdAt: 0,
    updatedAt: 0,
  };
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

export const collapseRowsToTestCases = (
  rows: Record<string, unknown>[],
  perTurnFields: Set<string> = new Set(),
): TestCase[] => collapseRowsToCases(rows, perTurnFields, rowToTestCase);
