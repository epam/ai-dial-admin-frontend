import { ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { GridColumnType } from '@/src/types/grid-column';

import FormattedValueCellRenderer from '../FormattedValueCellRenderer';

const renderCell = (params: Partial<ICellRendererParams>) =>
  render(<FormattedValueCellRenderer {...({ data: {}, ...params } as ICellRendererParams)} />);

describe('FormattedValueCellRenderer', () => {
  test('renders nothing without row data', () => {
    const { container } = renderCell({ data: undefined });

    expect(container.firstChild).toBeNull();
  });

  test('prints the formatted value when the column has a formatter', () => {
    renderCell({ value: 1234, valueFormatted: '1,234' });

    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  test('falls back to the raw value', () => {
    renderCell({ value: 7 });

    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('right-aligns the text for a right-aligned column', () => {
    renderCell({ value: 1, valueFormatted: '1', colDef: { type: GridColumnType.RightAligned } });

    expect(screen.getByText('1')).toHaveClass('text-end');
  });

  test('right-aligns when the type is one of several', () => {
    renderCell({ value: 1, valueFormatted: '1', colDef: { type: ['other', GridColumnType.RightAligned] } });

    expect(screen.getByText('1')).toHaveClass('text-end');
  });

  test('leaves other columns alone', () => {
    renderCell({ value: 1, valueFormatted: '1', colDef: {} });

    expect(screen.getByText('1')).not.toHaveClass('text-end');
  });
});
