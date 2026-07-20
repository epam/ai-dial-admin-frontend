import { describe, expect, test, vi } from 'vitest';
import { getTestCaseColumns, getSchemaFieldGridColumns } from '../columns';
import { TestCaseSchema, TestSuite } from '@/src/models/evaluation/test-suite';
import { EXPANDER_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { GridRowType } from '@/src/models/evaluation/test-case-grouping';
import { TestCaseItemType } from '@/src/types/evaluation';
import StackedTurnsCellRenderer from '@/src/components/Grid/CellRenderers/StackedTurnsCellRenderer';
import TestCaseNameCellRenderer from '@/src/components/Grid/CellRenderers/TestCaseNameCellRenderer';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';

const makeSchema = (name: string, type: TestCaseItemType = TestCaseItemType.STRING): TestCaseSchema => ({
  name,
  type,
  required: false,
  description: '',
});

const makeSuite = (): TestSuite => ({});

describe('getTestCaseColumns', () => {
  const onCellChange = vi.fn();

  // Column layout (no turn handlers): [expander, enabled, id, testCaseName, ...schema, validityStatus]
  const BASE_COLUMN_COUNT = 5;
  const FIRST_SCHEMA_INDEX = 4;

  test('should return only base columns when schema is empty', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, []);
    expect(result.length).toBe(BASE_COLUMN_COUNT);
  });

  test('should return only base columns when testCaseSchema is undefined', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange);
    expect(result.length).toBe(BASE_COLUMN_COUNT);
  });

  test('leads with the expander column and no manual multi-turn columns', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, []);
    expect(result[0]).toEqual(expect.objectContaining({ colId: EXPANDER_COLUMN_CEL_ID }));
    expect(result.some((c) => c.field === 'turnIndex')).toBe(false);
    expect(result.some((c) => c.field === 'multiTurnId')).toBe(false);
  });

  test('should add columns for each schema field after the base columns', () => {
    const schema = [makeSchema('temperature'), makeSchema('model'), makeSchema('maxTokens', TestCaseItemType.NUMBER)];
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, schema);

    expect(result.length).toBe(BASE_COLUMN_COUNT + 3);
    expect(result[1]).toEqual(expect.objectContaining({ field: 'enabled', colId: 'enabled' }));
    expect(result[2]).toEqual(expect.objectContaining({ field: 'id', colId: 'id' }));
    expect(result[3]).toEqual(expect.objectContaining({ field: 'testCaseName', colId: 'testCaseName' }));
    expect(result[4]).toEqual(expect.objectContaining({ field: 'temperature', headerName: 'temperature' }));
    expect(result[5]).toEqual(expect.objectContaining({ field: 'model', headerName: 'model' }));
    expect(result[6]).toEqual(expect.objectContaining({ field: 'maxTokens', headerName: 'maxTokens' }));
  });

  test('id column shows the id on TURN and SINGLE rows but is blank on the GROUP master row', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, []);
    const idColumn = result.find((column) => column.colId === 'id');
    expect(idColumn?.valueGetter?.({ data: { rowType: GridRowType.GROUP, id: 'g1' } } as never)).toBe('');
    expect(idColumn?.valueGetter?.({ data: { rowType: GridRowType.TURN, id: 't1' } } as never)).toBe('t1');
    expect(idColumn?.valueGetter?.({ data: { rowType: GridRowType.SINGLE, id: 's1' } } as never)).toBe('s1');
  });

  test('should preserve the order of schema fields', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, [
      makeSchema('zFact'),
      makeSchema('aFact'),
      makeSchema('mFact'),
    ]);
    expect(result[FIRST_SCHEMA_INDEX].field).toBe('zFact');
    expect(result[FIRST_SCHEMA_INDEX + 1].field).toBe('aFact');
    expect(result[FIRST_SCHEMA_INDEX + 2].field).toBe('mFact');
  });

  test('schema column falls back to the top-level row field when nested data is missing', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, [makeSchema('prompt')]);
    const promptColumn = result.find((column) => column.field === 'prompt');
    expect(promptColumn?.valueGetter?.({ data: { prompt: 'fallback value', data: undefined } } as never)).toBe(
      'fallback value',
    );
  });

  test('schema column renders stacked turns for group rows and editable cells otherwise', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, [makeSchema('prompt')]);
    const promptColumn = result.find((column) => column.field === 'prompt');
    const groupComponent = promptColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.GROUP } } as never);
    const turnComponent = promptColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.TURN } } as never);
    expect(groupComponent?.component).toBe(StackedTurnsCellRenderer);
    expect(turnComponent?.component).toBe(EditableCellRenderer);
  });

  test('name column is editable for single rows and read-only for group rows', () => {
    const result = getTestCaseColumns(makeSuite(), onCellChange, undefined, []);
    const nameColumn = result.find((column) => column.colId === 'testCaseName');
    const single = nameColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.SINGLE } } as never);
    const group = nameColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.GROUP } } as never);
    expect(single?.component).toBe(EditableCellRenderer);
    expect(group?.component).toBe(TestCaseNameCellRenderer);
  });

  test('appends a turn-actions column only when turn handlers are provided and not read-only', () => {
    const handlers = {
      onAddTurn: vi.fn(),
      onDeleteCase: vi.fn(),
      onDeleteTurn: vi.fn(),
      onMoveTurnUp: vi.fn(),
      onMoveTurnDown: vi.fn(),
    };
    const withActions = getTestCaseColumns(makeSuite(), onCellChange, undefined, [], false, undefined, handlers);
    expect(withActions.some((c) => c.colId === 'action-turns')).toBe(true);

    const readOnly = getTestCaseColumns(makeSuite(), onCellChange, undefined, [], true, undefined, handlers);
    expect(readOnly.some((c) => c.colId === 'action-turns')).toBe(false);
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
