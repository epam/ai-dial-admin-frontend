import { render, screen } from '@testing-library/react';
import { ColDef } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import SchemaManager from '../SchemaManager';

const gridOptions = vi.hoisted(() => ({ columnDefs: [] as ColDef[] }));

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
    default: ({ getIsEmptyData, emptyDataProps, onGridReady }: any) => {
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

  test('renders schema manager with title and description', () => {
    render(<SchemaManager {...defaultProps} />);
    expect(screen.getByText(TestSuitesI18nKey.SchemaDescription)).toBeInTheDocument();
  });

  test('renders Add field button', () => {
    render(<SchemaManager {...defaultProps} />);

    expect(screen.getByText(BasicI18nKey.AddField)).toBeInTheDocument();
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
