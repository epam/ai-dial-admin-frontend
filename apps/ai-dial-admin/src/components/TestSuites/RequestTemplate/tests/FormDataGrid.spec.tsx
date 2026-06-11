import { createRef } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { FormDataPart, FormDataType } from '@/src/models/form-data';
import FormDataGrid, { FormDataGridRef } from '../components/FormDataGrid';

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

const mockGetFormDataColumns = vi.fn((onChange: any) => [{ field: 'name' }, { field: 'type' }, { field: 'value' }]);
vi.mock('@/src/constants/grid-columns/grid-columns', () => ({
  getFormDataColumns: (onChange: any) => mockGetFormDataColumns(onChange),
}));

vi.mock('@/src/constants/ag-grid', () => ({
  ONE_ACTION_COLUMN: (action: any) => ({ headerName: 'Actions', cellRenderer: 'action', ...action }),
}));

const mockGetRemoveOperation = vi.fn((_onRemove: any, _a?: unknown, _b?: unknown) => ({ field: 'remove' }));
vi.mock('@/src/constants/grid-columns/actions', () => ({
  getRemoveOperation: (onRemove: any, a?: unknown, b?: unknown) => mockGetRemoveOperation(onRemove, a, b),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialGhostButton: ({ label, onClick, iconBefore }: any) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

vi.mock('@tabler/icons-react', () => ({
  IconPlus: () => <svg data-icon="plus" />,
}));

const createPart = (overrides?: Partial<FormDataPart>): FormDataPart => ({
  name: '',
  value: '',
  type: FormDataType.Text,
  ...overrides,
});

describe('FormDataGrid', () => {
  let mockChangeContent: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChangeContent = vi.fn();
  });

  test('renders Add button', () => {
    render(<FormDataGrid content={[]} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeInTheDocument();
  });

  test('does not render Add button when hideAddButton', () => {
    render(
      <FormDataGrid content={[]} changeContent={mockChangeContent} hideAddButton selectedTestSuiteId="test-suite-id" />,
    );

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Add })).not.toBeInTheDocument();
  });

  test('renders GridView', () => {
    render(<FormDataGrid content={[]} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);
    expect(screen.getByRole('region', { name: 'grid' })).toBeInTheDocument();
  });

  test('shows empty state when content is empty', () => {
    render(<FormDataGrid content={[]} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);

    expect(capturedGetIsEmptyData()).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('No form data');
  });

  test('does not show empty state when content has items', () => {
    render(
      <FormDataGrid
        content={[createPart({ name: 'a', value: '1' })]}
        changeContent={mockChangeContent}
        selectedTestSuiteId="test-suite-id"
      />,
    );
    expect(capturedGetIsEmptyData()).toBe(false);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('calls changeContent with new part when Add is clicked', () => {
    render(<FormDataGrid content={[]} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);

    const mockApi = {
      updateGridOptions: vi.fn(),
      isDestroyed: vi.fn(() => false),
    };
    capturedOnGridReady({ api: mockApi });

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(mockChangeContent).toHaveBeenCalledTimes(1);
    expect(mockChangeContent).toHaveBeenCalledWith([{ name: '', value: '', type: FormDataType.Text }]);
  });

  test('appends new part to existing content when Add is clicked', () => {
    const existing = [createPart({ name: 'x', value: 'y' })];
    render(<FormDataGrid content={existing} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);

    const mockApi = {
      updateGridOptions: vi.fn(),
      isDestroyed: vi.fn(() => false),
    };
    capturedOnGridReady({ api: mockApi });

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(mockChangeContent).toHaveBeenCalledWith([
      { name: 'x', value: 'y', type: FormDataType.Text },
      { name: '', value: '', type: FormDataType.Text },
    ]);
  });

  test('onGridReady updates grid options with columnDefs and rowData', () => {
    const content = [createPart({ name: 'field1', value: 'val1' }), createPart({ name: 'field2', value: 'val2' })];
    render(<FormDataGrid content={content} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);

    const mockUpdateGridOptions = vi.fn();
    const mockApi = {
      updateGridOptions: mockUpdateGridOptions,
      isDestroyed: vi.fn(() => false),
    };
    capturedOnGridReady({ api: mockApi });

    expect(mockUpdateGridOptions).toHaveBeenCalledWith({
      columnDefs: expect.any(Array),
      rowData: content,
    });
  });

  test('calls getFormDataColumns with onChange callback', () => {
    render(<FormDataGrid content={[]} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);

    expect(mockGetFormDataColumns).toHaveBeenCalledTimes(1);
    expect(mockGetFormDataColumns).toHaveBeenCalledWith(expect.any(Function));
  });

  test('onChangeValue from getFormDataColumns calls changeContent with updated part', () => {
    const content = [createPart({ name: 'a', value: 'old' })];
    render(<FormDataGrid content={content} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);

    const onChangeValue = mockGetFormDataColumns.mock.calls[0][0];
    onChangeValue('new-value', content[0], 'value', 0);

    expect(mockChangeContent).toHaveBeenCalledTimes(1);
    expect(mockChangeContent).toHaveBeenCalledWith([{ name: 'a', value: 'new-value', type: FormDataType.Text }]);
  });

  test('onChangeValue does nothing when rowIndex is undefined', () => {
    const content = [createPart({ name: 'a', value: 'v' })];
    render(<FormDataGrid content={content} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);

    const onChangeValue = mockGetFormDataColumns.mock.calls[0][0];
    onChangeValue('x', content[0], 'value', undefined);

    expect(mockChangeContent).not.toHaveBeenCalled();
  });

  test('getRemoveOperation is called with onRemovePart callback', () => {
    render(<FormDataGrid content={[]} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);

    expect(mockGetRemoveOperation).toHaveBeenCalledWith(expect.any(Function), undefined, 'text-error w-4 h-4');
  });

  test('onRemovePart removes item at index and calls changeContent', () => {
    const content = [
      createPart({ name: 'a', value: '1' }),
      createPart({ name: 'b', value: '2' }),
      createPart({ name: 'c', value: '3' }),
    ];
    render(<FormDataGrid content={content} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);

    expect(mockGetRemoveOperation).toHaveBeenCalled();
    const call = mockGetRemoveOperation.mock.calls[0];
    const onRemovePart = call?.[0] as ((data?: unknown, index?: number | null) => void) | undefined;
    expect(onRemovePart).toBeDefined();
    onRemovePart!(undefined, 1);

    expect(mockChangeContent).toHaveBeenCalledWith([
      { name: 'a', value: '1', type: FormDataType.Text },
      { name: 'c', value: '3', type: FormDataType.Text },
    ]);
  });

  test('onRemovePart does nothing when index is null', () => {
    const content = [createPart({ name: 'a', value: '1' })];
    render(<FormDataGrid content={content} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />);

    expect(mockGetRemoveOperation).toHaveBeenCalled();
    const call = mockGetRemoveOperation.mock.calls[0];
    const onRemovePart = call?.[0] as ((data?: unknown, index?: number | null) => void) | undefined;
    expect(onRemovePart).toBeDefined();
    onRemovePart!(undefined, null);

    expect(mockChangeContent).not.toHaveBeenCalled();
  });

  test('treats undefined content as empty array', () => {
    render(
      <FormDataGrid content={undefined as any} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />,
    );

    expect(capturedGetIsEmptyData()).toBe(true);
  });

  test('ref.add appends a new empty part', () => {
    const ref = createRef<FormDataGridRef>();
    const content = [createPart({ name: 'a', value: '1' })];
    render(
      <FormDataGrid ref={ref} content={content} changeContent={mockChangeContent} selectedTestSuiteId="test-suite-id" />,
    );

    ref.current?.add();

    expect(mockChangeContent).toHaveBeenCalledTimes(1);
    expect(mockChangeContent).toHaveBeenCalledWith([
      { name: 'a', value: '1', type: FormDataType.Text },
      { name: '', value: '', type: FormDataType.Text },
    ]);
  });
});
