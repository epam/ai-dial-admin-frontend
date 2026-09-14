import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import InterfaceDefaultsButton from '../InterfaceDefaultsButton';

describe('InterfaceDefaultsButton', () => {
  test('does not show the popup until the Defaults button is clicked', () => {
    render(<InterfaceDefaultsButton fieldId="row-1" value={{}} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Defaults })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opening the popup shows the current defaults as JSON', async () => {
    const user = userEvent.setup();
    render(<InterfaceDefaultsButton fieldId="row-1" value={{ temperature: 1.2 }} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Defaults }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/"temperature": 1.2/)).toBeInTheDocument();
  });

  test('applying without edits calls onChange with the parsed committed value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InterfaceDefaultsButton fieldId="row-1" value={{ seed: 42 }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Defaults }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));

    expect(onChange).toHaveBeenCalledWith({ seed: 42 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('cancelling closes the popup without calling onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InterfaceDefaultsButton fieldId="row-1" value={{ seed: 42 }} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Defaults }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('disables the button when disabled', () => {
    render(<InterfaceDefaultsButton fieldId="row-1" value={{}} disabled onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Defaults })).toBeDisabled();
  });
});
