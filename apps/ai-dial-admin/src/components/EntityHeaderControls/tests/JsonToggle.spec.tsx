import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey } from '@/src/constants/i18n';

import JsonToggles from '../JsonToggle/JsonToggle';

describe('JsonToggles', () => {
  const getSwitch = () => screen.getByRole('switch', { name: EntitiesI18nKey.JSONEditor });

  test('renders a switch named by the JSON editor label', () => {
    render(<JsonToggles />);

    expect(getSwitch()).toBeTruthy();
  });

  test('is enabled by default', () => {
    render(<JsonToggles />);

    expect(getSwitch()).toBeEnabled();
  });

  test('is disabled when isEditorDisabled is set', () => {
    render(<JsonToggles isEditorDisabled />);

    expect(getSwitch()).toBeDisabled();
  });

  test('reflects whether the editor is enabled', () => {
    const { rerender } = render(<JsonToggles />);

    expect(getSwitch()).not.toBeChecked();

    rerender(<JsonToggles isEditorEnabled />);

    expect(getSwitch()).toBeChecked();
  });

  test('calls onToggleEditor when the switch is clicked', async () => {
    const user = userEvent.setup();
    const onToggleEditor = vi.fn();
    render(<JsonToggles onToggleEditor={onToggleEditor} />);

    await user.click(getSwitch());

    expect(onToggleEditor).toHaveBeenCalledOnce();
  });
});
