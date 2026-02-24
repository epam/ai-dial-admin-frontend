import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import TemplateVariables from '../TemplateVariables';
import { TestSuite, TemplateVariable } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

const mockgetTestSuiteTemplateVariables = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuiteTemplateVariables: (...args: unknown[]) => mockgetTestSuiteTemplateVariables(...args),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ getIsEmptyData, emptyDataProps, onGridReady }: any) => {
    const isEmpty = getIsEmptyData();
    return <section aria-label="grid">{isEmpty && <p role="status">{emptyDataProps?.title}</p>}</section>;
  },
}));

vi.mock('@/src/components/TestSuites/utils/columns', () => ({
  getDynamicConfigurationsColumns: vi.fn(() => []),
}));

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite 1',
  inputBindings: [],
  testCaseSchema: [],
  ...overrides,
});

const createVariable = (overrides?: Partial<TemplateVariable>): TemplateVariable => ({
  name: 'var1',
  inferredType: TestCaseItemType.STRING,
  defaultValue: null,
  hasDefault: false,
  sources: ['body'],
  ...overrides,
});

describe('TemplateVariables', () => {
  let mockOnChange: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange = vi.fn();
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);
  });

  test('renders the heading with DynamicConfiguration key', () => {
    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(TestSuitesI18nKey.DynamicConfiguration);
  });

  test('renders GridView component', () => {
    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    expect(screen.getByRole('region', { name: 'grid' })).toBeInTheDocument();
  });

  test('fetches template variables on mount using test suite id', () => {
    render(<TemplateVariables selectedTestSuite={createTestSuite({ id: 'my-suite-id' })} onChange={mockOnChange} />);

    expect(mockgetTestSuiteTemplateVariables).toHaveBeenCalledWith('my-suite-id');
    expect(mockgetTestSuiteTemplateVariables).toHaveBeenCalledTimes(1);
  });

  test('shows empty data message when no variables exist', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(BasicI18nKey.NoVariables);
    });
  });

  test('does not show empty data when variables exist', async () => {
    const variables = [createVariable()];
    mockgetTestSuiteTemplateVariables.mockResolvedValue(variables);

    render(
      <TemplateVariables
        selectedTestSuite={createTestSuite({
          inputBindings: [{ templateVariable: 'var1', constantValue: 'val' }],
        })}
        onChange={mockOnChange}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  test('handles null response from getTestSuiteTemplateVariables', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue(null);

    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  test('uses empty array as fallback for inputBindings', async () => {
    mockgetTestSuiteTemplateVariables.mockResolvedValue([createVariable()]);

    render(
      <TemplateVariables selectedTestSuite={createTestSuite({ inputBindings: undefined })} onChange={mockOnChange} />,
    );

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'grid' })).toBeInTheDocument();
    });
  });

  test('calls getTestSuiteTemplateVariables only once on mount', () => {
    const { rerender } = render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    rerender(
      <TemplateVariables selectedTestSuite={createTestSuite({ name: 'Updated Name' })} onChange={mockOnChange} />,
    );

    expect(mockgetTestSuiteTemplateVariables).toHaveBeenCalledTimes(1);
  });

  test('renders with correct container classes', () => {
    const { container } = render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex-1', 'min-h-0', 'flex', 'flex-col', 'gap-y-4');
  });
});
