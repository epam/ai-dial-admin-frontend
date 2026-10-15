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

const grid = vi.hoisted(() => ({
  options: undefined as any,
  datasource: undefined as any,
  onDatasourceSet: vi.fn(),
}));

const mockGridApi = {
  setGridOption: vi.fn((name: string, value: unknown) => {
    if (name === 'datasource') {
      grid.datasource = value;
      grid.onDatasourceSet(value);
    }
  }),
  hideOverlay: vi.fn(),
  showNoRowsOverlay: vi.fn(),
};

vi.mock('@/src/components/Grid/GridView/GridView', async () => {
  const { useEffect } = await import('react');
  return {
    default: ({ columnDefs, onGridReady, additionalGridOptions, emptyDataProps }: any) => {
      grid.options = additionalGridOptions;
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

describe('DatasetTestSuites', () => {
  const windowOpen = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    grid.datasource = undefined;
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

    expect(screen.getByText(DatasetsI18nKey.TestSuitesDescription)).toBeTruthy();
    expect(screen.getByText(EntitiesI18nKey.NoTestSuites)).toBeTruthy();
  });

  test('registers the datasource once and sends no request until the grid asks for rows', () => {
    const { rerender } = render(<DatasetTestSuites datasetId="ds-1" />);
    rerender(<DatasetTestSuites datasetId="ds-1" />);

    expect(grid.onDatasourceSet).toHaveBeenCalledOnce();
    expect(getDatasetTestSuitesPage).not.toHaveBeenCalled();
  });

  test('requests the first page once, scoped to the dataset, with the grid sort and filters', async () => {
    render(<DatasetTestSuites datasetId="ds-1" />);
    const successCallback = vi.fn();

    grid.datasource.getRows({ startRow: 0, sortModel: [], filterModel: {}, successCallback, failCallback: vi.fn() });
    expect(getDatasetTestSuitesPage).toHaveBeenCalledOnce();
    expect(getDatasetTestSuitesPage).toHaveBeenCalledWith('ds-1', 0, expect.any(Number), [], []);
    await vi.waitFor(() => expect(successCallback).toHaveBeenCalledWith([ROW], 1));
  });

  test('reports a failed load to the grid', async () => {
    vi.mocked(getDatasetTestSuitesPage).mockRejectedValue(new Error('boom'));
    render(<DatasetTestSuites datasetId="ds-1" />);
    const failCallback = vi.fn();

    grid.datasource.getRows({ startRow: 0, sortModel: [], filterModel: {}, successCallback: vi.fn(), failCallback });

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

    grid.datasource.getRows({ startRow: 0, sortModel: [], filterModel: {}, successCallback, failCallback: vi.fn() });

    await vi.waitFor(() => expect(successCallback).toHaveBeenCalledWith([], 0));
    expect(mockGridApi.showNoRowsOverlay).toHaveBeenCalledOnce();
  });

  test('opens the test suite in a new tab when a row is clicked', () => {
    render(<DatasetTestSuites datasetId="ds-1" />);

    grid.options.onCellClicked({ colDef: { field: 'name' }, data: ROW, node: { setSelected: vi.fn() } });

    expect(windowOpen).toHaveBeenCalledWith('/test-suites/suite-1', '_blank');
  });

  test('does not open a tab when the actions cell itself is clicked', () => {
    render(<DatasetTestSuites datasetId="ds-1" />);

    grid.options.onCellClicked({ colDef: { field: ACTIONS_COLUMN_CEL_ID }, data: ROW, node: { setSelected: vi.fn() } });

    expect(windowOpen).not.toHaveBeenCalled();
  });

  test('offers only "Open in new tab" in the context menu, which opens the suite', async () => {
    const user = userEvent.setup();
    render(<DatasetTestSuites datasetId="ds-1" />);

    expect(screen.getAllByRole('button')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: ActionMenuOperationI18nKey.Open_in_new_tab }));

    expect(windowOpen).toHaveBeenCalledWith('/test-suites/suite-1', '_blank');
  });
});
