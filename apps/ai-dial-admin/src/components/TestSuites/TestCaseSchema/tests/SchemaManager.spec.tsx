import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import SchemaManager from '../SchemaManager';

// Mock GridView since ag-grid doesn't render in jsdom
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ getIsEmptyData, emptyDataProps }: any) => (
    <div data-testid="grid-view">{getIsEmptyData?.() ? <div>{emptyDataProps?.title}</div> : <div>Grid content</div>}</div>
  ),
}));

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

    expect(screen.getByText(TestSuitesI18nKey.TestCaseSchema)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.SchemaDescription)).toBeInTheDocument();
  });

  test('renders Add field button', () => {
    render(<SchemaManager {...defaultProps} />);

    expect(screen.getByText(TestSuitesI18nKey.AddField)).toBeInTheDocument();
  });

  test('renders grid view', () => {
    render(<SchemaManager {...defaultProps} />);

    expect(screen.getByTestId('grid-view')).toBeInTheDocument();
  });

  test('shows empty state when schema is empty', () => {
    render(<SchemaManager testCaseSchema={[]} onChangeTestCaseSchema={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.NoSchemaFields)).toBeInTheDocument();
  });
});
