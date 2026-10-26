import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import AutocompleteInput from '@/src/components/Common/AutocompleteInput/AutocompleteInput';
import { AutocompleteInputProps } from '@/src/components/Common/AutocompleteInput/models';
import { BasicI18nKey } from '@/src/constants/i18n';

const suggestions = [
  { value: 'alpha', label: 'alpha' },
  { value: 'beta', label: 'beta' },
  { value: 'alphabet', label: 'alphabet' },
];

const ControlledAutocomplete = ({ value: initialValue = '', ...props }: Partial<AutocompleteInputProps>) => {
  const [value, setValue] = useState(initialValue);
  return (
    <AutocompleteInput
      id="field"
      labelProps={{ label: 'Field' }}
      suggestions={suggestions}
      {...props}
      value={value}
      onChange={(text) => {
        setValue(text);
        props.onChange?.(text);
      }}
    />
  );
};

const renderAutocomplete = (props: Partial<AutocompleteInputProps> = {}) => {
  const user = userEvent.setup();
  render(
    <>
      <ControlledAutocomplete {...props} />
      <button type="button">outside</button>
    </>,
  );
  return { user, input: screen.getByRole('combobox') };
};

const optionLabels = () => screen.queryAllByRole('option').map((option) => option.textContent);

describe('AutocompleteInput', () => {
  describe('typed text', () => {
    test('accepts a value that matches no suggestion', async () => {
      const onChange = vi.fn();
      const { user, input } = renderAutocomplete({ onChange });

      await user.type(input, 'my-custom-name');

      expect(onChange).toHaveBeenLastCalledWith('my-custom-name');
      expect((input as HTMLInputElement).value).toBe('my-custom-name');
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    test('drops leading whitespace', async () => {
      const onChange = vi.fn();
      const { user, input } = renderAutocomplete({ onChange });

      await user.type(input, '  name');

      expect(onChange).toHaveBeenLastCalledWith('name');
    });

    test('shows a value passed from outside', () => {
      const { rerender } = render(
        <AutocompleteInput id="field" value="first" suggestions={suggestions} onChange={vi.fn()} />,
      );
      rerender(<AutocompleteInput id="field" value="second" suggestions={suggestions} onChange={vi.fn()} />);

      expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('second');
    });
  });

  describe('suggestion list', () => {
    test('typed text filters the list', async () => {
      const { user, input } = renderAutocomplete();

      await user.type(input, 'alp');

      expect(optionLabels()).toEqual(['alpha', 'alphabet']);
      expect(input.getAttribute('aria-expanded')).toBe('true');
    });

    test('shows every suggestion when filtering is off', async () => {
      const { user, input } = renderAutocomplete({ shouldFilterSuggestions: false });

      await user.type(input, 'zzz');

      expect(optionLabels()).toEqual(['alpha', 'beta', 'alphabet']);
    });

    test('caps the list at maxSuggestions', async () => {
      const { user, input } = renderAutocomplete({ maxSuggestions: 1 });

      await user.type(input, 'a');

      expect(optionLabels()).toEqual(['alpha']);
    });

    test('shows nothing when nothing matches', async () => {
      const { user, input } = renderAutocomplete();

      await user.type(input, 'zzz');

      expect(screen.queryByRole('listbox')).toBeNull();
      expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    test('does not open on focus by default', async () => {
      const { user, input } = renderAutocomplete();

      await user.click(input);

      expect(screen.queryByRole('listbox')).toBeNull();
    });

    test('opens on focus with every suggestion when the field is empty', async () => {
      const { user, input } = renderAutocomplete({ openOnFocus: true, maxSuggestions: 1 });

      await user.click(input);

      expect(optionLabels()).toEqual(['alpha', 'beta', 'alphabet']);
    });

    test('names the list after the field label', async () => {
      const { user, input } = renderAutocomplete({ openOnFocus: true });

      await user.click(input);

      expect(screen.getByRole('listbox', { name: 'Field' })).toBeTruthy();
    });
  });

  describe('picking a suggestion', () => {
    test('a click reports the option and closes the list', async () => {
      const onSelect = vi.fn();
      const onCommit = vi.fn();
      const { user, input } = renderAutocomplete({ onSelect, onCommit, openOnFocus: true });

      await user.click(input);
      await user.click(screen.getByRole('option', { name: 'beta' }));

      expect(onSelect).toHaveBeenCalledWith({ value: 'beta', label: 'beta' });
      expect(screen.queryByRole('listbox')).toBeNull();
      expect(document.activeElement).toBe(input);
    });

    test('without onSelect a pick reports the option value as the text', async () => {
      const onChange = vi.fn();
      const { user, input } = renderAutocomplete({ onChange, openOnFocus: true });

      await user.click(input);
      await user.click(screen.getByRole('option', { name: 'alphabet' }));

      expect(onChange).toHaveBeenLastCalledWith('alphabet');
      expect((input as HTMLInputElement).value).toBe('alphabet');
    });

    test('Enter picks the highlighted suggestion', async () => {
      const onSelect = vi.fn();
      const { user, input } = renderAutocomplete({ onSelect });

      await user.type(input, 'alp');
      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

      expect(onSelect).toHaveBeenCalledWith({ value: 'alphabet', label: 'alphabet' });
    });

    test('a press on the list outside a row keeps focus and the list open', async () => {
      const onCommit = vi.fn();
      const { user, input } = renderAutocomplete({ onCommit, openOnFocus: true });

      await user.click(input);
      await user.pointer({ keys: '[MouseLeft]', target: screen.getByRole('listbox') });

      expect(document.activeElement).toBe(input);
      expect(screen.getByRole('listbox')).toBeTruthy();
      expect(onCommit).not.toHaveBeenCalled();
    });

    test('leaving the field after a pick does not commit it again', async () => {
      const onCommit = vi.fn();
      const { user, input } = renderAutocomplete({ onCommit, openOnFocus: true });

      await user.click(input);
      await user.click(screen.getByRole('option', { name: 'beta' }));
      await user.click(screen.getByRole('button', { name: 'outside' }));

      expect(onCommit).not.toHaveBeenCalled();
    });
  });

  describe('commit on leave', () => {
    test('blur commits the typed text', async () => {
      const onCommit = vi.fn();
      const { user, input } = renderAutocomplete({ onCommit });

      await user.type(input, 'org/server');
      await user.tab();

      expect(onCommit).toHaveBeenCalledOnce();
      expect(onCommit).toHaveBeenCalledWith('org/server');
    });

    test('Enter with nothing highlighted commits without submitting the form', async () => {
      const onCommit = vi.fn();
      const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={onSubmit}>
          <ControlledAutocomplete onCommit={onCommit} />
        </form>,
      );
      const input = screen.getByRole('combobox');

      await user.type(input, 'alp');
      await user.keyboard('{Enter}');
      await user.tab();

      expect(onCommit).toHaveBeenCalledOnce();
      expect(onCommit).toHaveBeenCalledWith('alp');
      expect(onSubmit).not.toHaveBeenCalled();
    });

    test('an edit after a pick commits again on blur', async () => {
      const onCommit = vi.fn();
      const { user, input } = renderAutocomplete({ onCommit, openOnFocus: true });

      await user.click(input);
      await user.click(screen.getByRole('option', { name: 'beta' }));
      await user.type(input, 'x');
      await user.tab();

      expect(onCommit).toHaveBeenCalledWith('betax');
    });
  });

  describe('keyboard and ARIA', () => {
    test('arrow keys move the highlight and wrap at the ends', async () => {
      const { user, input } = renderAutocomplete({ openOnFocus: true });

      await user.click(input);
      await user.keyboard('{ArrowDown}');
      const [first, , third] = screen.getAllByRole('option');
      expect(input.getAttribute('aria-activedescendant')).toBe(first.id);
      expect(first.getAttribute('aria-selected')).toBe('true');

      await user.keyboard('{ArrowUp}');
      expect(input.getAttribute('aria-activedescendant')).toBe(third.id);
    });

    test('Arrow Down opens a closed list', async () => {
      const { user, input } = renderAutocomplete({ value: 'alp' });

      input.focus();
      await user.keyboard('{ArrowDown}');

      expect(optionLabels()).toEqual(['alpha', 'alphabet']);
    });

    test('typing highlights nothing', async () => {
      const { user, input } = renderAutocomplete();

      await user.type(input, 'alp');

      expect(input.getAttribute('aria-activedescendant')).toBeNull();
    });

    test('Escape closes the list and keeps the value', async () => {
      const { user, input } = renderAutocomplete();

      await user.type(input, 'alp');
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).toBeNull();
      expect((input as HTMLInputElement).value).toBe('alp');
    });

    test('Escape on an open list does not reach a surrounding dismiss listener', async () => {
      const onDocumentKeyDown = vi.fn();
      document.addEventListener('keydown', onDocumentKeyDown);
      const { user, input } = renderAutocomplete();

      await user.type(input, 'alp');
      onDocumentKeyDown.mockClear();
      await user.keyboard('{Escape}');
      expect(onDocumentKeyDown).not.toHaveBeenCalled();

      await user.keyboard('{Escape}');
      expect(onDocumentKeyDown).toHaveBeenCalledOnce();
      document.removeEventListener('keydown', onDocumentKeyDown);
    });

    test('hover highlights a row', async () => {
      const { user, input } = renderAutocomplete({ openOnFocus: true });

      await user.click(input);
      await user.hover(screen.getByRole('option', { name: 'beta' }));

      expect(screen.getByRole('option', { name: 'beta' }).getAttribute('aria-selected')).toBe('true');
    });

    test('exposes the combobox contract', () => {
      renderAutocomplete();
      const input = screen.getByRole('combobox', { name: 'Field' });

      expect(input.getAttribute('aria-autocomplete')).toBe('list');
      expect(input.getAttribute('aria-controls')).toBe('field-listbox');
    });

    test('a disabled field opens no list and cannot be edited', async () => {
      const onChange = vi.fn();
      const { user, input } = renderAutocomplete({ disabled: true, openOnFocus: true, onChange });

      await user.click(input);
      await user.type(input, 'a');

      expect(screen.queryByRole('listbox')).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    test('a read-only field opens no list', async () => {
      const { user, input } = renderAutocomplete({ readOnly: true, openOnFocus: true });

      await user.click(input);

      expect(screen.queryByRole('listbox')).toBeNull();
    });

    test('shows a spinner and marks the field busy while suggestions load', () => {
      renderAutocomplete({ isLoading: true });

      expect(screen.getByRole('img', { name: BasicI18nKey.Loading })).toBeTruthy();
      expect(screen.getByRole('combobox').getAttribute('aria-busy')).toBe('true');
    });

    test('shows no spinner when nothing loads', () => {
      renderAutocomplete();

      expect(screen.queryByRole('img', { name: BasicI18nKey.Loading })).toBeNull();
      expect(screen.getByRole('combobox').getAttribute('aria-busy')).toBeNull();
    });

    test('shows the error and marks the input invalid', () => {
      renderAutocomplete({ error: 'Required' });

      expect(screen.getByText('Required')).toBeTruthy();
      expect(screen.getByRole('combobox').getAttribute('aria-invalid')).toBe('true');
    });
  });
});
