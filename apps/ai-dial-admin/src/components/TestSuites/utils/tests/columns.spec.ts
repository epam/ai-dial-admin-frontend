import { ReactElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { getTestCaseColumns, getSchemaFieldGridColumns, getValidityStatusColumn } from '../columns';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { ValidityStatusRow } from '@/src/models/evaluation/test-case-grouping';
import { EXPANDER_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { BasicI18nKey } from '@/src/constants/i18n';
import { TestCaseItemType } from '@/src/types/evaluation';
import { GridRowType } from '@/src/types/grid-row-type';

const makeSchema = (name: string, type: TestCaseItemType = TestCaseItemType.STRING): TestCaseSchema => ({
  name,
  type,
  required: false,
  description: '',
});

const makeSuite = (): TestSuite => ({});

describe('getTestCaseColumns', () => {
  const onCellChange = vi.fn();

  const BASE_COLUMN_COUNT = 5;

  test('should return only base columns when schema is empty', () => {
    const result = getTestCaseColumns({ suite: makeSuite(), onCellChange, onToggleExpand: () => {}, schema: [] });

    expect(result.length).toBe(BASE_COLUMN_COUNT);
    expect(result[0]).toEqual(expect.objectContaining({ colId: EXPANDER_COLUMN_CEL_ID, sortable: false }));
    expect(result[1]).toEqual(
      expect.objectContaining({ field: 'includedInRun', colId: 'includedInRun', sortable: true }),
    );
  });

  test('should return only base columns when testCaseSchema is undefined', () => {
    const result = getTestCaseColumns({ suite: makeSuite(), onCellChange, onToggleExpand: () => {} });

    expect(result.length).toBe(BASE_COLUMN_COUNT);
  });

  test('should add columns for each schema field', () => {
    const schema = [makeSchema('temperature'), makeSchema('model'), makeSchema('maxTokens', TestCaseItemType.NUMBER)];

    const result = getTestCaseColumns({ suite: makeSuite(), onCellChange, onToggleExpand: () => {}, schema });

    expect(result.length).toBe(BASE_COLUMN_COUNT + 3);
    expect(result[2]).toEqual(expect.objectContaining({ field: 'id', colId: 'id', headerName: 'ID' }));
    expect(result[3]).toEqual(
      expect.objectContaining({ field: 'testCaseName', colId: 'testCaseName', headerName: 'Test case name' }),
    );
    expect(result[4]).toEqual(expect.objectContaining({ field: 'temperature', headerName: 'temperature' }));
    expect(result[5]).toEqual(expect.objectContaining({ field: 'model', headerName: 'model' }));
    expect(result[6]).toEqual(expect.objectContaining({ field: 'maxTokens', headerName: 'maxTokens' }));
  });

  test('should handle single schema field', () => {
    const result = getTestCaseColumns({
      suite: makeSuite(),
      onCellChange,
      onToggleExpand: () => {},
      schema: [makeSchema('prompt')],
    });

    expect(result[4]).toEqual(expect.objectContaining({ field: 'prompt', headerName: 'prompt' }));
  });

  test('should handle schema fields with various types', () => {
    const schema = [
      makeSchema('stringFact', TestCaseItemType.STRING),
      makeSchema('numberFact', TestCaseItemType.NUMBER),
      makeSchema('booleanFact', TestCaseItemType.BOOLEAN),
      makeSchema('arrayFact', TestCaseItemType.ARRAY),
      makeSchema('objectFact', TestCaseItemType.OBJECT),
    ];

    const result = getTestCaseColumns({ suite: makeSuite(), onCellChange, onToggleExpand: () => {}, schema });

    expect(result[4].field).toBe('stringFact');
    expect(result[5].field).toBe('numberFact');
    expect(result[6].field).toBe('booleanFact');
    expect(result[7].field).toBe('arrayFact');
    expect(result[8].field).toBe('objectFact');
  });

  test('should handle schema fields with special characters in names', () => {
    const schema = [makeSchema('fact-with-dash'), makeSchema('fact_with_underscore'), makeSchema('fact.with.dot')];

    const result = getTestCaseColumns({ suite: makeSuite(), onCellChange, onToggleExpand: () => {}, schema });

    expect(result[4]).toEqual(expect.objectContaining({ field: 'fact-with-dash', headerName: 'fact-with-dash' }));
    expect(result[5]).toEqual(
      expect.objectContaining({ field: 'fact_with_underscore', headerName: 'fact_with_underscore' }),
    );
    expect(result[6]).toEqual(expect.objectContaining({ field: 'fact.with.dot', headerName: 'fact.with.dot' }));
  });

  test('should preserve the order of schema fields', () => {
    const result = getTestCaseColumns({
      suite: makeSuite(),
      onCellChange,
      onToggleExpand: () => {},
      schema: [makeSchema('zFact'), makeSchema('aFact'), makeSchema('mFact')],
    });

    expect(result[4].field).toBe('zFact');
    expect(result[5].field).toBe('aFact');
    expect(result[6].field).toBe('mFact');
  });

  test('should order id and name columns after the expander and include-in-run columns', () => {
    const result = getTestCaseColumns({
      suite: makeSuite(),
      onCellChange,
      onToggleExpand: () => {},
      schema: [makeSchema('customFact')],
    });

    expect(result[2]).toEqual(expect.objectContaining({ field: 'id', colId: 'id', headerName: 'ID' }));
    expect(result[3]).toEqual(
      expect.objectContaining({ field: 'testCaseName', colId: 'testCaseName', headerName: 'Test case name' }),
    );
    expect(result[4]).toEqual(expect.objectContaining({ field: 'customFact', headerName: 'customFact' }));
  });

  test('should use fallback row field value when nested data field is missing', () => {
    const result = getTestCaseColumns({
      suite: makeSuite(),
      onCellChange,
      onToggleExpand: () => {},
      schema: [makeSchema('prompt')],
    });
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
  const onChangePerTurn = vi.fn();
  const t = (key: string) => key;

  test('should return five columns: Name, Type, Required, Scope, Description', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, onChangePerTurn, t);

    expect(columns).toHaveLength(5);
    expect(columns[0]).toEqual(expect.objectContaining({ colId: 'name', field: 'name', headerName: 'Name' }));
    expect(columns[1]).toEqual(expect.objectContaining({ colId: 'type', field: 'type', headerName: 'Type' }));
    expect(columns[2]).toEqual(
      expect.objectContaining({ colId: 'required', field: 'required', headerName: 'Required' }),
    );
    expect(columns[3]).toEqual(expect.objectContaining({ colId: 'perTurn', field: 'perTurn', headerName: 'Scope' }));
    expect(columns[4]).toEqual(
      expect.objectContaining({ colId: 'description', field: 'description', headerName: 'Description' }),
    );
  });

  test('should have Name and Description columns with EditableCellRenderer', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, onChangePerTurn, t);

    expect(columns[0].cellRenderer).toBeDefined();
    expect(columns[0].cellRendererParams).toEqual(
      expect.objectContaining({ onChange: onChangeEditable, hideTriangle: true, skipRequired: true }),
    );
    expect(columns[4].cellRenderer).toBeDefined();
    expect(columns[4].cellRendererParams).toEqual(
      expect.objectContaining({ onChange: onChangeEditable, hideTriangle: true, skipRequired: true }),
    );
  });

  test('should have Type column with SelectCellRenderer', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, onChangePerTurn, t);
    const typeColumn = columns[1];

    expect(typeColumn.cellRenderer).toBeDefined();
    expect(typeColumn.cellRendererParams).toEqual(
      expect.objectContaining({ onChange: onChangeSelect, items: expect.any(Array) }),
    );
  });

  test('should have Required column with BooleanButtonCellRenderer', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, onChangePerTurn, t);
    const requiredColumn = columns[2];

    expect(requiredColumn.cellRenderer).toBeDefined();
    expect(requiredColumn.cellRendererParams).toEqual(expect.objectContaining({ onChange: onChangeRequired }));
    expect(requiredColumn.maxWidth).toBe(100);
  });

  test('should have Scope column with BooleanButtonCellRenderer', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, onChangePerTurn, t);
    const scopeColumn = columns[3];

    expect(scopeColumn.cellRenderer).toBeDefined();
    expect(scopeColumn.cellRendererParams).toEqual(
      expect.objectContaining({
        onChange: onChangePerTurn,
        trueLabel: BasicI18nKey.PerTurn,
        falseLabel: BasicI18nKey.Shared,
      }),
    );
    expect(scopeColumn.maxWidth).toBe(110);
  });

  test('should have all columns as non-sortable and non-filterable', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, onChangePerTurn, t);

    columns.forEach((col) => {
      expect(col.sortable).toBe(false);
      expect(col.filter).toBe(false);
      expect(col.floatingFilter).toBe(false);
    });
  });
});

describe('getValidityStatusColumn', () => {
  const label = 'Test case error';
  const warning = { code: 'A', message: 'a', path: 'data.a', fieldName: 'a' };

  const renderCell = (data?: ValidityStatusRow) => {
    const renderer = getValidityStatusColumn(label).cellRenderer as (params: {
      data?: ValidityStatusRow;
    }) => ReactElement | null;

    return renderer({ data });
  };

  test('should render nothing when there is no row data', () => {
    expect(renderCell(undefined)).toBeNull();
  });

  test('should render the status of a group row', () => {
    const element = renderCell({
      id: 'case-1',
      createdAt: 0,
      rowType: GridRowType.GROUP,
      valid: false,
      validationWarnings: [warning],
    });

    expect(element?.props).toEqual(expect.objectContaining({ valid: false, message: 'a', label }));
  });

  test('should render nothing on a turn row of an expanded group', () => {
    const element = renderCell({
      id: 'case-1',
      createdAt: 0,
      rowType: GridRowType.TURN,
      isFlattened: false,
      valid: false,
      validationWarnings: [warning],
    });

    expect(element).toBeNull();
  });

  test('should render the status on a flattened turn row, which has no group row', () => {
    const element = renderCell({
      id: 'case-1',
      createdAt: 0,
      rowType: GridRowType.TURN,
      isFlattened: true,
      valid: false,
      validationWarnings: [warning],
    });

    expect(element?.props).toEqual(expect.objectContaining({ valid: false, message: 'a' }));
  });

  test('should render the status of a single row', () => {
    const element = renderCell({ id: 'case-1', createdAt: 0, rowType: GridRowType.SINGLE, valid: true });

    expect(element?.props).toEqual(expect.objectContaining({ valid: true, message: '' }));
  });

  test('should render the status of a row that has no row type', () => {
    const element = renderCell({ id: 'case-1', createdAt: 0, valid: false, validationWarnings: [warning] });

    expect(element?.props).toEqual(expect.objectContaining({ valid: false, message: 'a' }));
  });

  test('should join multiple warning messages', () => {
    const element = renderCell({
      id: 'case-1',
      createdAt: 0,
      rowType: GridRowType.GROUP,
      valid: false,
      validationWarnings: [warning, { code: 'B', message: 'b', path: 'data.b', fieldName: 'b' }],
    });

    expect(element?.props).toEqual(expect.objectContaining({ message: 'a, \nb' }));
  });
});
