import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import BaseUrlControl from '@/src/components/BaseControls/BaseUrlControl/BaseUrlControl';
import { BasicI18nKey, EntitiesI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import * as validationContext from '@/src/context/SaveValidationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';

const Controlled = ({ initialValue, onChange }: { initialValue?: string; onChange: (value?: string) => void }) => {
  const [value, setValue] = useState(initialValue);
  return (
    <BaseUrlControl
      id="endpoint"
      label="Base URL"
      value={value}
      plugins={['first', 'other']}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
};

describe('BaseUrlControl', () => {
  test('starts empty in URL mode and switches sources with validation', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    expect(screen.getByRole('radiogroup', { name: 'Base URL' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: BasicI18nKey.URL })).toBeChecked();
    const urlInput = screen.getByRole('textbox', { name: BasicI18nKey.URL }) as HTMLInputElement;
    expect(urlInput).toBeInTheDocument();
    expect(urlInput.labels?.[0]).toHaveClass('sr-only');
    await user.click(screen.getByRole('radio', { name: BasicI18nKey.Plugin }));
    expect(screen.getByRole('radio', { name: BasicI18nKey.Plugin })).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(undefined);
    const pluginSelect = screen.getByRole('combobox', { name: BasicI18nKey.Plugin }) as HTMLInputElement;
    expect(pluginSelect).toBeInTheDocument();
    expect(pluginSelect.labels?.[0]).toHaveClass('sr-only');
  });

  test('allows switching source with the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await user.tab();
    expect(screen.getByRole('radio', { name: BasicI18nKey.URL })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: BasicI18nKey.Plugin })).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  test('selects a different plugin without carrying the previous suffix', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initialValue="dial-plugin://first/v2" onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: new RegExp(`^${BasicI18nKey.Plugin}`) }));
    await user.click(screen.getByRole('option', { name: 'dial-plugin://other' }));
    expect(onChange).toHaveBeenCalledWith('dial-plugin://other');
    expect(screen.getByText('dial-plugin://other')).toBeInTheDocument();
  });

  test('retains the suffix when the current plugin is selected again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initialValue="dial-plugin://first/v2" onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: new RegExp(`^${BasicI18nKey.Plugin}`) }));
    await user.click(screen.getByRole('option', { name: 'dial-plugin://first' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  test('clears a populated plugin when switching to URL', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled initialValue="dial-plugin://first/v2" onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: BasicI18nKey.URL }));
    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(screen.getByRole('textbox', { name: BasicI18nKey.URL })).toHaveValue('');
  });

  test('retains an absent plugin and its suffix when options load', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <BaseUrlControl id="endpoint" label="Base URL" value="dial-plugin://missing/v2" onChange={onChange} />,
    );
    expect(screen.getByRole('radio', { name: BasicI18nKey.Plugin })).toBeChecked();
    expect(screen.getByText('dial-plugin://missing')).toBeInTheDocument();
    rerender(
      <BaseUrlControl
        id="endpoint"
        label="Base URL"
        value="dial-plugin://missing/v2"
        plugins={['first']}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('dial-plugin://missing')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('rederives source from an external reset', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <BaseUrlControl id="endpoint" label="Base URL" value="dial-plugin://first/v2" onChange={onChange} />,
    );
    rerender(<BaseUrlControl id="endpoint" label="Base URL" value="https://example.com" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: BasicI18nKey.URL })).toBeChecked();
    expect(screen.getByRole('textbox', { name: BasicI18nKey.URL })).toHaveValue('https://example.com');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('restores URL mode on validation reset even when the value stays empty', async () => {
    const user = userEvent.setup();
    const context = useSaveValidationContext();
    const hook = vi.spyOn(validationContext, 'useSaveValidationContext');
    hook.mockReturnValue({ ...context, resetCounter: 0 });
    const onChange = vi.fn();
    const { rerender } = render(<BaseUrlControl id="endpoint" label="Base URL" onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: BasicI18nKey.Plugin }));
    expect(screen.getByRole('radio', { name: BasicI18nKey.Plugin })).toBeChecked();
    hook.mockReturnValue({ ...context, resetCounter: 1 });
    rerender(<BaseUrlControl id="endpoint" label="Base URL" onChange={onChange} />);
    expect(screen.getByRole('radio', { name: BasicI18nKey.URL })).toBeChecked();
    hook.mockRestore();
  });

  test('registers invalid required and malformed values and removes the field on unmount', () => {
    const { dispatch } = useSaveValidationContext();
    const { rerender, unmount } = render(<BaseUrlControl id="endpoint" label="Base URL" required onChange={vi.fn()} />);
    expect(dispatch).toHaveBeenCalledWith({ type: ValidationActionType.SetField, field: 'endpoint', isValid: false });
    expect(screen.getByText(ErrorI18nKey.RequiredField)).toBeInTheDocument();
    rerender(<BaseUrlControl id="endpoint" label="Base URL" value="dial-plugin:///v2" onChange={vi.fn()} />);
    expect(screen.getByText(ErrorI18nKey.PluginUrl)).toBeInTheDocument();
    unmount();
    expect(dispatch).toHaveBeenCalledWith({ type: ValidationActionType.RemoveField, field: 'endpoint' });
  });

  test('reports an option failure without modifying the retained value', () => {
    const onChange = vi.fn();
    render(
      <BaseUrlControl
        id="endpoint"
        label="Base URL"
        value="dial-plugin://missing/v2"
        optionsError={EntitiesI18nKey.OptionListPartial}
        plugins={['first']}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(EntitiesI18nKey.OptionListPartial);
    expect(screen.getByText('dial-plugin://missing')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('keeps surviving options selectable during a partial failure', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <BaseUrlControl
        id="endpoint"
        label="Base URL"
        value="dial-plugin://missing/v2"
        optionsError={EntitiesI18nKey.OptionListPartial}
        plugins={['first']}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('combobox', { name: new RegExp(`^${BasicI18nKey.Plugin}`) }));
    await user.click(screen.getByRole('option', { name: 'dial-plugin://first' }));
    expect(onChange).toHaveBeenCalledWith('dial-plugin://first');
  });

  test('announces total option failure and preserves the reference', () => {
    const onChange = vi.fn();
    render(
      <BaseUrlControl
        id="endpoint"
        label="Base URL"
        value="dial-plugin://missing/v2"
        optionsError={EntitiesI18nKey.OptionListUnavailable}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(EntitiesI18nKey.OptionListUnavailable);
    expect(screen.getByText('dial-plugin://missing')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('shows the complete raw value without interactive choices when read-only', () => {
    render(
      <BaseUrlControl id="endpoint" label="Base URL" value="dial-plugin://first/v2" isReadOnly onChange={vi.fn()} />,
    );
    expect(screen.getByRole('textbox', { name: 'Base URL' })).toHaveValue('dial-plugin://first/v2');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
