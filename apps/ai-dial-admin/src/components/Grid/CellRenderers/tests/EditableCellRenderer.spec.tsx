import { ICellRendererParams } from 'ag-grid-community';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import EditableCellRenderer from '../EditableCellRenderer';

vi.mock('@/public/images/icons/cell-triangle.svg', () => ({
  __esModule: true,
  default: () => <span>triangle</span>,
}));

// The renderer reads only the props each case sets; ag-grid's other cell params come from one
// typed fake.
const cellParams = {} as ICellRendererParams;

describe('EditableCellRenderer', () => {
  const placeholder = 'Enter value';
  test('renders input with value and placeholder', () => {
    render(<EditableCellRenderer {...cellParams} value="test" placeholder={placeholder} colDef={{}} data={{}} />);
    const input = screen.getByPlaceholderText(placeholder);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('test');
  });

  test('calls setValue and onChange on input change', () => {
    const setValue = vi.fn();
    const onChange = vi.fn();
    render(
      <EditableCellRenderer
        {...cellParams}
        value="old"
        colDef={{ field: 'col1' }}
        data={{ foo: 1 }}
        setValue={setValue}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new' } });
    expect(input).toHaveValue('new');
    expect(setValue).toHaveBeenCalledWith('new');
    expect(onChange).toHaveBeenCalledWith('new', { foo: 1 }, 'col1', void 0);
  });

  test('uses valueFormatter if provided', () => {
    const valueFormatter = vi.fn((v) => `f:${v}`);
    render(<EditableCellRenderer {...cellParams} value="abc" valueFormatter={valueFormatter} colDef={{}} data={{}} />);
    expect(valueFormatter).toHaveBeenCalledWith('abc');
    expect(screen.getByDisplayValue('f:abc')).toBeInTheDocument();
  });

  test('calls setValue and onChange with formatted value', () => {
    const setValue = vi.fn();
    const onChange = vi.fn();
    const valueFormatter = (v: number | string) => `f:${v}`;
    render(
      <EditableCellRenderer
        {...cellParams}
        value="abc"
        valueFormatter={valueFormatter}
        setValue={setValue}
        onChange={onChange}
        colDef={{ field: 'col2' }}
        data={{ bar: 2 }}
      />,
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'xyz' } });
    expect(setValue).toHaveBeenCalledWith('f:xyz');
    expect(onChange).toHaveBeenCalledWith('f:xyz', { bar: 2 }, 'col2', void 0);
  });

  test('shows triangle icon if defaultValue is set and not equal to value', () => {
    render(<EditableCellRenderer {...cellParams} value="abc" defaultValue={123} colDef={{}} data={{}} />);
    expect(screen.getByText('triangle')).toBeInTheDocument();
  });

  test('does not show triangle icon if defaultValue equals value', () => {
    render(<EditableCellRenderer {...cellParams} value={123} defaultValue={123} colDef={{}} data={{}} />);
    expect(screen.queryByText('triangle')).toBeNull();
  });

  test('renders with null values with placeholder', () => {
    render(
      <EditableCellRenderer
        {...cellParams}
        {...cellParams}
        value={null}
        defaultValue={123}
        colDef={{}}
        data={{}}
        placeholder={placeholder}
      />,
    );
    const input = screen.getByPlaceholderText(placeholder);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(placeholder);
  });

  test('stopPropagation is called on Ctrl+A keydown', () => {
    render(<EditableCellRenderer {...cellParams} value="hello" colDef={{}} data={{}} />);
    const input = screen.getByRole('textbox');
    const event = createEvent.keyDown(input, { key: 'a', ctrlKey: true });
    const spy = vi.spyOn(event, 'stopPropagation');
    fireEvent(input, event);
    expect(spy).toHaveBeenCalled();
  });

  test('stopPropagation is called on Cmd+A keydown', () => {
    render(<EditableCellRenderer {...cellParams} value="hello" colDef={{}} data={{}} />);
    const input = screen.getByRole('textbox');
    const event = createEvent.keyDown(input, { key: 'a', metaKey: true });
    const spy = vi.spyOn(event, 'stopPropagation');
    fireEvent(input, event);
    expect(spy).toHaveBeenCalled();
  });

  test('stopPropagation is NOT called on plain keydown', () => {
    render(<EditableCellRenderer {...cellParams} value="hello" colDef={{}} data={{}} />);
    const input = screen.getByRole('textbox');
    const event = createEvent.keyDown(input, { key: 'a' });
    const spy = vi.spyOn(event, 'stopPropagation');
    fireEvent(input, event);
    expect(spy).not.toHaveBeenCalled();
  });

  test('right-aligns the input when isRightAligned is set', () => {
    render(<EditableCellRenderer {...cellParams} value="42" colDef={{}} data={{}} isRightAligned />);
    expect(screen.getByRole('textbox')).toHaveClass('text-right');
  });

  test('does not right-align the input by default', () => {
    render(<EditableCellRenderer {...cellParams} value="42" colDef={{}} data={{}} />);
    expect(screen.getByRole('textbox')).not.toHaveClass('text-right');
  });

  test('right-aligns the read-only value when isRightAligned is set', () => {
    render(<EditableCellRenderer {...cellParams} value="42" colDef={{}} data={{}} isReadonly isRightAligned />);
    expect(screen.getByText('42')).toHaveClass('text-right');
  });

  test('does not right-align the read-only value by default', () => {
    render(<EditableCellRenderer {...cellParams} value="42" colDef={{}} data={{}} isReadonly />);
    expect(screen.getByText('42')).not.toHaveClass('text-right');
  });
});
