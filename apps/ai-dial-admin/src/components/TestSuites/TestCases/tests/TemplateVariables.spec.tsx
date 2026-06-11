import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import TemplateVariables from '../TemplateVariables';
import { TestSuite, TemplateVariable } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

const mockGetTestSuiteTemplateVariables = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuiteTemplateVariables: (...args: unknown[]) => mockGetTestSuiteTemplateVariables(...args),
}));

vi.mock('@/src/components/Common/FileSelectInput/FileSelectInput', () => ({
  default: ({ value }: any) => <input aria-label="file-input" defaultValue={value} />,
}));

vi.mock('@/src/components/Common/JsonEditorInput/JsonEditorInput', () => ({
  default: ({ value }: any) => <input aria-label="json-input" defaultValue={JSON.stringify(value)} />,
}));

const createTestSuite = (overrides?: Partial<TestSuite>): TestSuite => ({
  id: 'suite-1',
  name: 'Test Suite 1',
  inputBindings: [],
  ...overrides,
});

const createVariable = (overrides?: Partial<TemplateVariable>): TemplateVariable => ({
  name: 'var1',
  effectiveType: TestCaseItemType.STRING,
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
    mockGetTestSuiteTemplateVariables.mockResolvedValue([]);
  });

  test('renders the DynamicConfiguration accordion with correct title', () => {
    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    expect(screen.getByText(TestSuitesI18nKey.DynamicConfiguration)).toBeInTheDocument();
  });

  test('fetches template variables on mount using test suite id', () => {
    render(<TemplateVariables selectedTestSuite={createTestSuite({ id: 'my-suite-id' })} onChange={mockOnChange} />);

    expect(mockGetTestSuiteTemplateVariables).toHaveBeenCalledWith('my-suite-id');
    expect(mockGetTestSuiteTemplateVariables).toHaveBeenCalledTimes(1);
  });

  test('calls getTestSuiteTemplateVariables only once on mount', () => {
    const { rerender } = render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    rerender(
      <TemplateVariables selectedTestSuite={createTestSuite({ name: 'Updated Name' })} onChange={mockOnChange} />,
    );

    expect(mockGetTestSuiteTemplateVariables).toHaveBeenCalledTimes(1);
  });

  test('shows empty message when no variables exist', async () => {
    mockGetTestSuiteTemplateVariables.mockResolvedValue([]);

    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(BasicI18nKey.NoVariables)).toBeInTheDocument();
    });
  });

  test('renders a row for each variable', async () => {
    mockGetTestSuiteTemplateVariables.mockResolvedValue([
      createVariable({ name: 'alpha' }),
      createVariable({ name: 'beta' }),
    ]);

    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText('alpha')).toBeInTheDocument();
      expect(screen.getByText('beta')).toBeInTheDocument();
    });
  });

  test('handles null response from getTestSuiteTemplateVariables', async () => {
    mockGetTestSuiteTemplateVariables.mockResolvedValue(null);

    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(BasicI18nKey.NoVariables)).toBeInTheDocument();
    });
  });

  test('renders Constant and Attribute type selector tabs', async () => {
    mockGetTestSuiteTemplateVariables.mockResolvedValue([createVariable()]);

    render(<TemplateVariables selectedTestSuite={createTestSuite()} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByText(TestSuitesI18nKey.Constant)).toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.Attribute)).toBeInTheDocument();
    });
  });

  test('calls onChange with updated inputBindings when value changes', async () => {
    const user = userEvent.setup();
    mockGetTestSuiteTemplateVariables.mockResolvedValue([createVariable({ name: 'myVar' })]);

    render(
      <TemplateVariables
        selectedTestSuite={createTestSuite({ inputBindings: [{ templateVariable: 'myVar', constantValue: 'old' }] })}
        onChange={mockOnChange}
      />,
    );

    await waitFor(() => expect(screen.getByDisplayValue('old')).toBeInTheDocument());

    const input = screen.getByDisplayValue('old');
    await user.clear(input);
    await user.type(input, 'new');

    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        inputBindings: expect.arrayContaining([
          expect.objectContaining({ templateVariable: 'myVar', constantValue: expect.any(String) }),
        ]),
      }),
      true,
    );
  });

  test('uses empty array as fallback for undefined inputBindings', async () => {
    mockGetTestSuiteTemplateVariables.mockResolvedValue([createVariable()]);

    render(
      <TemplateVariables selectedTestSuite={createTestSuite({ inputBindings: undefined })} onChange={mockOnChange} />,
    );

    await waitFor(() => {
      expect(screen.getByText('var1')).toBeInTheDocument();
    });
  });
});
