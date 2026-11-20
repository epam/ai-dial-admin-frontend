import { ICellRendererParams } from 'ag-grid-community';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import StringEditorCellRenderer from '@/src/components/Grid/CellRenderers/StringEditorCellRenderer';

describe('StringEditorCellRenderer', () => {
  test('synchronizes inline edits with the parent and the grid cell', () => {
    const onChange = vi.fn();
    const setValue = vi.fn();
    const data = { key: 'config', required: false };
    const params = {
      value: 'original',
      data,
      colDef: { field: 'value' },
      node: { rowIndex: 2 },
      setValue,
    } as unknown as ICellRendererParams;

    render(<StringEditorCellRenderer {...params} label="config" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'updated' } });

    expect(onChange).toHaveBeenCalledWith('updated', data, 'value', 2);
    expect(setValue).toHaveBeenCalledWith('updated');
    expect(screen.getByRole('textbox')).toHaveValue('updated');
  });

  test('reflects a replacement value received from the grid', () => {
    const params = {
      value: 'original',
      data: { key: 'config', required: false },
      colDef: { field: 'value' },
      node: { rowIndex: 0 },
    } as unknown as ICellRendererParams;

    const { rerender } = render(<StringEditorCellRenderer {...params} label="config" />);
    rerender(<StringEditorCellRenderer {...params} value="replacement" label="config" />);

    expect(screen.getByRole('textbox')).toHaveValue('replacement');
  });
});
