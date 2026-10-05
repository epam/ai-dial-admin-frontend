import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { InputBindingRowData, TemplateVariable } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import Variables from '../components/Variables';

const mockGenerateVariablesRowData = vi.fn((..._args: unknown[]) => [] as InputBindingRowData[]);
vi.mock('@/src/components/TestSuites/utils/template-variables', () => ({
  generateVariablesRowData: (...args: unknown[]) => mockGenerateVariablesRowData(...args),
}));

vi.mock('@/src/components/Common/FileSelectInput/FileSelectInput', () => ({
  default: ({ value }: any) => <input aria-label="file-input" defaultValue={value} />,
}));

vi.mock('@/src/components/Common/JsonEditorInput/JsonEditorInput', () => ({
  default: ({ value }: any) => <input aria-label="json-input" defaultValue={JSON.stringify(value)} />,
}));

const createVariable = (overrides?: Partial<TemplateVariable>): TemplateVariable => ({
  name: 'var1',
  effectiveType: TestCaseItemType.STRING,
  defaultValue: null,
  hasDefault: false,
  sources: ['body'],
  ...overrides,
});

describe('Variables', () => {
  let mockOnChangeRequestBody: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChangeRequestBody = vi.fn();
    mockGenerateVariablesRowData.mockReturnValue([]);
  });

  test('renders the DynamicConfiguration accordion', () => {
    render(
      <Variables
        testSuiteId="id"
        variables={[]}
        requestIndex="0"
        requestBody={{}}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.DynamicConfiguration)).toBeInTheDocument();
  });

  test('shows empty message when no variables', () => {
    mockGenerateVariablesRowData.mockReturnValue([]);

    render(
      <Variables
        testSuiteId="id"
        variables={[]}
        requestIndex="0"
        requestBody={{}}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(screen.getByText(BasicI18nKey.NoVariables)).toBeInTheDocument();
  });

  test('renders a row for each variable', () => {
    mockGenerateVariablesRowData.mockReturnValue([
      { templateVariable: 'alpha', effectiveType: TestCaseItemType.STRING, value: 'a' },
      { templateVariable: 'beta', effectiveType: TestCaseItemType.STRING, value: 'b' },
    ]);

    render(
      <Variables
        testSuiteId="id"
        variables={[createVariable({ name: 'alpha' }), createVariable({ name: 'beta' })]}
        requestIndex="0"
        requestBody={{ '0': { alpha: 'a', beta: 'b' } }}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
  });

  test('does not render type selector tabs', () => {
    mockGenerateVariablesRowData.mockReturnValue([
      { templateVariable: 'var1', effectiveType: TestCaseItemType.STRING, value: '' },
    ]);

    render(
      <Variables
        testSuiteId="id"
        variables={[createVariable()]}
        requestIndex="0"
        requestBody={{}}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(screen.queryByText(TestSuitesI18nKey.Constant)).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.Attribute)).not.toBeInTheDocument();
  });

  test('calls generateVariablesRowData with its own request slice', () => {
    const variables = [createVariable({ name: 'alpha' })];

    render(
      <Variables
        testSuiteId="id"
        variables={variables}
        requestIndex="1"
        requestBody={{ '0': { alpha: 'request-zero' }, '1': { alpha: 'request-one' } }}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(mockGenerateVariablesRowData).toHaveBeenCalledWith(variables, { alpha: 'request-one' });
  });

  test('onChangeValue writes into its own request slice and leaves the others alone', async () => {
    const user = userEvent.setup();
    mockGenerateVariablesRowData.mockReturnValue([
      { templateVariable: 'myVar', effectiveType: TestCaseItemType.STRING, value: 'old' },
    ]);

    render(
      <Variables
        testSuiteId="id"
        variables={[createVariable({ name: 'myVar' })]}
        requestIndex="1"
        requestBody={{ '0': { myVar: 'untouched' }, '1': { myVar: 'old' } }}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    const input = screen.getByDisplayValue('old');
    await user.clear(input);
    await user.type(input, 'new');

    expect(mockOnChangeRequestBody).toHaveBeenLastCalledWith({
      '0': { myVar: 'untouched' },
      '1': { myVar: expect.any(String) },
    });
  });

  test('creates its own slice when the body has no entry for the request', async () => {
    const user = userEvent.setup();
    mockGenerateVariablesRowData.mockReturnValue([
      { templateVariable: 'myVar', effectiveType: TestCaseItemType.STRING, value: '' },
    ]);

    render(
      <Variables
        testSuiteId="id"
        variables={[createVariable({ name: 'myVar' })]}
        requestIndex="2"
        requestBody={{ '0': { other: 'kept' } }}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    await user.type(screen.getByRole('textbox'), 'x');

    expect(mockOnChangeRequestBody).toHaveBeenLastCalledWith({
      '0': { other: 'kept' },
      '2': { myVar: 'x' },
    });
  });

  test('uses empty array fallback for undefined variables', () => {
    render(
      <Variables
        testSuiteId="id"
        variables={undefined as any}
        requestIndex="0"
        requestBody={{}}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(mockGenerateVariablesRowData).toHaveBeenCalledWith([], {});
  });

  test('uses empty object fallback for undefined requestBody', () => {
    render(
      <Variables
        testSuiteId="id"
        variables={[]}
        requestIndex="0"
        requestBody={undefined as any}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(mockGenerateVariablesRowData).toHaveBeenCalledWith([], {});
  });

  test('recalculates rows when its own slice changes', () => {
    const variables = [createVariable({ name: 'x' })];
    const { rerender } = render(
      <Variables
        testSuiteId="id"
        variables={variables}
        requestIndex="0"
        requestBody={{ '0': { x: 'a' } }}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    mockGenerateVariablesRowData.mockClear();
    rerender(
      <Variables
        testSuiteId="id"
        variables={variables}
        requestIndex="0"
        requestBody={{ '0': { x: 'b' } }}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(mockGenerateVariablesRowData).toHaveBeenCalledWith(variables, { x: 'b' });
  });
});
