import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { InputBindingRowData, TemplateVariable } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import Variables from '../components/Variables';

const mockGenerateVariablesRowData = vi.fn(() => [] as InputBindingRowData[]);
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
      <Variables testSuiteId="id" variables={[]} requestBody={{}} onChangeRequestBody={mockOnChangeRequestBody} />,
    );

    expect(screen.getByText(TestSuitesI18nKey.DynamicConfiguration)).toBeInTheDocument();
  });

  test('shows empty message when no variables', () => {
    mockGenerateVariablesRowData.mockReturnValue([]);

    render(
      <Variables testSuiteId="id" variables={[]} requestBody={{}} onChangeRequestBody={mockOnChangeRequestBody} />,
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
        requestBody={{ alpha: 'a', beta: 'b' }}
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
        requestBody={{}}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(screen.queryByText(TestSuitesI18nKey.Constant)).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.Attribute)).not.toBeInTheDocument();
  });

  test('calls generateVariablesRowData with variables and requestBody', () => {
    const variables = [createVariable({ name: 'alpha' })];
    const requestBody = { alpha: 'value1' };

    render(
      <Variables
        testSuiteId="id"
        variables={variables}
        requestBody={requestBody}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(mockGenerateVariablesRowData).toHaveBeenCalledWith(variables, requestBody);
  });

  test('onChangeValue calls onChangeRequestBody with updated body', async () => {
    const user = userEvent.setup();
    mockGenerateVariablesRowData.mockReturnValue([
      { templateVariable: 'myVar', effectiveType: TestCaseItemType.STRING, value: 'old' },
    ]);

    render(
      <Variables
        testSuiteId="id"
        variables={[createVariable({ name: 'myVar' })]}
        requestBody={{ myVar: 'old' }}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    const input = screen.getByDisplayValue('old');
    await user.clear(input);
    await user.type(input, 'new');

    expect(mockOnChangeRequestBody).toHaveBeenLastCalledWith(expect.objectContaining({ myVar: expect.any(String) }));
  });

  test('uses empty array fallback for undefined variables', () => {
    render(
      <Variables
        testSuiteId="id"
        variables={undefined as any}
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
        requestBody={undefined as any}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(mockGenerateVariablesRowData).toHaveBeenCalledWith([], {});
  });

  test('recalculates rows when requestBody changes', () => {
    const variables = [createVariable({ name: 'x' })];
    const { rerender } = render(
      <Variables
        testSuiteId="id"
        variables={variables}
        requestBody={{ x: 'a' }}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    mockGenerateVariablesRowData.mockClear();
    rerender(
      <Variables
        testSuiteId="id"
        variables={variables}
        requestBody={{ x: 'b' }}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(mockGenerateVariablesRowData).toHaveBeenCalledWith(variables, { x: 'b' });
  });
});
