import { describe, expect, test, vi } from 'vitest';
import { getTestCaseColumns, getSchemaFieldGridColumns } from '../columns';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import { EXPANDER_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { GridRowType } from '@/src/models/evaluation/test-case-grouping';
import TestCaseNameCellRenderer from '@/src/components/Grid/CellRenderers/TestCaseNameCellRenderer';
import StackedTurnsCellRenderer from '@/src/components/Grid/CellRenderers/StackedTurnsCellRenderer';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';
import TurnIdCellRenderer from '@/src/components/Grid/CellRenderers/TurnIdCellRenderer';
import BlankCellRenderer from '@/src/components/Grid/CellRenderers/BlankCellRenderer';

const makeSchema = (
  name: string,
  type: TestCaseItemType = TestCaseItemType.STRING,
  perTurn = false,
): TestCaseSchema => ({
  name,
  type,
  required: false,
  description: '',
  perTurn,
});

const makeSuite = (): TestSuite => ({});

describe('getTestCaseColumns', () => {
  const onCellChange = vi.fn();

  // Column layout: [expander, enabled, id, testCaseName, ...schema, validityStatus]
  const BASE_COLUMN_COUNT = 5; // expander + enabled + id + testCaseName + validityStatus

  test('should return only base columns when schema is empty', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, []);

    expect(result.length).toBe(BASE_COLUMN_COUNT);
  });

  test('should return only base columns when testCaseSchema is undefined', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange);

    expect(result.length).toBe(BASE_COLUMN_COUNT);
  });

  test('should prepend the turn expander column', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, []);

    expect(result[0]).toEqual(expect.objectContaining({ colId: EXPANDER_COLUMN_CEL_ID }));
  });

  test('should render testCaseName with TestCaseNameCellRenderer', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, []);
    const nameColumn = result.find((column) => column.field === 'testCaseName');

    expect(nameColumn).toEqual(expect.objectContaining({ colId: 'testCaseName', headerName: 'Test case name' }));
    const selector = nameColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.GROUP } } as never);
    expect(selector?.component).toBe(TestCaseNameCellRenderer);
  });

  test('should keep the editable name renderer for a row with no rowType (unprojected/single row)', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, []);
    const nameColumn = result.find((column) => column.field === 'testCaseName');

    const selector = nameColumn?.cellRendererSelector?.({ data: { testCaseName: 'x', data: {} } } as never);

    expect(selector?.component).toBe(EditableCellRenderer);
    expect(selector?.component).not.toBe(TestCaseNameCellRenderer);
  });

  test('should add columns for each schema field', () => {
    const schema = [makeSchema('temperature'), makeSchema('model'), makeSchema('maxTokens', TestCaseItemType.NUMBER)];

    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, schema);

    expect(result.length).toBe(BASE_COLUMN_COUNT + 3);
    expect(result[2]).toEqual(expect.objectContaining({ field: 'id', colId: 'id', headerName: 'ID' }));
    expect(result[3]).toEqual(
      expect.objectContaining({ field: 'testCaseName', colId: 'testCaseName', headerName: 'Test case name' }),
    );
    expect(result[4]).toEqual(expect.objectContaining({ field: 'temperature', headerName: 'temperature' }));
    expect(result[5]).toEqual(expect.objectContaining({ field: 'model', headerName: 'model' }));
    expect(result[6]).toEqual(expect.objectContaining({ field: 'maxTokens', headerName: 'maxTokens' }));
  });

  test('should render the id column with TurnIdCellRenderer, id on GROUP/SINGLE rows and blank on TURN rows', () => {
    const idColumn = getTestCaseColumns(makeSuite(), onCellChange, undefined, []).find(
      (column) => column.colId === 'id',
    );

    expect(idColumn?.cellRenderer).toBe(TurnIdCellRenderer);
    expect(idColumn?.valueGetter?.({ data: { rowType: GridRowType.GROUP, id: 'case-1' } } as never)).toBe('case-1');
    expect(idColumn?.valueGetter?.({ data: { rowType: GridRowType.TURN, id: 'case-1' } } as never)).toBe('');
    expect(idColumn?.valueGetter?.({ data: { rowType: GridRowType.SINGLE, id: 'case-2' } } as never)).toBe('case-2');
  });

  test('should handle single schema field', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, [makeSchema('prompt')]);

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

    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, schema);

    expect(result[4].field).toBe('stringFact');
    expect(result[5].field).toBe('numberFact');
    expect(result[6].field).toBe('booleanFact');
    expect(result[7].field).toBe('arrayFact');
    expect(result[8].field).toBe('objectFact');
  });

  test('should handle schema fields with special characters in names', () => {
    const schema = [makeSchema('fact-with-dash'), makeSchema('fact_with_underscore'), makeSchema('fact.with.dot')];

    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, schema);

    expect(result[4]).toEqual(expect.objectContaining({ field: 'fact-with-dash', headerName: 'fact-with-dash' }));
    expect(result[5]).toEqual(
      expect.objectContaining({ field: 'fact_with_underscore', headerName: 'fact_with_underscore' }),
    );
    expect(result[6]).toEqual(expect.objectContaining({ field: 'fact.with.dot', headerName: 'fact.with.dot' }));
  });

  test('should preserve the order of schema fields', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, [
      makeSchema('zFact'),
      makeSchema('aFact'),
      makeSchema('mFact'),
    ]);

    expect(result[4].field).toBe('zFact');
    expect(result[5].field).toBe('aFact');
    expect(result[6].field).toBe('mFact');
  });

  test('should use fallback row field value when nested data field is missing', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, [makeSchema('prompt')]);
    const promptColumn = result.find((column) => column.field === 'prompt');

    expect(promptColumn).toBeDefined();
    expect(promptColumn?.valueGetter?.({ data: { prompt: 'fallback value', data: undefined } } as never)).toBe(
      'fallback value',
    );
  });

  test('per-turn field: stacks turns on the GROUP row and is editable on TURN rows', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, [
      makeSchema('prompt', TestCaseItemType.STRING, true),
    ]);
    const promptColumn = result.find((column) => column.field === 'prompt');

    const groupSelector = promptColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.GROUP } } as never);
    expect(groupSelector?.component).toBe(StackedTurnsCellRenderer);

    const turnSelector = promptColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.TURN } } as never);
    expect(turnSelector?.component).toBe(EditableCellRenderer);
  });

  test('shared field: editable on the GROUP master row and blank on TURN rows', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, [
      makeSchema('temperature', TestCaseItemType.STRING, false),
    ]);
    const column = result.find((c) => c.field === 'temperature');

    const groupSelector = column?.cellRendererSelector?.({ data: { rowType: GridRowType.GROUP } } as never);
    expect(groupSelector?.component).toBe(EditableCellRenderer);

    const turnSelector = column?.cellRendererSelector?.({ data: { rowType: GridRowType.TURN } } as never);
    expect(turnSelector?.component).toBe(BlankCellRenderer);
  });
});

describe('getSchemaFieldGridColumns', () => {
  const onChangeEditable = vi.fn();
  const onChangeSelect = vi.fn();
  const onChangeRequired = vi.fn();
  const t = (key: string) => key;

  test('should return five columns: Name, Type, Required, Scope, Description', () => {
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, t);

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
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, t);

    expect(columns[0].cellRenderer).toBeDefined();
    expect(columns[0].cellRendererParams).toEqual(
      expect.objectContaining({ onChange: onChangeEditable, hideTriangle: true, skipRequired: true }),
    );
    expect(columns[4].cellRenderer).toBeDefined();
    expect(columns[4].cellRendererParams).toEqual(
      expect.objectContaining({ onChange: onChangeEditable, hideTriangle: true, skipRequired: true }),
    );
  });

  test('should have a Scope column wired to onChangePerTurn', () => {
    const onChangePerTurn = vi.fn();
    const columns = getSchemaFieldGridColumns(onChangeEditable, onChangeSelect, onChangeRequired, t, onChangePerTurn);
    const scopeColumn = columns.find((c) => c.colId === 'perTurn');

    expect(scopeColumn?.cellRenderer).toBeDefined();
    expect(scopeColumn?.cellRendererParams).toEqual(expect.objectContaining({ onChange: onChangePerTurn }));
    expect(scopeColumn?.valueGetter?.({ data: { perTurn: true } } as never)).toBe(true);
    expect(scopeColumn?.valueGetter?.({ data: {} } as never)).toBe(false);
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
