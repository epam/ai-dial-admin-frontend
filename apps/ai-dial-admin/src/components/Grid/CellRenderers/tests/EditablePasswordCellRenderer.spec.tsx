import { ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import EditablePasswordCellRenderer from '../EditablePasswordCellRenderer';

// The renderer reads only the props each case sets; ag-grid's other cell params come from one typed fake.
const cellParams = {} as ICellRendererParams;

const LABEL = 'Client secret for github';
const colDef = { field: 'clientSecret' };
const node = { id: '7', rowIndex: 3 } as ICellRendererParams['node'];
const data = { assetName: 'github' };

const renderCell = (props: Partial<React.ComponentProps<typeof EditablePasswordCellRenderer>> = {}) =>
  render(
    <EditablePasswordCellRenderer
      {...cellParams}
      value="REPLACE_WITH_REAL_SECRET"
      colDef={colDef}
      node={node}
      data={data}
      getInputLabel={() => LABEL}
      {...props}
    />,
  );

describe('EditablePasswordCellRenderer', () => {
  test('masks the value, names the input per row and opts out of browser autofill', () => {
    renderCell();

    const input = screen.getByLabelText(LABEL);
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveValue('REPLACE_WITH_REAL_SECRET');
    expect(input).toHaveAttribute('autocomplete', 'new-password');
  });

  test('reveals and hides the value through the toggle', async () => {
    const user = userEvent.setup();
    renderCell();

    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(screen.getByLabelText(LABEL)).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(screen.getByLabelText(LABEL)).toHaveAttribute('type', 'password');
  });

  test('reports each edit with the row data, field and row index', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderCell({ value: '', onChange });

    await user.type(screen.getByLabelText(LABEL), 'ab');

    expect(onChange).toHaveBeenLastCalledWith('ab', data, 'clientSecret', 3);
    expect(screen.getByLabelText(LABEL)).toHaveValue('ab');
  });

  test('reports a cleared value as an empty string', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderCell({ onChange });

    await user.clear(screen.getByLabelText(LABEL));

    expect(onChange).toHaveBeenLastCalledWith('', data, 'clientSecret', 3);
  });

  test('follows the grid value when it changes', () => {
    const { rerender } = renderCell({ value: 'first' });

    rerender(
      <EditablePasswordCellRenderer
        {...cellParams}
        value="second"
        colDef={colDef}
        node={node}
        data={data}
        getInputLabel={() => LABEL}
      />,
    );

    expect(screen.getByLabelText(LABEL)).toHaveValue('second');
  });

  test('shows the value in no tooltip', async () => {
    const user = userEvent.setup();
    renderCell();

    await user.hover(screen.getByLabelText(LABEL));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(screen.queryByText('REPLACE_WITH_REAL_SECRET')).not.toBeInTheDocument();
  });
});
