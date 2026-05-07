import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import EditableCellRenderer from '../EditableCellRenderer';

vi.mock('@/public/images/icons/cell-triangle.svg', () => ({
  __esModule: true,
  default: () => <span>triangle</span>,
}));

describe('EditableCellRenderer', () => {
  const placeholder = 'Enter value';
  test('renders input with value and placeholder', () => {
    render(<EditableCellRenderer value="test" placeholder={placeholder} colDef={{}} data={{}} />);
    const input = screen.getByPlaceholderText(placeholder);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('test');
  });

  test('calls setValue and onChange on input change', () => {
    const setValue = vi.fn();
    const onChange = vi.fn();
    render(
      <EditableCellRenderer
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
    render(<EditableCellRenderer value="abc" valueFormatter={valueFormatter} colDef={{}} data={{}} />);
    expect(valueFormatter).toHaveBeenCalledWith('abc');
    expect(screen.getByDisplayValue('f:abc')).toBeInTheDocument();
  });

  test('calls setValue and onChange with formatted value', () => {
    const setValue = vi.fn();
    const onChange = vi.fn();
    const valueFormatter = (v: string) => `f:${v}`;
    render(
      <EditableCellRenderer
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
    render(<EditableCellRenderer value="abc" defaultValue={123} colDef={{}} data={{}} />);
    expect(screen.getByText('triangle')).toBeInTheDocument();
  });

  test('does not show triangle icon if defaultValue equals value', () => {
    render(<EditableCellRenderer value={123} defaultValue={123} colDef={{}} data={{}} />);
    expect(screen.queryByText('triangle')).toBeNull();
  });

  test('renders with null values with placeholder', () => {
    render(<EditableCellRenderer value={null} defaultValue={123} colDef={{}} data={{}} placeholder={placeholder} />);
    const input = screen.getByPlaceholderText(placeholder);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue(placeholder);
  });

  test('stopPropagation is called on Ctrl+A keydown', () => {
    render(<EditableCellRenderer value="hello" colDef={{}} data={{}} />);
    const input = screen.getByRole('textbox');
    const event = createEvent.keyDown(input, { key: 'a', ctrlKey: true });
    const spy = vi.spyOn(event, 'stopPropagation');
    fireEvent(input, event);
    expect(spy).toHaveBeenCalled();
  });

  test('stopPropagation is called on Cmd+A keydown', () => {
    render(<EditableCellRenderer value="hello" colDef={{}} data={{}} />);
    const input = screen.getByRole('textbox');
    const event = createEvent.keyDown(input, { key: 'a', metaKey: true });
    const spy = vi.spyOn(event, 'stopPropagation');
    fireEvent(input, event);
    expect(spy).toHaveBeenCalled();
  });

  test('stopPropagation is NOT called on plain keydown', () => {
    render(<EditableCellRenderer value="hello" colDef={{}} data={{}} />);
    const input = screen.getByRole('textbox');
    const event = createEvent.keyDown(input, { key: 'a' });
    const spy = vi.spyOn(event, 'stopPropagation');
    fireEvent(input, event);
    expect(spy).not.toHaveBeenCalled();
  });
});
