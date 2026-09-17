import { describe, expect, test, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import SingleValueAutocomplete from '../SingleValueAutocomplete';

const availableItems = [
  { label: 'cachedReadTokens', value: 'cachedReadTokens' },
  { label: 'serviceTier', value: 'serviceTier' },
  { label: 'ttl', value: 'ttl' },
];

const renderAutocomplete = (props?: Partial<Parameters<typeof SingleValueAutocomplete>[0]>) =>
  render(
    <SingleValueAutocomplete
      value=""
      availableItems={availableItems}
      onChange={vi.fn()}
      placeholder="Standard field or $path"
      {...props}
    />,
  );

const typeIntoInput = async (text: string) => {
  const input = screen.getByRole('textbox');
  await userEvent.type(input, text);
  return input;
};

describe('SingleValueAutocomplete', () => {
  test('renders the selected value as a removable tag', () => {
    renderAutocomplete({ value: 'ttl' });

    expect(screen.getByText('ttl')).toBeTruthy();
    expect(screen.getByRole('button')).toBeTruthy();
  });

  test('narrowes suggestions while typing', async () => {
    renderAutocomplete();

    await typeIntoInput('ser');

    expect(screen.getByText('SERVICETIER')).toBeTruthy();
    expect(screen.queryByText('CACHEDREADTOKENS')).toBeNull();
    expect(screen.queryByText('TTL')).toBeNull();
  });

  test('commits the clicked suggestion', async () => {
    const onChange = vi.fn();
    renderAutocomplete({ onChange });

    await typeIntoInput('tt');
    await userEvent.click(screen.getByText('TTL'));

    expect(onChange).toHaveBeenCalledWith('ttl');
  });

  test('commits free text that matches no suggestion', async () => {
    const onChange = vi.fn();
    renderAutocomplete({ onChange });

    await typeIntoInput('$.usage.ttl');
    await userEvent.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('$.usage.ttl');
  });

  test('selects the highlighted suggestion with the keyboard', async () => {
    const onChange = vi.fn();
    renderAutocomplete({ onChange });

    await typeIntoInput('tt');
    await userEvent.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('ttl');
  });

  test('removing the tag clears the value', async () => {
    const onChange = vi.fn();
    renderAutocomplete({ value: 'ttl', onChange });

    await userEvent.click(screen.getByRole('button'));

    expect(onChange).toHaveBeenCalledWith('');
  });

  test('hides suggestions on Escape', async () => {
    renderAutocomplete();

    await typeIntoInput('tt');
    expect(screen.getByText('TTL')).toBeTruthy();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('TTL')).toBeNull();
  });

  test('disables the input when disabled', () => {
    renderAutocomplete({ disabled: true });

    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
