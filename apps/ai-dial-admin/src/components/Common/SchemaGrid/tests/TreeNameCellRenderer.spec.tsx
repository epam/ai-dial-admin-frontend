import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ICellRendererParams } from 'ag-grid-community';

import TreeNameCellRenderer from '../TreeNameCellRenderer';

// The renderer reads only the props each case sets; ag-grid's other cell params come from one typed fake.
const cellParams = {} as ICellRendererParams;

const data = { name: 'summary', type: 'string', depth: 0 };

describe('SchemaGrid :: TreeNameCellRenderer', () => {
  test('Should pass inputProps to the name input', () => {
    render(
      <TreeNameCellRenderer
        {...cellParams}
        data={data}
        onToggleExpand={vi.fn()}
        onChangeName={vi.fn()}
        inputProps={{ maxLength: 255 }}
      />,
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '255');
  });

  test('Should keep its own value and change handling over inputProps', () => {
    const onChangeName = vi.fn();
    const foreignOnChange = vi.fn();
    render(
      <TreeNameCellRenderer
        {...cellParams}
        data={data}
        onToggleExpand={vi.fn()}
        onChangeName={onChangeName}
        // A cast stands in for a caller that slips a grid-owned attribute past the type.
        inputProps={{ value: 'foreign', onChange: foreignOnChange } as object}
      />,
    );
    const input = screen.getByRole('textbox');

    expect(input).toHaveValue('summary');
    fireEvent.change(input, { target: { value: 'renamed' } });
    expect(onChangeName).toHaveBeenCalledWith('renamed', data);
    expect(foreignOnChange).not.toHaveBeenCalled();
  });
});
