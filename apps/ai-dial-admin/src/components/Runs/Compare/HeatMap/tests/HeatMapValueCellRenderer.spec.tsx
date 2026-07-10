import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import HeatMapValueCellRenderer from '@/src/components/Runs/Compare/HeatMap/HeatMapValueCellRenderer';
import { HEAT_MAP_VALUE_TEXT_MIN_WIDTH } from '@/src/components/Runs/Compare/HeatMap/constants';
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

describe('HeatMapValueCellRenderer', () => {
  test('shows formatted value in normal view', () => {
    render(
      <HeatMapValueCellRenderer
        data={metricRow}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)}
        value="0.500"
        {...({} as never)}
      />,
    );

    expect(screen.getByText('0.500')).toBeInTheDocument();
  });

  test('shows em dash for missing values in normal view', () => {
    render(
      <HeatMapValueCellRenderer
        data={metricRow}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH, 'tc_case2')}
        value={null}
        {...({} as never)}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  test('shows signed delta values in delta mode', () => {
    render(
      <HeatMapValueCellRenderer
        data={{ ...metricRow, values: { tc_case1: 0.3 } }}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)}
        value="+0.300"
        colorDisplayMode={HeatMapColorDisplayMode.Delta}
        {...({} as never)}
      />,
    );

    expect(screen.getByText('+0.300')).toBeInTheDocument();
  });

  test('shows zero with secondary text in delta mode', () => {
    render(
      <HeatMapValueCellRenderer
        data={{ ...metricRow, values: { tc_case1: 0 } }}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)}
        value="0"
        colorDisplayMode={HeatMapColorDisplayMode.Delta}
        {...({} as never)}
      />,
    );

    expect(screen.getByText('0')).toHaveClass('text-secondary');
  });

  test('renders nothing in minified view for numeric values', () => {
    const { container } = render(
      <HeatMapValueCellRenderer
        data={metricRow}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1)}
        value="0.500"
        {...({} as never)}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing in minified view for missing values', () => {
    const { container } = render(
      <HeatMapValueCellRenderer
        data={metricRow}
        column={column(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1, 'tc_case2')}
        value={null}
        {...({} as never)}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
