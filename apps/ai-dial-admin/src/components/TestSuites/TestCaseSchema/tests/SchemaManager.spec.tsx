import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColDef, GetRowIdParams } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import SchemaManager from '../SchemaManager';

const gridOptions = vi.hoisted(() => ({
  columnDefs: [] as ColDef[],
  getRowId: undefined as ((params: GetRowIdParams<TestCaseSchema>) => string) | undefined,
  isLiveData: false,
}));

// Mock GridView since ag-grid doesn't render in jsdom; a stable fake api hands back the column defs so a
// test can drive a cell's onChange.
vi.mock('@/src/components/Grid/GridView/GridView', async () => {
  const { useEffect } = await import('react');
  const api = {
    updateGridOptions: (options: { columnDefs?: ColDef[] }) => {
      if (options.columnDefs) gridOptions.columnDefs = options.columnDefs;
    },
    isDestroyed: () => false,
  };
  return {
    default: ({ getIsEmptyData, emptyDataProps, getRowId, isLiveData, onGridReady }: any) => {
      gridOptions.getRowId = getRowId;
      gridOptions.isLiveData = isLiveData;
      useEffect(() => {
        onGridReady?.({ api });
      }, []);
      return (
        <div data-testid="grid-view">
          {getIsEmptyData?.() ? <div>{emptyDataProps?.title}</div> : <div>Grid content</div>}
        </div>
      );
    },
  };
});

describe('SchemaManager', () => {
  const mockSchema: TestCaseSchema[] = [
    { name: 'temperature', type: TestCaseItemType.NUMBER, required: true, description: 'Sampling temp' },
    { name: 'stream', type: TestCaseItemType.BOOLEAN, required: false, description: 'Enable streaming' },
  ];

  const defaultProps = {
    testCaseSchema: mockSchema,
    onChangeTestCaseSchema: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    gridOptions.columnDefs = [];
    gridOptions.getRowId = undefined;
    gridOptions.isLiveData = false;
  });

  test('renders schema manager with title and description', () => {
    render(<SchemaManager {...defaultProps} />);
    expect(screen.getByText(TestSuitesI18nKey.SchemaDescription)).toBeInTheDocument();
  });

  test('renders Add field button', () => {
    render(<SchemaManager {...defaultProps} />);

    expect(screen.getByText(BasicI18nKey.AddField)).toBeInTheDocument();
  });

  test('appends a distinct schema field for every Add field action before parent props refresh', async () => {
    const user = userEvent.setup();
    const onChangeTestCaseSchema = vi.fn();
    render(<SchemaManager testCaseSchema={[]} onChangeTestCaseSchema={onChangeTestCaseSchema} />);
    const addFieldButton = screen.getByRole('button', { name: BasicI18nKey.AddField });

    await user.click(addFieldButton);
    await user.click(addFieldButton);
    await user.click(addFieldButton);

    expect(onChangeTestCaseSchema).toHaveBeenLastCalledWith([
      expect.objectContaining({ name: '' }),
      expect.objectContaining({ name: '' }),
      expect.objectContaining({ name: '' }),
    ]);

    const schema = onChangeTestCaseSchema.mock.lastCall?.[0] as TestCaseSchema[];
    expect(schema.every((field) => field.id == null)).toBe(true);
    expect(gridOptions.isLiveData).toBe(true);
    const rowIds = schema.map((field) => gridOptions.getRowId?.({ data: field } as GetRowIdParams<TestCaseSchema>));
    expect(new Set(rowIds).size).toBe(3);
  });

  test('updates only the selected unsaved schema field', async () => {
    const user = userEvent.setup();
    const onChangeTestCaseSchema = vi.fn();
    render(<SchemaManager testCaseSchema={[]} onChangeTestCaseSchema={onChangeTestCaseSchema} />);
    const addFieldButton = screen.getByRole('button', { name: BasicI18nKey.AddField });

    await user.click(addFieldButton);
    await user.click(addFieldButton);
    const schema = onChangeTestCaseSchema.mock.lastCall?.[0] as TestCaseSchema[];
    const nameColumn = gridOptions.columnDefs.find((column) => column.colId === 'name');
    nameColumn?.cellRendererParams.onChange('first', schema[0], 'name', 1);

    expect(onChangeTestCaseSchema).toHaveBeenLastCalledWith(
      [expect.objectContaining({ name: 'first' }), expect.objectContaining({ name: '' })],
      true,
    );
  });

  test('renders grid view', () => {
    render(<SchemaManager {...defaultProps} />);

    expect(screen.getByTestId('grid-view')).toBeInTheDocument();
  });

  test('shows empty state when schema is empty', () => {
    render(<SchemaManager testCaseSchema={[]} onChangeTestCaseSchema={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.NoSchemaFields)).toBeInTheDocument();
  });

  test('shows an error notification for names that differ only in case', () => {
    render(
      <SchemaManager
        testCaseSchema={[...mockSchema, { ...mockSchema[0], name: 'Temperature' }]}
        onChangeTestCaseSchema={vi.fn()}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.DuplicateSchemaFieldName)).toBeInTheDocument();
  });

  test('shows no error notification for unique names', () => {
    render(<SchemaManager {...defaultProps} />);

    expect(screen.queryByText(TestSuitesI18nKey.DuplicateSchemaFieldName)).toBeNull();
  });

  test('keeps the field id when a saved field is renamed', () => {
    const onChangeTestCaseSchema = vi.fn();
    const schema: TestCaseSchema[] = [{ ...mockSchema[0], id: 'field-1' }];
    render(<SchemaManager testCaseSchema={schema} onChangeTestCaseSchema={onChangeTestCaseSchema} />);

    const nameColumn = gridOptions.columnDefs.find((column) => column.colId === 'name');
    nameColumn?.cellRendererParams.onChange('temp', schema[0], 'name', 0);

    expect(onChangeTestCaseSchema).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'field-1', name: 'temp' })],
      true,
    );
  });
});

describe('SchemaManager stale row objects', () => {
  const field = (): TestCaseSchema => ({
    id: 'field-1',
    name: 'question',
    type: TestCaseItemType.STRING,
    required: false,
    description: '',
  });

  // A save reloads the dataset, so the grid's cells can still hold the objects from before it.
  const renderWithReloadedSchema = () => {
    const staleRow = field();
    const onChangeTestCaseSchema = vi.fn();
    const { rerender } = render(
      <SchemaManager testCaseSchema={[staleRow]} onChangeTestCaseSchema={onChangeTestCaseSchema} />,
    );
    rerender(<SchemaManager testCaseSchema={[field()]} onChangeTestCaseSchema={onChangeTestCaseSchema} />);
    return { staleRow, onChangeTestCaseSchema };
  };

  const column = (colId: string) => gridOptions.columnDefs.find((def) => def.colId === colId);

  test('applies an inline edit made through a stale row object to the live row', () => {
    const { staleRow, onChangeTestCaseSchema } = renderWithReloadedSchema();

    column('name')?.cellRendererParams.onChange('question_text', staleRow, 'name', 0);

    expect(onChangeTestCaseSchema).toHaveBeenLastCalledWith(
      [expect.objectContaining({ id: 'field-1', name: 'question_text' })],
      true,
    );
    expect(staleRow.name).toBe('question');
  });

  test('applies a select change made through a stale row object to the live row', () => {
    const { staleRow, onChangeTestCaseSchema } = renderWithReloadedSchema();

    column('type')?.cellRendererParams.onChange(TestCaseItemType.NUMBER, staleRow, 'type', 0);

    expect(onChangeTestCaseSchema).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'field-1', type: TestCaseItemType.NUMBER }),
    ]);
  });

  test.each(['required', 'perTurn'])('applies a %s toggle made through a stale row object to the live row', (colId) => {
    const { staleRow, onChangeTestCaseSchema } = renderWithReloadedSchema();

    column(colId)?.cellRendererParams.onChange(true, staleRow);

    expect(onChangeTestCaseSchema).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'field-1', [colId]: true }),
    ]);
  });

  test('removes the live row when the remove action is triggered through a stale row object', () => {
    const { staleRow, onChangeTestCaseSchema } = renderWithReloadedSchema();

    column('action-remove')?.cellRendererParams.item.onClick(staleRow);

    expect(onChangeTestCaseSchema).toHaveBeenLastCalledWith([]);
  });

  test('ignores a stale row object that has no live counterpart', () => {
    const onChangeTestCaseSchema = vi.fn();
    render(<SchemaManager testCaseSchema={[field()]} onChangeTestCaseSchema={onChangeTestCaseSchema} />);

    column('name')?.cellRendererParams.onChange('x', { ...field(), id: 'removed' }, 'name', 0);
    column('name')?.cellRendererParams.onChange('x', { ...field(), id: undefined }, 'name', 0);

    expect(onChangeTestCaseSchema).not.toHaveBeenCalled();
  });
});

describe('SchemaManager read-only', () => {
  const schema: TestCaseSchema[] = [
    { name: 'temperature', type: TestCaseItemType.NUMBER, required: true, description: 'Sampling temp' },
  ];

  beforeEach(() => {
    gridOptions.columnDefs = [];
  });

  test('is editable by default: Add field enabled, remove column present', () => {
    render(<SchemaManager testCaseSchema={schema} onChangeTestCaseSchema={vi.fn()} />);

    expect(screen.getByRole('button', { name: BasicI18nKey.AddField })).toBeEnabled();
    expect(gridOptions.columnDefs.some((column) => column.colId === 'action-remove')).toBe(true);
    expect(gridOptions.columnDefs.find((column) => column.colId === 'name')?.cellRendererParams.isReadonly).toBe(false);
  });

  test('disables Add field and drops the remove column', () => {
    render(<SchemaManager testCaseSchema={schema} onChangeTestCaseSchema={vi.fn()} isReadOnly />);

    expect(screen.getByRole('button', { name: BasicI18nKey.AddField })).toBeDisabled();
    expect(gridOptions.columnDefs.some((column) => column.colId === 'action-remove')).toBe(false);
  });

  test('marks every field column read-only', () => {
    render(<SchemaManager testCaseSchema={schema} onChangeTestCaseSchema={vi.fn()} isReadOnly />);

    ['name', 'type', 'required', 'perTurn', 'description'].forEach((colId) => {
      expect(gridOptions.columnDefs.find((column) => column.colId === colId)?.cellRendererParams.isReadonly).toBe(true);
    });
  });
});
