import { render, screen } from '@testing-library/react';
import { ColDef, GridOptions, IRowNode, RowSelectedEvent } from 'ag-grid-community';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { TWO_LINE_ROW_HEIGHT } from '@/src/components/Grid/constants';
import { METRIC_NAME_COLUMN_WIDTH, METRIC_PROVIDER_COLUMN_WIDTH } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, EntityFieldsI18nKey, TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import MetricSelection from '../MetricSelection';

interface GridViewProps {
  columnDefs?: ColDef[];
  rowData?: Metric[] | null;
  additionalGridOptions?: GridOptions;
  emptyDataProps?: { title?: string };
}

let capturedGridProps: GridViewProps | undefined;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: GridViewProps) => {
    capturedGridProps = props;
    return <section aria-label="metrics-grid" />;
  },
}));

const buildRowSelectedEvent = (metric: Metric, isSelected: boolean) => {
  const refreshCells = vi.fn();
  const node = { isSelected: () => isSelected } as IRowNode<Metric>;
  const event = { api: { refreshCells }, node, data: metric } as unknown as RowSelectedEvent<Metric>;

  return { event, node, refreshCells };
};

describe('MetricSelection', () => {
  const metrics: Metric[] = [
    { id: 'metric-1', name: 'Alpha Metric', displayName: 'Alpha Metric', description: 'First metric' },
    { id: 'metric-2', name: 'Beta Metric', displayName: 'Beta Metric', description: 'Second metric' },
    { id: 'metric-3', name: 'Gamma Metric', displayName: 'Gamma Metric', description: 'Third metric' },
  ];

  const renderMetricSelection = (props?: Partial<ComponentProps<typeof MetricSelection>>) =>
    render(<MetricSelection metrics={metrics} {...props} />);

  beforeEach(() => {
    capturedGridProps = undefined;
    vi.clearAllMocks();
  });

  test('renders metrics heading', () => {
    renderMetricSelection();

    expect(screen.getByText(TabsI18nKey.Metrics)).toBeTruthy();
  });

  test('renders the selection grid', () => {
    renderMetricSelection();

    expect(screen.getByRole('region', { name: 'metrics-grid' })).toBeTruthy();
  });

  test('passes the metrics list to the grid as row data', () => {
    renderMetricSelection();

    expect(capturedGridProps?.rowData).toEqual(metrics);
  });

  test('renders a Metric column carrying the radio-and-initials renderer, then description, outputs and provider', () => {
    renderMetricSelection();

    const [nameColumn, descriptionColumn, outputsColumn, providerColumn] = capturedGridProps?.columnDefs ?? [];

    expect(capturedGridProps?.columnDefs).toHaveLength(4);
    expect(nameColumn.colId).toBe('displayName');
    expect(nameColumn.headerName).toBe(TestSuitesI18nKey.Metric);
    expect(nameColumn.cellRenderer).toBeTruthy();
    expect(descriptionColumn.field).toBe('description');
    expect(outputsColumn.headerName).toBe(TestSuitesI18nKey.Outputs);
    expect(outputsColumn.cellRenderer).toBeTruthy();
    expect(providerColumn.colId).toBe('providerId');
    expect(providerColumn.field).toBe('providerId');
    expect(providerColumn.headerName).toBe(EntityFieldsI18nKey.provider);
  });

  test('sizes the metric and provider columns to their designed widths', () => {
    renderMetricSelection();

    const [nameColumn, , , providerColumn] = capturedGridProps?.columnDefs ?? [];

    expect(nameColumn.minWidth).toBe(METRIC_NAME_COLUMN_WIDTH);
    expect(providerColumn.maxWidth).toBe(METRIC_PROVIDER_COLUMN_WIDTH);
  });

  test('wraps the description over two clamped lines in a row tall enough to hold them', () => {
    renderMetricSelection();

    const descriptionColumn = capturedGridProps?.columnDefs?.[1];

    expect(capturedGridProps?.additionalGridOptions?.rowHeight).toBe(TWO_LINE_ROW_HEIGHT);
    expect(descriptionColumn?.wrapText).toBe(true);
    expect(descriptionColumn?.cellRendererParams).toEqual({ lines: 2 });
  });

  test('selects a single row by click without a separate selection column', () => {
    renderMetricSelection();

    expect(capturedGridProps?.additionalGridOptions?.rowSelection).toEqual({
      mode: 'singleRow',
      enableClickSelection: true,
      checkboxes: false,
    });
    expect(capturedGridProps?.additionalGridOptions?.selectionColumnDef).toBeUndefined();
  });

  test('passes the empty state title to the grid', () => {
    renderMetricSelection({ metrics: [] });

    expect(capturedGridProps?.emptyDataProps?.title).toBe(EntitiesI18nKey.NoMetrics);
  });

  test('calls onSelectMetric with the metric id when a row becomes selected', () => {
    const onSelectMetric = vi.fn();
    renderMetricSelection({ onSelectMetric });
    const { event } = buildRowSelectedEvent(metrics[0], true);

    capturedGridProps?.additionalGridOptions?.onRowSelected?.(event);

    expect(onSelectMetric).toHaveBeenCalledOnce();
    expect(onSelectMetric).toHaveBeenCalledWith('metric-1');
  });

  test('refreshes the name cell of the row whose selection changed so its radio follows', () => {
    renderMetricSelection({ onSelectMetric: vi.fn() });
    const { event, node, refreshCells } = buildRowSelectedEvent(metrics[1], false);

    capturedGridProps?.additionalGridOptions?.onRowSelected?.(event);

    expect(refreshCells).toHaveBeenCalledWith({
      rowNodes: [node],
      columns: ['displayName'],
      force: true,
    });
  });

  test('does not call onSelectMetric when a row becomes deselected', () => {
    const onSelectMetric = vi.fn();
    renderMetricSelection({ onSelectMetric });
    const { event } = buildRowSelectedEvent(metrics[0], false);

    capturedGridProps?.additionalGridOptions?.onRowSelected?.(event);

    expect(onSelectMetric).not.toHaveBeenCalled();
  });

  test('preselects and scrolls to the already chosen metric once data is rendered', () => {
    renderMetricSelection({ selectedMetricId: 'metric-2' });

    const setSelected = vi.fn();
    const ensureNodeVisible = vi.fn();
    const nodes = metrics.map((metric) => ({ data: metric, setSelected }) as unknown as IRowNode<Metric>);
    const api = {
      forEachNode: (callback: (node: IRowNode<Metric>) => void) => nodes.forEach(callback),
      ensureNodeVisible,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    capturedGridProps?.additionalGridOptions?.onFirstDataRendered?.({ api } as any);

    expect(setSelected).toHaveBeenCalledOnce();
    expect(setSelected).toHaveBeenCalledWith(true);
    expect(ensureNodeVisible).toHaveBeenCalledWith(nodes[1], 'middle');
  });

  test('does not preselect anything when no metric is chosen yet', () => {
    renderMetricSelection();

    const setSelected = vi.fn();
    const api = {
      forEachNode: (callback: (node: IRowNode<Metric>) => void) =>
        metrics.forEach((metric) => callback({ data: metric, setSelected } as unknown as IRowNode<Metric>)),
      ensureNodeVisible: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    capturedGridProps?.additionalGridOptions?.onFirstDataRendered?.({ api } as any);

    expect(setSelected).not.toHaveBeenCalled();
  });
});
