import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from './Checkbox';

describe('Common components - Checkbox', () => {
  it('renders checked checkbox', () => {
    render(<Checkbox checked={true} id="checkbox" />);

    const input = screen.getByRole('checkbox');

    expect(input).toBeInTheDocument();
    expect(input).toBeChecked();
  });

  it('renders unchecked checkbox and no svg icon', () => {
    render(<Checkbox checked={false} id="checkbox" />);

    const input = screen.getByRole('checkbox');

    expect(input).toBeInTheDocument();
    expect(input).not.toBeChecked();
    expect(document.querySelectorAll('svg').length).toBe(0);
  });

  it('calls onChange when clicked', async () => {
    let value = false;
    const onChange = (v?: boolean) => {
      value = !!v;
    };

    render(<Checkbox id="testInput" checked={value} onChange={onChange} />);

    const input = screen.getByRole('checkbox');

    expect(input).not.toBeChecked();
    await userEvent.click(input);
    expect(value).toBeTruthy();
  });

  it('returns checked checkbox id on change', async () => {
    let checkboxId: string | undefined = undefined;
    const onChange = (_v?: boolean, id?: string) => {
      checkboxId = id;
    };
    render(<Checkbox id="testInput" checked={true} onChange={onChange} />);
    const input = screen.getByRole('checkbox');
    await userEvent.click(input);
    expect(checkboxId).toEqual('testInput');
  });
});
