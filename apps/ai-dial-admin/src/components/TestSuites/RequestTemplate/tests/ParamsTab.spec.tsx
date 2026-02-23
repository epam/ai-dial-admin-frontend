import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import ParamsTab from '../tabs/ParamsTab';

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

const mockGetParamsColumns = vi.fn(() => [{ field: 'key' }, { field: 'value' }]);
vi.mock('@/src/constants/grid-columns/grid-columns', () => ({
  getParamsColumns: (...args: unknown[]) => mockGetParamsColumns(...args),
}));

vi.mock('@/src/constants/ag-grid', () => ({
  ONE_ACTION_COLUMN: (action: any) => ({ headerName: 'Actions', cellRenderer: 'action', ...action }),
}));

vi.mock('@/src/constants/grid-columns/actions', () => ({
  getRemoveOperation: vi.fn((_onRemove: any) => ({ field: 'remove' })),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialGhostButton: ({ label, onClick, iconBefore }: any) => (
    <button role="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

vi.mock('@tabler/icons-react', () => ({
  IconPlus: () => <svg data-icon="plus" />,
}));

const createTemplate = (overrides?: Partial<TestSuiteRequestTemplate>): TestSuiteRequestTemplate => ({
  urlTemplate: '/api/test',
  body: {},
  headers: [],
  queryParams: [],
  ...overrides,
});

describe('ParamsTab', () => {
  let mockChangeTemplate: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChangeTemplate = vi.fn();
  });

  test('renders heading with title and param count', () => {
    render(
      <ParamsTab
        template={createTemplate({ queryParams: [{ key: 'a', value: 'b' }] })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Parameters: 1');
  });

  test('renders heading with 0 count when field is empty', () => {
    render(
      <ParamsTab
        template={createTemplate({ queryParams: [] })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Parameters: 0');
  });

  test('renders heading with 0 count when field is undefined', () => {
    render(
      <ParamsTab
        template={createTemplate({ queryParams: undefined })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Parameters: 0');
  });

  test('renders Add button', () => {
    render(
      <ParamsTab
        template={createTemplate()}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeInTheDocument();
  });

  test('renders GridView', () => {
    render(
      <ParamsTab
        template={createTemplate()}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    expect(screen.getByRole('region', { name: 'grid' })).toBeInTheDocument();
  });

  test('shows empty data message when field has no items', () => {
    render(
      <ParamsTab
        template={createTemplate({ headers: [] })}
        changeTemplate={mockChangeTemplate}
        field="headers"
        title="Headers"
        emptyDataTitle="No headers"
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('No headers');
  });

  test('does not show empty data message when field has items', () => {
    render(
      <ParamsTab
        template={createTemplate({ headers: [{ key: 'k', value: 'v' }] })}
        changeTemplate={mockChangeTemplate}
        field="headers"
        title="Headers"
        emptyDataTitle="No headers"
      />,
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('Add button calls changeTemplate with new empty param appended', () => {
    const template = createTemplate({ queryParams: [{ key: 'existing', value: 'val' }] });

    render(
      <ParamsTab
        template={template}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    // Simulate gridApi for onAddParam to read lastDisplayedRowIndex
    const mockApi = {
      updateGridOptions: vi.fn(),
      getLastDisplayedRowIndex: () => 0,
      ensureIndexVisible: vi.fn(),
      isDestroyed: () => false,
    };
    capturedOnGridReady({ api: mockApi } as any);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(mockChangeTemplate).toHaveBeenCalledTimes(1);
    const updatedTemplate = mockChangeTemplate.mock.calls[0][0];
    expect(updatedTemplate.queryParams).toHaveLength(2);
    expect(updatedTemplate.queryParams[1]).toEqual({ key: '', value: '' });
  });

  test('Add button preserves existing params', () => {
    const template = createTemplate({ headers: [{ key: 'auth', value: 'token' }] });

    render(
      <ParamsTab
        template={template}
        changeTemplate={mockChangeTemplate}
        field="headers"
        title="Headers"
        emptyDataTitle="No headers"
      />,
    );

    const mockApi = {
      updateGridOptions: vi.fn(),
      getLastDisplayedRowIndex: () => 0,
      ensureIndexVisible: vi.fn(),
      isDestroyed: () => false,
    };
    capturedOnGridReady({ api: mockApi } as any);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    const updatedTemplate = mockChangeTemplate.mock.calls[0][0];
    expect(updatedTemplate.headers[0]).toEqual({ key: 'auth', value: 'token' });
  });

  test('Add button preserves other template fields', () => {
    const template = createTemplate({
      urlTemplate: '/my-url',
      body: { data: true },
      queryParams: [],
    });

    render(
      <ParamsTab
        template={template}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    const mockApi = {
      updateGridOptions: vi.fn(),
      getLastDisplayedRowIndex: () => -1,
      ensureIndexVisible: vi.fn(),
      isDestroyed: () => false,
    };
    capturedOnGridReady({ api: mockApi } as any);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    const updatedTemplate = mockChangeTemplate.mock.calls[0][0];
    expect(updatedTemplate.urlTemplate).toBe('/my-url');
    expect(updatedTemplate.body).toEqual({ data: true });
  });

  test('onGridReady updates grid options with columnDefs and rowData', () => {
    const template = createTemplate({ queryParams: [{ key: 'k', value: 'v' }] });

    render(
      <ParamsTab
        template={template}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    const mockUpdateGridOptions = vi.fn();
    const mockApi = {
      updateGridOptions: mockUpdateGridOptions,
      getLastDisplayedRowIndex: () => 0,
      ensureIndexVisible: vi.fn(),
      isDestroyed: () => false,
    };
    capturedOnGridReady({ api: mockApi } as any);

    expect(mockUpdateGridOptions).toHaveBeenCalledWith({
      columnDefs: expect.any(Array),
      rowData: [{ key: 'k', value: 'v' }],
    });
  });

  test('calls getParamsColumns with onChangeValue callback', () => {
    render(
      <ParamsTab
        template={createTemplate()}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    expect(mockGetParamsColumns).toHaveBeenCalledTimes(1);
    expect(mockGetParamsColumns).toHaveBeenCalledWith(expect.any(Function));
  });

  test('onChangeValue calls changeTemplate with updated param', () => {
    const template = createTemplate({ queryParams: [{ key: 'name', value: 'old' }] });

    render(
      <ParamsTab
        template={template}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    const onChangeValue = mockGetParamsColumns.mock.calls[0][0];
    onChangeValue('new-value', { key: 'name', value: 'old' }, 'value', 0);

    expect(mockChangeTemplate).toHaveBeenCalledTimes(1);
    const updatedTemplate = mockChangeTemplate.mock.calls[0][0];
    expect(updatedTemplate.queryParams[0].value).toBe('new-value');
  });

  test('onChangeValue does nothing when rowIndex is null', () => {
    render(
      <ParamsTab
        template={createTemplate({ queryParams: [{ key: 'k', value: 'v' }] })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    const onChangeValue = mockGetParamsColumns.mock.calls[0][0];
    onChangeValue('val', {}, 'key', null);

    expect(mockChangeTemplate).not.toHaveBeenCalled();
  });

  test('onChangeValue does nothing when rowIndex is undefined', () => {
    render(
      <ParamsTab
        template={createTemplate({ queryParams: [{ key: 'k', value: 'v' }] })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    const onChangeValue = mockGetParamsColumns.mock.calls[0][0];
    onChangeValue('val', {}, 'key', undefined);

    expect(mockChangeTemplate).not.toHaveBeenCalled();
  });

  test('works with headers field', () => {
    render(
      <ParamsTab
        template={createTemplate({ headers: [{ key: 'Content-Type', value: 'application/json' }] })}
        changeTemplate={mockChangeTemplate}
        field="headers"
        title="Headers"
        emptyDataTitle="No headers"
      />,
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Headers: 1');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('renders with correct container classes', () => {
    const { container } = render(
      <ParamsTab
        template={createTemplate()}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Parameters"
        emptyDataTitle="No parameters"
      />,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'gap-3', 'w-full', 'h-full');
  });

  test('heading shows correct count for multiple params', () => {
    const params = [
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
      { key: 'c', value: '3' },
    ];

    render(
      <ParamsTab
        template={createTemplate({ queryParams: params })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        title="Query Params"
        emptyDataTitle="No params"
      />,
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Query Params: 3');
  });
});
