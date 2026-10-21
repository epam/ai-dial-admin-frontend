import { ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ExtraDataCellRenderer from '../ExtraDataCellRenderer';

vi.mock('@/src/utils/validation/is-valid-json', () => ({
  isJSON: (val: string) => val === '{"a":1}',
}));

// The renderer reads `value` only; ag-grid's other cell params are never touched.
const cellParams = {} as ICellRendererParams;

describe('ExtraDataCellRenderer', () => {
  test('renders value and json icon if value is JSON', () => {
    render(<ExtraDataCellRenderer {...cellParams} value='{"a":1}' />);
    expect(screen.getByText('{"a":1}')).toBeInTheDocument();
  });

  test('renders value without json icon if value is not JSON', () => {
    render(<ExtraDataCellRenderer {...cellParams} value="not-json" />);
    expect(screen.getByText('not-json')).toBeInTheDocument();
  });
});
