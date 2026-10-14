import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getDatasetTestSuitesPage } from '@/src/app/[lang]/datasets/actions';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ActionMenuOperationI18nKey, DatasetsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import DatasetTestSuites from '../TestSuites';

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getDatasetTestSuitesPage: vi.fn(),
}));

const ROW = { id: 'suite-1', name: 'Suite 1' };

const mockGridApi = {
  setGridOption: vi.fn(),
  hideOverlay: vi.fn(),
  showNoRowsOverlay: vi.fn(),
};

const grid = vi.hoisted(() => ({ options: undefined as any, columnDefs: [] as any[], datasource: undefined as any }));

vi.mock('@/src/components/Grid/GridView/GridView', async () => {
  const { useEffect } = await import('react');
  return {
    default: ({ columnDefs, onGridReady, additionalGridOptions, emptyDataProps }: any) => {
      grid.options = additionalGridOptions;
      grid.columnDefs = columnDefs;
      useEffect(() => {
        onGridReady?.({ api: mockGridApi });
      }, []);
      const items = columnDefs.find((col: any) => col.field === 'actionsColumn')?.cellRendererParams?.items ?? [];
      return (
        <div role="grid">
          <span>{emptyDataProps?.title}</span>
          {items.map((item: any) => (
            <button key={item.id} type="button" onClick={() => item.onClick(ROW)}>
              {item.label}
            </button>
          ))}
        </div>
      );
    },
  };
});

const datasourceOf = () => {
  const call = mockGridApi.setGridOption.mock.calls.find(([name]) => name === 'datasource');
  return call?.[1];
};

describe('DatasetTestSuites', () => {
  const windowOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('open', windowOpen);
    vi.mocked(getDatasetTestSuitesPage).mockResolvedValue({
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      content: [ROW],
    });
  });

  test('shows the description line and the empty-state title', () => {
    render(<DatasetTestSuites datasetId="ds-1" />);

    expect(screen.getByText(DatasetsI18nKey.TestSuitesDescription)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.NoTestSuites)).toBeInTheDocument();
  });

  test('registers the datasource once and sends no request until the grid asks for rows', () => {
    const { rerender } = render(<DatasetTestSuites datasetId="ds-1" />);
    rerender(<DatasetTestSuites datasetId="ds-1" />);

    expect(mockGridApi.setGridOption.mock.calls.filter(([name]) => name === 'datasource')).toHaveLength(1);
    expect(getDatasetTestSuitesPage).not.toHaveBeenCalled();
  });

  test('a first-page request is a single scoped call, with the grid sort and filters', async () => {
    render(<DatasetTestSuites datasetId="ds-1" />);
    const successCallback = vi.fn();

    datasourceOf().getRows({ startRow: 0, sortModel: [], filterModel: {}, successCallback, failCallback: vi.fn() });
    await vi.waitFor(() => expect(successCallback).toHaveBeenCalledWith([ROW], 1));

    expect(getDatasetTestSuitesPage).toHaveBeenCalledTimes(1);
    expect(getDatasetTestSuitesPage).toHaveBeenCalledWith('ds-1', 0, expect.any(Number), [], []);
  });

  test('reports a failed load to the grid', async () => {
    vi.mocked(getDatasetTestSuitesPage).mockRejectedValue(new Error('boom'));
    render(<DatasetTestSuites datasetId="ds-1" />);
    const failCallback = vi.fn();

    datasourceOf().getRows({ startRow: 0, sortModel: [], filterModel: {}, successCallback: vi.fn(), failCallback });

    await vi.waitFor(() => expect(failCallback).toHaveBeenCalled());
  });

  test('shows the no-rows overlay when the dataset has no suites', async () => {
    vi.mocked(getDatasetTestSuitesPage).mockResolvedValue({
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
      content: [],
    });
    render(<DatasetTestSuites datasetId="ds-1" />);
    const successCallback = vi.fn();

    datasourceOf().getRows({ startRow: 0, sortModel: [], filterModel: {}, successCallback, failCallback: vi.fn() });

    await vi.waitFor(() => expect(mockGridApi.showNoRowsOverlay).toHaveBeenCalled());
    expect(successCallback).toHaveBeenCalledWith([], 0);
  });

  test('clicking a row opens the test suite in a new tab', () => {
    render(<DatasetTestSuites datasetId="ds-1" />);

    grid.options.onCellClicked({ colDef: { field: 'name' }, data: ROW, node: { setSelected: vi.fn() } });

    expect(windowOpen).toHaveBeenCalledWith('/test-suites/suite-1', '_blank');
  });

  test('clicking the actions cell itself does not open a tab', () => {
    render(<DatasetTestSuites datasetId="ds-1" />);

    grid.options.onCellClicked({ colDef: { field: ACTIONS_COLUMN_CEL_ID }, data: ROW, node: { setSelected: vi.fn() } });

    expect(windowOpen).not.toHaveBeenCalled();
  });

  test('the context menu holds only "Open in new tab", which opens the suite', async () => {
    render(<DatasetTestSuites datasetId="ds-1" />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: ActionMenuOperationI18nKey.Open_in_new_tab }));

    expect(windowOpen).toHaveBeenCalledWith('/test-suites/suite-1', '_blank');
  });

  test('shows the eight columns of the test suites list', () => {
    render(<DatasetTestSuites datasetId="ds-1" />);

    const headers = grid.columnDefs
      .filter((col) => col.field !== 'actionsColumn' && !col.hide)
      .map((col) => col.headerName);
    expect(headers).toEqual([
      'Display Name',
      'Description',
      'ID',
      'Suite Type',
      'Application',
      expect.any(String),
      expect.any(String),
      'Created By',
    ]);
  });
});
