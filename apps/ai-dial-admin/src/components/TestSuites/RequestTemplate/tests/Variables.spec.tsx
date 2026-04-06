import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { BasicI18nKey } from '@/src/constants/i18n';
import { InputBindingRowData, TemplateVariable } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';
import Variables from '../components/Variables';

let capturedOnGridReady: (event: any) => void;
let capturedGetIsEmptyData: () => boolean;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ getIsEmptyData, emptyDataProps, onGridReady }: any) => {
    capturedOnGridReady = onGridReady;
    capturedGetIsEmptyData = getIsEmptyData;
    const isEmpty = getIsEmptyData();
    return <section aria-label="grid">{isEmpty && <p role="status">{emptyDataProps?.title}</p>}</section>;
  },
}));

const mockGetVariablesColumns = vi.fn(() => [{ field: 'name' }]);
vi.mock('@/src/components/TestSuites/utils/columns', () => ({
  getVariablesColumns: (...args: unknown[]) => mockGetVariablesColumns(...args),
}));

const mockGenerateVariablesRowData = vi.fn(() => [] as InputBindingRowData[]);
vi.mock('@/src/components/TestSuites/utils/template-variables', () => ({
  generateVariablesRowData: (...args: unknown[]) => mockGenerateVariablesRowData(...args),
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
    mockGetVariablesColumns.mockReturnValue([{ field: 'name' }]);
    mockGenerateVariablesRowData.mockReturnValue([]);
  });

  test('renders GridView component', () => {
    render(
      <Variables testSuiteId="id" variables={[]} requestBody={{}} onChangeRequestBody={mockOnChangeRequestBody} />,
    );

    expect(screen.getByRole('region', { name: 'grid' })).toBeInTheDocument();
  });

  test('shows empty data message when no variables provided', () => {
    mockGenerateVariablesRowData.mockReturnValue([]);

    render(
      <Variables testSuiteId="id" variables={[]} requestBody={{}} onChangeRequestBody={mockOnChangeRequestBody} />,
    );

    expect(screen.getByRole('status')).toHaveTextContent(BasicI18nKey.NoVariables);
  });

  test('does not show empty data message when variables have data', () => {
    const variables = [createVariable()];
    mockGenerateVariablesRowData.mockReturnValue([
      { templateVariable: 'var1', effectiveType: TestCaseItemType.STRING, value: '' },
    ]);

    render(
      <Variables
        testSuiteId="id"
        variables={variables}
        requestBody={{ var1: '' }}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
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

  test('calls getVariablesColumns with onChangeParam callback', () => {
    render(
      <Variables testSuiteId="id" variables={[]} requestBody={{}} onChangeRequestBody={mockOnChangeRequestBody} />,
    );

    expect(mockGetVariablesColumns).toHaveBeenCalledTimes(1);
    expect(mockGetVariablesColumns).toHaveBeenCalledWith(expect.any(Function), 'id');
  });

  test('onChangeParam calls onChangeRequestBody with updated body for STRING type', () => {
    const variables = [createVariable({ name: 'myVar' })];
    const requestBody = { myVar: 'old' };

    render(
      <Variables
        testSuiteId="id"
        variables={variables}
        requestBody={requestBody}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    const onChangeParam = mockGetVariablesColumns.mock.calls[0][0];
    onChangeParam('newValue', { templateVariable: 'myVar', effectiveType: TestCaseItemType.STRING });

    expect(mockOnChangeRequestBody).toHaveBeenCalledWith({ myVar: 'newValue' });
  });

  test('onChangeParam calls onChangeRequestBody with updated body for OBJECT type', () => {
    const variables = [createVariable({ name: 'objVar', effectiveType: TestCaseItemType.OBJECT })];
    const requestBody = { objVar: {} };

    render(
      <Variables
        testSuiteId="id"
        variables={variables}
        requestBody={requestBody}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    const onChangeParam = mockGetVariablesColumns.mock.calls[0][0];
    const newObj = { key: 'value' };
    onChangeParam(newObj, { templateVariable: 'objVar', effectiveType: TestCaseItemType.OBJECT });

    expect(mockOnChangeRequestBody).toHaveBeenCalledWith({ objVar: { key: 'value' } });
  });

  test('onGridReady updates grid options with columns and data', () => {
    const rowData = [{ templateVariable: 'var1', effectiveType: TestCaseItemType.STRING, value: '' }];
    mockGenerateVariablesRowData.mockReturnValue(rowData);

    render(
      <Variables
        testSuiteId="id"
        variables={[createVariable()]}
        requestBody={{}}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    const mockUpdateGridOptions = vi.fn();
    const mockApi = { updateGridOptions: mockUpdateGridOptions, isDestroyed: () => false };
    capturedOnGridReady({ api: mockApi } as any);

    expect(mockUpdateGridOptions).toHaveBeenCalledWith({
      columnDefs: expect.any(Array),
      rowData,
    });
  });

  test('renders with correct container classes', () => {
    const { container } = render(
      <Variables testSuiteId="id" variables={[]} requestBody={{}} onChangeRequestBody={mockOnChangeRequestBody} />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex-1', 'min-h-0', 'flex', 'flex-col');
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

  test('getIsEmptyData returns true when row data is empty', () => {
    mockGenerateVariablesRowData.mockReturnValue([]);

    render(
      <Variables testSuiteId="id" variables={[]} requestBody={{}} onChangeRequestBody={mockOnChangeRequestBody} />,
    );

    expect(capturedGetIsEmptyData()).toBe(true);
  });

  test('getIsEmptyData returns false when row data has items', () => {
    mockGenerateVariablesRowData.mockReturnValue([
      { templateVariable: 'var1', effectiveType: TestCaseItemType.STRING, value: '' },
    ]);

    render(
      <Variables
        testSuiteId="id"
        variables={[createVariable()]}
        requestBody={{ var1: '' }}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    expect(capturedGetIsEmptyData()).toBe(false);
  });

  test('recalculates row data when requestBody changes', () => {
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

  test('recalculates row data when variables change', () => {
    const { rerender } = render(
      <Variables
        testSuiteId="id"
        variables={[createVariable({ name: 'a' })]}
        requestBody={{}}
        onChangeRequestBody={mockOnChangeRequestBody}
      />,
    );

    mockGenerateVariablesRowData.mockClear();
    const newVars = [createVariable({ name: 'b' })];

    rerender(
      <Variables testSuiteId="id" variables={newVars} requestBody={{}} onChangeRequestBody={mockOnChangeRequestBody} />,
    );

    expect(mockGenerateVariablesRowData).toHaveBeenCalledWith(newVars, {});
  });
});
