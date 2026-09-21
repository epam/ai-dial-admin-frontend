import { ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import HeatMapValueCellRenderer from '@/src/components/Runs/Compare/HeatMap/HeatMapValueCellRenderer';
import { HEAT_MAP_VALUE_TEXT_MIN_WIDTH } from '@/src/components/Common/HeatMap/constants';
import { HeatMapColorDisplayMode, HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';

const metricRow = {
  id: 'metric-1',
  rowType: HeatMapRowType.Metric,
  groupKey: 'accuracy',
  label: 'f1',
  values: { tc_case1: 0.5, tc_case2: undefined },
};

const column = (width: number, colId = 'tc_case1') =>
  ({
    getActualWidth: () => width,
    getColId: () => colId,
  }) as never;

// The renderer reads `value` only; ag-grid's other cell params come from one typed fake.
const cellParams = {} as ICellRendererParams;

describe('HeatMapValueCellRenderer', () => {
  test('shows formatted value in normal view', () => {
    render(
      <HeatMapValueCellRenderer
        {...cellParams}
        data={metricRow}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)}
        value="0.500"
      />,
    );

    expect(screen.getByText('0.500')).toBeInTheDocument();
  });

  test('shows em dash for missing values in normal view', () => {
    const { container } = render(
      <HeatMapValueCellRenderer
        {...cellParams}
        data={metricRow}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH, 'tc_case2')}
        value={null}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(container.querySelector('.text-secondary')).toBeInTheDocument();
  });

  test('shows signed delta values in delta mode', () => {
    render(
      <HeatMapValueCellRenderer
        {...cellParams}
        data={{ ...metricRow, values: { tc_case1: 0.3 } }}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)}
        value="+0.300"
        colorDisplayMode={HeatMapColorDisplayMode.Delta}
      />,
    );

    expect(screen.getByText('+0.300')).toBeInTheDocument();
  });

  test('shows zero with secondary text in delta mode', () => {
    render(
      <HeatMapValueCellRenderer
        {...cellParams}
        data={{ ...metricRow, values: { tc_case1: 0 } }}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)}
        value="0"
        colorDisplayMode={HeatMapColorDisplayMode.Delta}
      />,
    );

    expect(screen.getByText('0')).toHaveClass('text-secondary');
  });

  test('renders nothing in minified view for numeric values', () => {
    const { container } = render(
      <HeatMapValueCellRenderer
        {...cellParams}
        data={metricRow}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1)}
        value="0.500"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing in minified view for missing values', () => {
    const { container } = render(
      <HeatMapValueCellRenderer
        {...cellParams}
        data={metricRow}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1, 'tc_case2')}
        value={null}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
