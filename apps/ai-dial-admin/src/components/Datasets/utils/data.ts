import { DatasetTestCase } from '@/src/models/evaluation/dataset';
import { collapseRowsToCases } from '@/src/utils/evaluation/test-case-grouping';
import { v4 as uuidv4 } from 'uuid';

export const createNewDatasetTestCaseRow = (): Record<string, unknown> => {
  return {
    id: uuidv4(),
    testCaseName: `new-test-case-${uuidv4().slice(0, 5)}`,
    data: {},
    createdAt: 0,
    updatedAt: 0,
  };
};

export const rowToDatasetTestCase = (row: Record<string, unknown>): DatasetTestCase => {
  return {
    id: row.id as string,
    testCaseName: row.testCaseName as string | undefined,
    createdAt: row.createdAt as number,
    updatedAt: row.updatedAt as number | undefined,
    valid: row.valid as boolean | undefined,
    validationWarnings: row.validationWarnings as DatasetTestCase['validationWarnings'],
    data: row.data as Record<string, unknown>,
  };
};

export const collapseRowsToDatasetTestCases = (
  rows: Record<string, unknown>[],
  perTurnFields: Set<string> = new Set(),
): DatasetTestCase[] => collapseRowsToCases(rows, perTurnFields, rowToDatasetTestCase);
