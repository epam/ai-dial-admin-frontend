import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ICellRendererParams } from 'ag-grid-community';

import FileSelectCellRenderer from '../FileSelectCellRenderer';

vi.mock('@/src/components/Common/FileSelectInput/FileSelectInput', () => ({
  default: ({ value, onChangeValue }: any) => (
    <input aria-label="file-input" value={value ?? ''} onChange={(e) => onChangeValue(e.target.value)} />
  ),
}));

// The renderer reads only the members each case sets; the rest of `ICellRendererParams` is grid-supplied.
const cellParams = {} as ICellRendererParams;
const mockNode = { rowIndex: 0 } as unknown as ICellRendererParams['node'];

describe('FileSelectCellRenderer', () => {
  test('displays the newly selected file path immediately, before the grid row is refreshed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const setValue = vi.fn();
    const row = { data: { file: 'old/path.csv' } };

    render(
      <FileSelectCellRenderer
        {...cellParams}
        value="old/path.csv"
        data={row}
        colDef={{ field: 'file' }}
        node={mockNode}
        onChange={onChange}
        setValue={setValue}
      />,
    );

    const input = screen.getByLabelText('file-input');
    expect(input).toHaveValue('old/path.csv');

    await user.clear(input);
    await user.type(input, 'new/path.csv');

    expect(input).toHaveValue('new/path.csv');
    expect(onChange).toHaveBeenCalledWith('new/path.csv', row, 'file', 0);
    expect(setValue).toHaveBeenCalledWith('new/path.csv');
  });

  test('keeps the selected file path when the grid row stays stale', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const row = { data: { file: 'old/path.csv' } };

    const { rerender } = render(
      <FileSelectCellRenderer
        {...cellParams}
        value="old/path.csv"
        data={row}
        colDef={{ field: 'file' }}
        node={mockNode}
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText('file-input');
    await user.clear(input);
    await user.type(input, 'new/path.csv');
    expect(input).toHaveValue('new/path.csv');

    rerender(
      <FileSelectCellRenderer
        {...cellParams}
        value="old/path.csv"
        data={row}
        colDef={{ field: 'file' }}
        node={mockNode}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText('file-input')).toHaveValue('new/path.csv');
  });

  test('takes the incoming value when the grid row is replaced', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <FileSelectCellRenderer
        {...cellParams}
        value="old/path.csv"
        data={{ data: { file: 'old/path.csv' } }}
        colDef={{ field: 'file' }}
        node={mockNode}
        onChange={onChange}
      />,
    );

    const input = screen.getByLabelText('file-input');
    await user.clear(input);
    await user.type(input, 'new/path.csv');
    expect(input).toHaveValue('new/path.csv');

    rerender(
      <FileSelectCellRenderer
        {...cellParams}
        value="old/path.csv"
        data={{ data: { file: 'old/path.csv' } }}
        colDef={{ field: 'file' }}
        node={mockNode}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText('file-input')).toHaveValue('old/path.csv');
  });
});
