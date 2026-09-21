import { DatasetTestCase } from '@/src/models/evaluation/dataset';
import { AttributeSamples } from '@/src/models/evaluation/attribute-samples';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { getPerTurnFieldNames } from '@/src/utils/evaluation/test-case-grouping';

// How many dataset rows the attribute preview shows. Also the page size the rows are fetched with,
// so the request never pulls more than the preview can display.
export const ATTRIBUTE_SAMPLE_LIMIT = 10;

// Stands in for a row that has no value for the column, so the preview keeps one line per row and
// the reader can see that the column is sparse rather than short.
export const EMPTY_SAMPLE_VALUE = '—';

const formatSampleValue = (value: unknown): string => {
  if (value == null || value === '') {
    return EMPTY_SAMPLE_VALUE;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

// A per-turn column lives in `multiTurnData` rather than `data`, and a preview only needs one value
// per row, so the first turn stands for the row.
const readFieldValue = (testCase: DatasetTestCase, field: string, isPerTurn: boolean): unknown =>
  isPerTurn ? testCase.multiTurnData?.[0]?.[field] : testCase.data?.[field];

/**
 * Turns a page of dataset test cases into one preview line per row for every schema column.
 * `totalCount` comes from the server's total rather than the page, so callers can report the rows
 * the preview leaves out.
 */
export const collectAttributeSamples = (
  testCases: DatasetTestCase[],
  schema: TestCaseSchema[] | undefined,
  totalCount: number,
): AttributeSamples => {
  const perTurnFields = getPerTurnFieldNames(schema);
  const rows = testCases.slice(0, ATTRIBUTE_SAMPLE_LIMIT);

  const valuesByField = Object.fromEntries(
    (schema ?? []).map((field) => [
      field.name,
      rows.map((testCase) => formatSampleValue(readFieldValue(testCase, field.name, perTurnFields.has(field.name)))),
    ]),
  );

  return { valuesByField, totalCount };
};
