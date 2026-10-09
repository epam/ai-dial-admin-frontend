import { CollapsibleTestCase } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';

/** Lower-cased names held by more than one field; the backend rejects names that differ only in case. */
export const getDuplicateFieldNames = (schema?: TestCaseSchema[] | null): Set<string> => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  (schema ?? []).forEach(({ name }) => {
    const key = name?.trim().toLowerCase();
    if (!key) return;
    if (seen.has(key)) {
      duplicates.add(key);
    } else {
      seen.add(key);
    }
  });

  return duplicates;
};

/** Old name → new name for every field whose `id` is in both schemas under a different name. */
export const getRenamedFields = (
  savedSchema?: TestCaseSchema[] | null,
  editedSchema?: TestCaseSchema[] | null,
): Map<string, string> => {
  const savedNames = new Map<string, string>();
  (savedSchema ?? []).forEach(({ id, name }) => {
    if (id) savedNames.set(id, name);
  });

  const renames = new Map<string, string>();
  (editedSchema ?? []).forEach(({ id, name }) => {
    const savedName = id ? savedNames.get(id) : void 0;
    if (savedName != null && savedName !== name) {
      renames.set(savedName, name);
    }
  });

  return renames;
};

const renameKeys = (
  values: Record<string, unknown> | undefined,
  renames: Map<string, string>,
): Record<string, unknown> | undefined => {
  if (!values) return values;

  // Every old key goes before any new one is written, so swaps (a↔b) and chains (a→b, b→c) read the
  // original values rather than ones already moved.
  const result = { ...values };
  renames.forEach((_, oldName) => delete result[oldName]);
  renames.forEach((newName, oldName) => {
    if (oldName in values) {
      result[newName] = values[oldName];
    }
  });

  return result;
};

/**
 * Moves test case values to the renamed fields' new names, mirroring what the backend does on save, so an
 * unsaved rename does not show as an empty column.
 */
export const remapRenamedFields = <T extends CollapsibleTestCase>(
  testCases: T[],
  savedSchema?: TestCaseSchema[] | null,
  editedSchema?: TestCaseSchema[] | null,
): T[] => {
  const renames = getRenamedFields(savedSchema, editedSchema);
  if (renames.size === 0) return testCases;

  return testCases.map((testCase) => ({
    ...testCase,
    data: renameKeys(testCase.data, renames),
    multiTurnData: testCase.multiTurnData?.map((turn) => renameKeys(turn, renames) ?? turn),
  }));
};
