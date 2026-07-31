import { DatasetTestCase } from '@/src/models/evaluation/dataset';
import { TestCase } from '@/src/models/evaluation/test-suite';
import { readTurnIndex, selectPerTurnFields, selectSharedFields } from '@/src/utils/evaluation/test-case-grouping';
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

const flatten = (data?: Record<string, unknown> | null): Record<string, unknown> =>
  Object.keys(data ?? {}).reduce((acc: Record<string, unknown>, key) => {
    acc[key] = data?.[key];
    return acc;
  }, {});

export const getTestCaseGridData = (testCases?: DatasetTestCase[] | null) => {
  return (
    testCases?.reduce((acc: Record<string, unknown>[], testCase: DatasetTestCase) => {
      const { multiTurnData, data, ...rest } = testCase;

      if (multiTurnData && multiTurnData.length > 0) {
        const shared = data ?? {};
        multiTurnData.forEach((turn, index) => {
          // Each turn row carries the merged view (shared `data` + that turn's per-turn map)
          // because every existing schema column's valueGetter reads
          // `params.data?.data?.[field] ?? params.data?.[field]`, so merging is what keeps
          // those getters working unchanged — and it matches how execution resolves fields per turn.
          const merged = { ...shared, ...turn };
          acc.push({ ...rest, id: testCase.id, _turnIndex: index, data: merged, ...flatten(merged) });
        });
      } else {
        acc.push({ ...rest, data: data ?? {}, ...flatten(data) });
      }

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

export const collapseRowsToTestCases = (
  rows: Record<string, unknown>[],
  perTurnFields: Set<string> = new Set(),
): TestCase[] => {
  const groups = new Map<string, Record<string, unknown>[]>();

  rows.forEach((row) => {
    const id = String(row.id);
    const group = groups.get(id);
    if (group) {
      group.push(row);
    } else {
      groups.set(id, [row]);
    }
  });

  return Array.from(groups.values()).map((groupRows) => {
    const isMultiTurn = groupRows.some((row) => readTurnIndex(row) !== null);
    const base = groupRows[0];

    const testCase: TestCase = {
      id: base.id as string,
      enabled: base.enabled as boolean,
      testCaseName: base.testCaseName as string | undefined,
      createdAt: base.createdAt as number,
      updatedAt: base.updatedAt as number | undefined,
      valid: base.valid as boolean | undefined,
      validationWarnings: base.validationWarnings as TestCase['validationWarnings'],
      data: (base.data as Record<string, unknown> | undefined) ?? {},
    };

    if (!isMultiTurn) {
      return testCase;
    }

    const sorted = [...groupRows].sort((a, b) => (readTurnIndex(a) ?? 0) - (readTurnIndex(b) ?? 0));
    // Shared fields are read off turn 0 (invariant across turns by construction); everything
    // else in each turn's merged `data` is per-turn and goes back into `multiTurnData`.
    testCase.data = selectSharedFields(sorted[0].data as Record<string, unknown> | undefined, perTurnFields);
    testCase.multiTurnData = sorted.map((row) =>
      selectPerTurnFields(row.data as Record<string, unknown> | undefined, perTurnFields),
    );

    return testCase;
  });
};
