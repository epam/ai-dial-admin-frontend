import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import EditableTitle from './EditableTitle';

const setup = (props: Record<string, unknown> = {}) => {
  const changeTitle = vi.fn();
  const utils = render(
    <EditableTitle title="My title" changeTitle={changeTitle} size={1} {...props}>
      <span data-testid="child-node">•</span>
    </EditableTitle>,
  );
  return { changeTitle, ...utils };
};

describe('Common components – EditableTitle', () => {
  test('renders title and children in display mode', () => {
    setup({ size: 2 });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('My title');
    expect(screen.getByTestId('child-node')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('enters edit mode on click and focuses input', async () => {
    setup({ size: 3 });

    await userEvent.click(screen.getByRole('heading', { level: 3 }));

    const input = screen.getByRole<HTMLInputElement>('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('My title');
    expect(input).toHaveFocus();
  });

  test('calls changeTitle for each keystroke', async () => {
    const { changeTitle } = setup();

    await userEvent.click(screen.getByRole('heading', { level: 1 }));
    const input = screen.getByRole<HTMLInputElement>('textbox');

    await userEvent.type(input, '1');

    expect(changeTitle).toHaveBeenCalledTimes(1);
    expect(changeTitle).toHaveBeenLastCalledWith('My title1');
  });

  test('exits edit mode on blur', async () => {
    setup();
    await userEvent.click(screen.getByRole('heading', { level: 1 }));

    const input = screen.getByRole('textbox');
    input.blur();

    await waitFor(() => {
      expect(screen.queryByRole('textbox')).toBeNull();
    });
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('exits edit mode on Enter key', async () => {
    setup();
    await userEvent.click(screen.getByRole('heading', { level: 1 }));

    const input = screen.getByRole<HTMLInputElement>('textbox');
    await userEvent.type(input, '{enter}');

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('clamps size below 1 to h1', () => {
    setup({ size: 0 });
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  test('clamps size above 6 to h6', () => {
    setup({ size: 10 });
    expect(screen.getByRole('heading', { level: 6 })).toBeInTheDocument();
  });
});
