import { DatasetTestCase } from '@/src/models/evaluation/dataset';
import { TestCase } from '@/src/models/evaluation/test-suite';
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

/**
 * Extracts the top-level conversation grouping fields from a grid row, applying the backend
 * both-or-neither rule: emit both `conversationId` and `turnIndex` only when `conversationId` is a
 * non-empty string AND `turnIndex` is a finite number; otherwise emit neither. `turnIndex: 0` is a
 * valid present value. Prevents an accidental "exactly one" write payload (which the backend rejects
 * with HTTP 400).
 */
export const getConversationFields = (
  row: Record<string, unknown>,
): { conversationId: string; turnIndex: number } | Record<string, never> => {
  const conversationId = row.conversationId;
  const rawTurnIndex = row.turnIndex;
  const hasConversationId = typeof conversationId === 'string' && conversationId.trim() !== '';
  // `turnIndex` can reach here as a number (typed value) or as a numeric string — the grid's
  // inline editor writes the raw input string back onto the row, and CSV import yields strings too.
  // Normalize before validating so a valid "0" is not mistaken for "absent" and dropped.
  const turnIndexNumber =
    typeof rawTurnIndex === 'number'
      ? rawTurnIndex
      : typeof rawTurnIndex === 'string' && rawTurnIndex.trim() !== ''
        ? Number(rawTurnIndex)
        : NaN;
  const hasTurnIndex = Number.isFinite(turnIndexNumber);
  if (hasConversationId && hasTurnIndex) {
    return { conversationId: (conversationId as string).trim(), turnIndex: Math.trunc(turnIndexNumber) };
  }
  return {};
};

export const getTestCaseGridData = (testCases?: DatasetTestCase[] | null) => {
  return (
    testCases?.reduce((acc: Record<string, unknown>[], testCase: DatasetTestCase) => {
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
    ...getConversationFields(row),
  };
};
