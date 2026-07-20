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

interface NamedTestCaseRow {
  id?: string;
  testCaseName?: string | null;
}

/**
 * Guarantee every test case in a batch has a `testCaseName` that is unique both within the batch and
 * against the rest of the dataset. The backend batch-update endpoint rejects a batch when an incoming
 * name duplicates another batch item ("duplicate within batch") or an already-persisted row not being
 * updated ("collision during batch update") — even though multi-turn turns are otherwise keyed by
 * `multiTurnId` + `turnIndex`, so turns that share a name would break the whole batch.
 *
 * `existing` is the full known row set (grid rows); names of rows NOT in the batch are treated as
 * taken. For each batch row the first free name is kept; collisions and blank names are regenerated to
 * a fresh `new-test-case-<hash>`. Turn rows display as "Turn N" in the UI, so a regenerated backing
 * name is not user-visible.
 */
export const ensureUniqueTestCaseNames = <T extends NamedTestCaseRow>(
  rows: T[],
  existing: NamedTestCaseRow[] = [],
): T[] => {
  const batchIds = new Set(rows.map((row) => String(row.id)));
  const taken = new Set<string>();
  existing.forEach((row) => {
    if (batchIds.has(String(row.id))) return;
    const name = typeof row.testCaseName === 'string' ? row.testCaseName.trim() : '';
    if (name !== '') {
      taken.add(name);
    }
  });

  return rows.map((row) => {
    const name = typeof row.testCaseName === 'string' ? row.testCaseName.trim() : '';
    if (name !== '' && !taken.has(name)) {
      taken.add(name);
      return row;
    }
    let next = `new-test-case-${uuidv4().slice(0, 5)}`;
    while (taken.has(next)) {
      next = `new-test-case-${uuidv4().slice(0, 5)}`;
    }
    taken.add(next);
    return { ...row, testCaseName: next };
  });
};

/**
 * Extracts the top-level multi-turn grouping fields from a grid row, applying the backend
 * both-or-neither rule: emit both `multiTurnId` and `turnIndex` only when `multiTurnId` is a
 * non-empty string AND `turnIndex` is a finite number; otherwise emit neither. `turnIndex: 0` is a
 * valid present value. Prevents an accidental "exactly one" write payload (which the backend rejects
 * with HTTP 400).
 */
export const getMultiTurnFields = (
  row: Record<string, unknown>,
): { multiTurnId: string; turnIndex: number } | Record<string, never> => {
  const multiTurnId = row.multiTurnId;
  const rawTurnIndex = row.turnIndex;
  const hasMultiTurnId = typeof multiTurnId === 'string' && multiTurnId.trim() !== '';
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
  if (hasMultiTurnId && hasTurnIndex) {
    return { multiTurnId: (multiTurnId as string).trim(), turnIndex: Math.trunc(turnIndexNumber) };
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
    ...getMultiTurnFields(row),
  };
};
