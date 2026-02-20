import { render, screen, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import TemplateVariables from '../TemplateVariables';
import { TestSuite, TemplateVariable } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

const mockGetTemplateVariables = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTemplateVariables: (...args: unknown[]) => mockGetTemplateVariables(...args),
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ getIsEmptyData, emptyDataProps, onGridReady }: any) => {
    const isEmpty = getIsEmptyData();
    return (
      <div data-testid="grid-view">
        {isEmpty && <div data-testid="empty-data">{emptyDataProps?.title}</div>}
        <button
          data-testid="trigger-grid-ready"
          onClick={() => {
            const mockApi = {
              isDestroyed: () => false,
              updateGridOptions: vi.fn(),
            };
            onGridReady({ api: mockApi });
          }}
        >
          Ready
        </button>
      </div>
    );
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
    mockGetTemplateVariables.mockResolvedValue([]);
  });

  test('renders the heading with DynamicConfiguration key', async () => {
    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    expect(screen.getByText(TestSuitesI18nKey.DynamicConfiguration)).toBeInTheDocument();
  });

  test('renders GridView component', async () => {
    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    expect(screen.getByTestId('grid-view')).toBeInTheDocument();
  });

  test('fetches template variables on mount using test suite id', async () => {
    render(<TemplateVariables selectedTestSuite={createTestSuite({ id: 'my-suite-id' })} onChange={mockOnChange} />);

    expect(mockGetTemplateVariables).toHaveBeenCalledWith('my-suite-id');
    expect(mockGetTemplateVariables).toHaveBeenCalledTimes(1);
  });

  test('shows empty data message when no variables exist', async () => {
    mockGetTemplateVariables.mockResolvedValue([]);

    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-data')).toBeInTheDocument();
      expect(screen.getByText(BasicI18nKey.NoVariables)).toBeInTheDocument();
    });
  });

  test('does not show empty data when variables exist', async () => {
    const variables = [createVariable()];
    mockGetTemplateVariables.mockResolvedValue(variables);

    render(
      <TemplateVariables
        selectedTestSuite={createTestSuite({
          inputBindings: [{ templateVariable: 'var1', constantValue: 'val' }],
        })}
        onChange={mockOnChange}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('empty-data')).not.toBeInTheDocument();
    });
  });

  test('handles null response from getTemplateVariables', async () => {
    mockGetTemplateVariables.mockResolvedValue(null);

    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-data')).toBeInTheDocument();
    });
  });

  test('uses empty array as fallback for inputBindings', async () => {
    mockGetTemplateVariables.mockResolvedValue([createVariable()]);

    render(
      <TemplateVariables selectedTestSuite={createTestSuite({ inputBindings: undefined })} onChange={mockOnChange} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('grid-view')).toBeInTheDocument();
    });
  });

  test('calls getTemplateVariables only once on mount', async () => {
    const { rerender } = render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    rerender(
      <TemplateVariables selectedTestSuite={createTestSuite({ name: 'Updated Name' })} onChange={mockOnChange} />,
    );

    expect(mockGetTemplateVariables).toHaveBeenCalledTimes(1);
  });

  test('renders with correct container classes', async () => {
    const { container } = render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex-1', 'min-h-0', 'flex', 'flex-col', 'gap-y-4');
  });
});
