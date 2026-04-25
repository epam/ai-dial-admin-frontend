import { describe, expect, test, vi } from 'vitest';
import { getTestCaseColumns, getSchemaFieldGridColumns } from '../columns';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { TEST_CASES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { TestCaseItemType } from '@/src/types/evaluation';

const makeSchema = (name: string, type: TestCaseItemType = TestCaseItemType.STRING): TestCaseSchema => ({
  name,
  type,
  required: false,
  description: '',
});

const makeSuite = (testCaseSchema: TestCaseSchema[] = []): TestSuite => ({
  testCaseSchema,
});

describe('getTestCaseColumns', () => {
  const onCellChange = vi.fn();

  // Column layout: [enabled, ...TEST_CASES_COLUMN(id, testCaseName), ...schema, validityStatus]
  const BASE_COLUMN_COUNT = 4; // enabled + id + testCaseName + validityStatus

  test('should return only base columns when schema is empty', () => {
    const result = getTestCaseColumns(makeSuite([]), onCellChange);

    expect(result.length).toBe(BASE_COLUMN_COUNT);
  });

  test('should return only base columns when testCaseSchema is undefined', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange);

    expect(result.length).toBe(BASE_COLUMN_COUNT);
  });

  test('should add columns for each schema field', () => {
    const suite = makeSuite([
      makeSchema('temperature'),
      makeSchema('model'),
      makeSchema('maxTokens', TestCaseItemType.NUMBER),
    ]);

    const result = getTestCaseColumns(suite, onCellChange);

    expect(result.length).toBe(BASE_COLUMN_COUNT + 3);
    expect(result[1]).toEqual(expect.objectContaining({ field: 'id', colId: 'id', headerName: 'ID' }));
    expect(result[2]).toEqual(
      expect.objectContaining({ field: 'testCaseName', colId: 'testCaseName', headerName: 'Test case name' }),
    );
    expect(result[3]).toEqual(expect.objectContaining({ field: 'temperature', headerName: 'temperature' }));
    expect(result[4]).toEqual(expect.objectContaining({ field: 'model', headerName: 'model' }));
    expect(result[5]).toEqual(expect.objectContaining({ field: 'maxTokens', headerName: 'maxTokens' }));
  });

  test('should handle single schema field', () => {
    const suite = makeSuite([makeSchema('prompt')]);

    const result = getTestCaseColumns(suite, onCellChange);

    expect(result[3]).toEqual(expect.objectContaining({ field: 'prompt', headerName: 'prompt' }));
  });

  test('should handle schema fields with various types', () => {
    const suite = makeSuite([
      makeSchema('stringFact', TestCaseItemType.STRING),
      makeSchema('numberFact', TestCaseItemType.NUMBER),
      makeSchema('booleanFact', TestCaseItemType.BOOLEAN),
      makeSchema('arrayFact', TestCaseItemType.ARRAY),
      makeSchema('objectFact', TestCaseItemType.OBJECT),
    ]);

    const result = getTestCaseColumns(suite, onCellChange);

    expect(result[3].field).toBe('stringFact');
    expect(result[4].field).toBe('numberFact');
    expect(result[5].field).toBe('booleanFact');
    expect(result[6].field).toBe('arrayFact');
    expect(result[7].field).toBe('objectFact');
  });

  test('should handle schema fields with special characters in names', () => {
    const suite = makeSuite([
      makeSchema('fact-with-dash'),
      makeSchema('fact_with_underscore'),
      makeSchema('fact.with.dot'),
    ]);

    const result = getTestCaseColumns(suite, onCellChange);

    expect(result[3]).toEqual(expect.objectContaining({ field: 'fact-with-dash', headerName: 'fact-with-dash' }));
    expect(result[4]).toEqual(
      expect.objectContaining({ field: 'fact_with_underscore', headerName: 'fact_with_underscore' }),
    );
    expect(result[5]).toEqual(expect.objectContaining({ field: 'fact.with.dot', headerName: 'fact.with.dot' }));
  });

  test('should preserve the order of schema fields', () => {
    const suite = makeSuite([makeSchema('zFact'), makeSchema('aFact'), makeSchema('mFact')]);

    const result = getTestCaseColumns(suite, onCellChange);

    expect(result[3].field).toBe('zFact');
    expect(result[4].field).toBe('aFact');
    expect(result[5].field).toBe('mFact');
  });

  test('should correctly spread TEST_CASES_COLUMN at the beginning', () => {
    const suite = makeSuite([makeSchema('customFact')]);

    const result = getTestCaseColumns(suite, onCellChange);

    // First columns should be from TEST_CASES_COLUMN
    expect(result[1]).toEqual({ ...TEST_CASES_COLUMN[0], cellClass: 'select-none cursor-pointer' });
    expect(result[2]).toEqual(expect.objectContaining(TEST_CASES_COLUMN[1]));
    // Then schema columns
    expect(result[3]).toEqual(expect.objectContaining({ field: 'customFact', headerName: 'customFact' }));
  });

  test('should use fallback row field value when nested data field is missing', () => {
    const suite = makeSuite([makeSchema('prompt')]);

    const result = getTestCaseColumns(suite, onCellChange);
    const promptColumn = result.find((column) => column.field === 'prompt');

    expect(promptColumn).toBeDefined();
    expect(promptColumn?.valueGetter?.({ data: { prompt: 'fallback value', data: undefined } } as never)).toBe(
      'fallback value',
    );
  });
});

describe('getSchemaFieldGridColumns', () => {
  const onChangeEditable = vi.fn();
  const onChangeSelect = vi.fn();
  const onChangeRequired = vi.fn();
  const t = (key: string) => key;

  test('should return four columns: Name, Type, Required, Description', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, t);

    expect(columns).toHaveLength(4);
    expect(columns[0]).toEqual(expect.objectContaining({ colId: 'name', field: 'name', headerName: 'Name' }));
    expect(columns[1]).toEqual(expect.objectContaining({ colId: 'type', field: 'type', headerName: 'Type' }));
    expect(columns[2]).toEqual(
      expect.objectContaining({ colId: 'required', field: 'required', headerName: 'Required' }),
    );
    expect(columns[3]).toEqual(
      expect.objectContaining({ colId: 'description', field: 'description', headerName: 'Description' }),
    );
  });

  test('should have Name and Description columns with EditableCellRenderer', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, t);

    expect(columns[0].cellRenderer).toBeDefined();
    expect(columns[0].cellRendererParams).toEqual(
      expect.objectContaining({ onChange: onChangeEditable, hideTriangle: true, skipRequired: true }),
    );
    expect(columns[3].cellRenderer).toBeDefined();
    expect(columns[3].cellRendererParams).toEqual(
      expect.objectContaining({ onChange: onChangeEditable, hideTriangle: true, skipRequired: true }),
    );
  });

  test('should have Type column with SelectCellRenderer', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, t);
    const typeColumn = columns[1];

    expect(typeColumn.cellRenderer).toBeDefined();
    expect(typeColumn.cellRendererParams).toEqual(
      expect.objectContaining({ onChange: onChangeSelect, items: expect.any(Array) }),
    );
  });

  test('should have Required column with BooleanButtonCellRenderer', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, t);
    const requiredColumn = columns[2];

    expect(requiredColumn.cellRenderer).toBeDefined();
    expect(requiredColumn.cellRendererParams).toEqual(expect.objectContaining({ onChange: onChangeRequired }));
    expect(requiredColumn.maxWidth).toBe(100);
  });

  test('should have all columns as non-sortable and non-filterable', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, t);

    columns.forEach((col) => {
      expect(col.sortable).toBe(false);
      expect(col.filter).toBe(false);
      expect(col.floatingFilter).toBe(false);
    });
  });
});
