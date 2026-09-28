import { describe, expect, test } from 'vitest';

import { DatasetTestCase } from '@/src/models/evaluation/dataset';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import {
  ATTRIBUTE_SAMPLE_LIMIT,
  EMPTY_SAMPLE_VALUE,
  collectAttributeSamples,
} from '@/src/utils/evaluation/attribute-samples';

const field = (name: string, type: TestCaseItemType, perTurn?: boolean): TestCaseSchema => ({
  name,
  type,
  required: false,
  description: '',
  perTurn,
});

const SCHEMA: TestCaseSchema[] = [
  field('question', TestCaseItemType.STRING),
  field('year', TestCaseItemType.INTEGER),
  field('document', TestCaseItemType.ARRAY),
  field('turnText', TestCaseItemType.STRING, true),
];

const TEST_CASES: DatasetTestCase[] = [
  {
    id: '1',
    data: { question: 'Where do penguins live?', year: 2020, document: ['https://a', 'https://b'] },
    multiTurnData: [{ turnText: 'first turn' }, { turnText: 'second turn' }],
  },
  { id: '2', data: { question: '', year: 0, document: [] } },
];

describe('collectAttributeSamples', () => {
  test('returns one line per row for every schema column, keyed by column name', () => {
    const { valuesByField } = collectAttributeSamples(TEST_CASES, SCHEMA, 2);

    expect(Object.keys(valuesByField)).toEqual(['question', 'year', 'document', 'turnText']);
    expect(valuesByField.question).toEqual(['Where do penguins live?', EMPTY_SAMPLE_VALUE]);
  });

  test('serialises object and array values and stringifies primitives', () => {
    const { valuesByField } = collectAttributeSamples(TEST_CASES, SCHEMA, 2);

    expect(valuesByField.document).toEqual(['["https://a","https://b"]', '[]']);
    expect(valuesByField.year).toEqual(['2020', '0']);
  });

  test('reads a per-turn column from the first turn and falls back when the row has no turns', () => {
    const { valuesByField } = collectAttributeSamples(TEST_CASES, SCHEMA, 2);

    expect(valuesByField.turnText).toEqual(['first turn', EMPTY_SAMPLE_VALUE]);
  });

  test('keeps at most the sample limit of rows while reporting the dataset total', () => {
    const manyRows: DatasetTestCase[] = Array.from({ length: ATTRIBUTE_SAMPLE_LIMIT + 5 }, (_, index) => ({
      id: String(index),
      data: { question: `q${index}` },
    }));

    const { valuesByField, totalCount } = collectAttributeSamples(manyRows, [SCHEMA[0]], 250);

    expect(valuesByField.question).toHaveLength(ATTRIBUTE_SAMPLE_LIMIT);
    expect(valuesByField.question.at(-1)).toBe(`q${ATTRIBUTE_SAMPLE_LIMIT - 1}`);
    expect(totalCount).toBe(250);
  });

  test('returns no columns when the schema is missing and no rows when the page is empty', () => {
    expect(collectAttributeSamples(TEST_CASES, undefined, 2)).toEqual({ valuesByField: {}, totalCount: 2 });
    expect(collectAttributeSamples([], SCHEMA, 0).valuesByField.question).toEqual([]);
  });
});
