import { createRef } from 'react';

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { TestSuiteRequestTemplate } from '@/src/models/evaluation/test-suite';
import ParamsTab, { ParamsTabRef } from '../tabs/ParamsTab';

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

const mockGetParamsColumns = vi.fn((_onChange: any) => [{ field: 'key' }, { field: 'value' }]);
vi.mock('@/src/constants/grid-columns/grid-columns', () => ({
  getParamsColumns: (onChange: any) => mockGetParamsColumns(onChange),
}));

vi.mock('@/src/constants/ag-grid', () => ({
  ONE_ACTION_COLUMN: (action: any) => ({ headerName: 'Actions', ...action }),
}));

const mockGetDeleteOperation = vi.fn((_onRemove: any, _a?: unknown, _b?: unknown) => ({ field: 'delete' }));
vi.mock('@/src/constants/grid-columns/actions', () => ({
  getDeleteOperation: (onRemove: any, a?: unknown, b?: unknown) => mockGetDeleteOperation(onRemove, a, b),
}));

const createTemplate = (overrides?: Partial<TestSuiteRequestTemplate>): TestSuiteRequestTemplate => ({
  urlTemplate: '/api/test',
  body: {},
  headers: [],
  queryParams: [],
  ...overrides,
});

const createMockApi = () => ({
  updateGridOptions: vi.fn(),
  getLastDisplayedRowIndex: vi.fn().mockReturnValue(-1),
  ensureIndexVisible: vi.fn(),
});

describe('ParamsTab', () => {
  let mockChangeTemplate: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChangeTemplate = vi.fn();
  });

  test('renders GridView', () => {
    render(
      <ParamsTab
        template={createTemplate()}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        emptyDataTitle="No parameters"
      />,
    );

    expect(screen.getByRole('region', { name: 'grid' })).toBeInTheDocument();
  });

  test('shows empty state when field data is empty', () => {
    render(
      <ParamsTab
        template={createTemplate({ queryParams: [] })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        emptyDataTitle="No parameters"
      />,
    );

    expect(capturedGetIsEmptyData()).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('No parameters');
  });

  test('does not show empty state when field data has items', () => {
    render(
      <ParamsTab
        template={createTemplate({ queryParams: [{ key: 'k', value: 'v' }] })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        emptyDataTitle="No parameters"
      />,
    );

    expect(capturedGetIsEmptyData()).toBe(false);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('onGridReady updates grid options with columnDefs and rowData', () => {
    const params = [{ key: 'a', value: '1' }];
    render(
      <ParamsTab
        template={createTemplate({ queryParams: params })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        emptyDataTitle="No parameters"
      />,
    );

    const mockApi = createMockApi();
    capturedOnGridReady({ api: mockApi });

    expect(mockApi.updateGridOptions).toHaveBeenCalledWith({
      columnDefs: expect.any(Array),
      rowData: params,
    });
  });

  test('ref.add appends new empty param and calls changeTemplate', () => {
    const ref = createRef<ParamsTabRef>();
    const template = createTemplate({ queryParams: [{ key: 'existing', value: 'val' }] });

    render(
      <ParamsTab
        ref={ref}
        template={template}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        emptyDataTitle="No parameters"
      />,
    );

    const mockApi = createMockApi();
    capturedOnGridReady({ api: mockApi });

    ref.current?.add();

    expect(mockChangeTemplate).toHaveBeenCalledTimes(1);
    expect(mockChangeTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        queryParams: [
          { key: 'existing', value: 'val' },
          { key: '', value: '' },
        ],
      }),
    );
  });

  test('ref.add works when field data is initially empty', () => {
    const ref = createRef<ParamsTabRef>();

    render(
      <ParamsTab
        ref={ref}
        template={createTemplate({ queryParams: [] })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        emptyDataTitle="No parameters"
      />,
    );

    const mockApi = createMockApi();
    capturedOnGridReady({ api: mockApi });

    ref.current?.add();

    expect(mockChangeTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        queryParams: [{ key: '', value: '' }],
      }),
    );
  });

  test('onRemoveParam removes item at given index and calls changeTemplate', () => {
    render(
      <ParamsTab
        template={createTemplate({ headers: [{ key: 'a', value: '1' }, { key: 'b', value: '2' }] })}
        changeTemplate={mockChangeTemplate}
        field="headers"
        emptyDataTitle="No headers"
      />,
    );

    const onRemove = mockGetDeleteOperation.mock.calls[0][0];
    onRemove(undefined, 0);

    expect(mockChangeTemplate).toHaveBeenCalledTimes(1);
    expect(mockChangeTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: [{ key: 'b', value: '2' }],
      }),
    );
  });

  test('onRemoveParam does nothing when index is null', () => {
    render(
      <ParamsTab
        template={createTemplate({ queryParams: [{ key: 'a', value: '1' }] })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        emptyDataTitle="No parameters"
      />,
    );

    const onRemove = mockGetDeleteOperation.mock.calls[0][0];
    onRemove(undefined, null);

    expect(mockChangeTemplate).not.toHaveBeenCalled();
  });

  test('onChangeValue updates the correct field at rowIndex', () => {
    const params = [{ key: 'old-key', value: 'old-val' }];
    render(
      <ParamsTab
        template={createTemplate({ queryParams: params })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        emptyDataTitle="No parameters"
      />,
    );

    const onChangeValue = mockGetParamsColumns.mock.calls[0][0];
    onChangeValue('new-val', params[0], 'value', 0);

    expect(mockChangeTemplate).toHaveBeenCalledTimes(1);
    expect(mockChangeTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        queryParams: [{ key: 'old-key', value: 'new-val' }],
      }),
    );
  });

  test('onChangeValue does nothing when rowIndex is undefined', () => {
    const params = [{ key: 'k', value: 'v' }];
    render(
      <ParamsTab
        template={createTemplate({ queryParams: params })}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        emptyDataTitle="No parameters"
      />,
    );

    const onChangeValue = mockGetParamsColumns.mock.calls[0][0];
    onChangeValue('new-val', params[0], 'value', undefined);

    expect(mockChangeTemplate).not.toHaveBeenCalled();
  });

  test('calls getParamsColumns with an onChangeValue callback', () => {
    render(
      <ParamsTab
        template={createTemplate()}
        changeTemplate={mockChangeTemplate}
        field="queryParams"
        emptyDataTitle="No parameters"
      />,
    );

    expect(mockGetParamsColumns).toHaveBeenCalledTimes(1);
    expect(mockGetParamsColumns).toHaveBeenCalledWith(expect.any(Function));
  });

  test('passes field data as rowData to getIsEmptyData check for headers field', () => {
    render(
      <ParamsTab
        template={createTemplate({ headers: [{ key: 'x', value: 'y' }] })}
        changeTemplate={mockChangeTemplate}
        field="headers"
        emptyDataTitle="No headers"
      />,
    );

    expect(capturedGetIsEmptyData()).toBe(false);
  });
});
