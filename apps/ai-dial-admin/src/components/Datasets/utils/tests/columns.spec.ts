import { describe, expect, test, vi } from 'vitest';
import { getDatasetTestCaseColumns } from '../columns';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { Dataset } from '@/src/models/evaluation/dataset';
import { TestCaseItemType } from '@/src/types/evaluation';
import { EXPANDER_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { GridRowType } from '@/src/models/evaluation/test-case-grouping';
import TestCaseNameCellRenderer from '@/src/components/Grid/CellRenderers/TestCaseNameCellRenderer';
import StackedTurnsCellRenderer from '@/src/components/Grid/CellRenderers/StackedTurnsCellRenderer';
import EditableCellRenderer from '@/src/components/Grid/CellRenderers/EditableCellRenderer';

const makeSchema = (name: string, type: TestCaseItemType = TestCaseItemType.STRING): TestCaseSchema => ({
  name,
  type,
  required: false,
  description: '',
});

const makeDataset = (): Dataset => ({});

describe('getDatasetTestCaseColumns', () => {
  const onCellChange = vi.fn();

  // Column layout: [expander, id, testCaseName, ...schema, validityStatus]
  const BASE_COLUMN_COUNT = 4; // expander + id + testCaseName + validityStatus

  test('should return only base columns when testCaseSchema is empty', () => {
    const result = getDatasetTestCaseColumns(makeDataset(), onCellChange, undefined);

    expect(result.length).toBe(BASE_COLUMN_COUNT);
  });

  test('should return only base columns when testCaseSchema is undefined', () => {
    const result = getDatasetTestCaseColumns(makeDataset(), onCellChange);

    expect(result.length).toBe(BASE_COLUMN_COUNT);
  });

  test('should prepend the turn expander column', () => {
    const result = getDatasetTestCaseColumns(makeDataset(), onCellChange, undefined);

    expect(result[0]).toEqual(expect.objectContaining({ colId: EXPANDER_COLUMN_CEL_ID }));
  });

  test('should render testCaseName with TestCaseNameCellRenderer for GROUP/TURN rows', () => {
    const result = getDatasetTestCaseColumns(makeDataset(), onCellChange, undefined);
    const nameColumn = result.find((column) => column.field === 'testCaseName');

    expect(nameColumn).toEqual(expect.objectContaining({ colId: 'testCaseName', headerName: 'Test case name' }));

    const groupSelector = nameColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.GROUP } } as never);
    expect(groupSelector?.component).toBe(TestCaseNameCellRenderer);

    const turnSelector = nameColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.TURN } } as never);
    expect(turnSelector?.component).toBe(TestCaseNameCellRenderer);
  });

  test('should keep the editable name renderer for SINGLE rows and rows with no rowType', () => {
    const result = getDatasetTestCaseColumns(makeDataset(), onCellChange, undefined);
    const nameColumn = result.find((column) => column.field === 'testCaseName');

    const singleSelector = nameColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.SINGLE } } as never);
    expect(singleSelector?.component).toBe(EditableCellRenderer);

    const noRowTypeSelector = nameColumn?.cellRendererSelector?.({
      data: { testCaseName: 'x', data: {} },
    } as never);
    expect(noRowTypeSelector?.component).toBe(EditableCellRenderer);
    expect(noRowTypeSelector?.component).not.toBe(TestCaseNameCellRenderer);
  });

  const getDatasetTestCaseColumnsForSchema = (schema: TestCaseSchema[]) =>
    getDatasetTestCaseColumns({ testCaseSchema: schema }, onCellChange, undefined);

  test('should add columns for each schema field', () => {
    const schema = [makeSchema('temperature'), makeSchema('model'), makeSchema('maxTokens', TestCaseItemType.NUMBER)];

    const result = getDatasetTestCaseColumnsForSchema(schema);

    expect(result.length).toBe(BASE_COLUMN_COUNT + 3);
    expect(result[3]).toEqual(expect.objectContaining({ field: 'temperature', headerName: 'temperature' }));
    expect(result[4]).toEqual(expect.objectContaining({ field: 'model', headerName: 'model' }));
    expect(result[5]).toEqual(expect.objectContaining({ field: 'maxTokens', headerName: 'maxTokens' }));
  });

  test('should preserve the datasets data-cell valueGetter fallback', () => {
    const result = getDatasetTestCaseColumnsForSchema([makeSchema('prompt')]);
    const promptColumn = result.find((column) => column.field === 'prompt');

    expect(promptColumn).toBeDefined();
    expect(promptColumn?.valueGetter?.({ data: { prompt: 'fallback value', data: undefined } } as never)).toBe(
      'fallback value',
    );
  });

  test('should render a data column with StackedTurnsCellRenderer on GROUP rows and the editable renderer on plain-text TURN rows', () => {
    const result = getDatasetTestCaseColumnsForSchema([makeSchema('prompt')]);
    const promptColumn = result.find((column) => column.field === 'prompt');

    const groupSelector = promptColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.GROUP } } as never);
    expect(groupSelector?.component).toBe(StackedTurnsCellRenderer);

    const turnSelector = promptColumn?.cellRendererSelector?.({ data: { rowType: GridRowType.TURN } } as never);
    expect(turnSelector?.component).toBe(EditableCellRenderer);
  });

  test('should not render an enabled column', () => {
    const result = getDatasetTestCaseColumnsForSchema([]);

    expect(result.find((column) => column.colId === 'enabled')).toBeUndefined();
  });
});
