import { ICellRendererParams } from 'ag-grid-community';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import HeatMapValueCellRenderer from '../HeatMapValueCellRenderer';

const column = (width: number, colId = 'tc_case1') =>
  ({
    getActualWidth: () => width,
    getColId: () => colId,
  }) as never;

const cellParams = {} as ICellRendererParams;

describe('Common HeatMapValueCellRenderer alignment', () => {
  test('right-aligns the cell value', () => {
    const { container } = render(
      <HeatMapValueCellRenderer
        {...cellParams}
        data={{ values: { tc_case1: 0.5 } }}
        column={column(200)}
        value="0.500"
      />,
    );

    expect(container.querySelector('.justify-end')).toBeTruthy();
    expect(container.querySelector('.justify-center')).toBeNull();
  });
});
