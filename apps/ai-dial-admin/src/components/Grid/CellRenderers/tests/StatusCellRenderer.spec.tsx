import { ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import StatusCellRenderer from '../StatusCellRenderer';

// The renderer reads only the props each case sets; ag-grid's other cell params come from one
// typed fake.
const cellParams = {} as ICellRendererParams;

describe('StatusCellRenderer', () => {
  test('renders status dot with class and value', () => {
    const { container } = render(<StatusCellRenderer {...cellParams} value="Active" statusClassName="bg-green" />);
    const dot = container.querySelector('.bg-green');
    expect(dot).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('renders with empty statusClassName', () => {
    render(<StatusCellRenderer {...cellParams} value="Inactive" />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });
});
