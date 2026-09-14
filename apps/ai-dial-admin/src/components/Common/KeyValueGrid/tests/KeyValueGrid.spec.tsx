import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, Mock, test, vi } from 'vitest';

import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import KeyValueGrid from '../KeyValueGrid';

describe('KeyValueGrid', () => {
  let mockOnChange: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChange = vi.fn();
  });

  test('shows one blank editable row when there is no data yet, with no Add click required', () => {
    render(<KeyValueGrid value={{}} onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Key)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Value)).toBeInTheDocument();
  });

  test('renders an input row per entry, with key/value populated', () => {
    render(<KeyValueGrid value={{ 'x-dial-cache-policy': 'cache-priority' }} onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('x-dial-cache-policy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('cache-priority')).toBeInTheDocument();
  });

  test('renders an Add button that is not present when disabled', () => {
    const { rerender } = render(<KeyValueGrid value={{}} onChange={mockOnChange} />);
    expect(screen.getByRole('button', { name: 'Buttons.Add' })).toBeInTheDocument();

    rerender(<KeyValueGrid value={{}} onChange={mockOnChange} disabled />);
    expect(screen.queryByRole('button', { name: 'Buttons.Add' })).not.toBeInTheDocument();
  });

  test('clicking Add appends an empty row', async () => {
    const user = userEvent.setup();
    render(<KeyValueGrid value={{ existing: 'value' }} onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: 'Buttons.Add' }));

    expect(screen.getAllByPlaceholderText(EntityPlaceholdersI18nKey.Key)).toHaveLength(2);
    // The new row's key is blank, so it's omitted from the emitted record.
    expect(mockOnChange).toHaveBeenCalledWith({ existing: 'value' });
  });

  test('typing into the blank row calls onChange, with no Add click required', async () => {
    const user = userEvent.setup();
    render(<KeyValueGrid value={{}} onChange={mockOnChange} />);

    await user.type(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Key), 'a');

    expect(mockOnChange).toHaveBeenLastCalledWith({ a: '' });
  });

  test('typing into a value input updates that row and calls onChange', async () => {
    const user = userEvent.setup();
    render(<KeyValueGrid value={{ a: '' }} onChange={mockOnChange} />);

    await user.type(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Value), '1');

    expect(mockOnChange).toHaveBeenLastCalledWith({ a: '1' });
  });

  test('removing a row drops it and calls onChange without it', async () => {
    const user = userEvent.setup();
    render(<KeyValueGrid value={{ a: '1', b: '2' }} onChange={mockOnChange} />);

    await user.click(screen.getAllByRole('button', { name: 'Buttons.Delete' })[0]);

    expect(mockOnChange).toHaveBeenCalledWith({ b: '2' });
  });

  test('removing the last remaining row leaves one blank row rather than none', async () => {
    const user = userEvent.setup();
    render(<KeyValueGrid value={{ a: '1' }} onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: 'Buttons.Delete' }));

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Key)).toBeInTheDocument();
    expect(mockOnChange).toHaveBeenLastCalledWith({});
  });

  test('does not render remove buttons when disabled', () => {
    render(<KeyValueGrid value={{ a: '1' }} onChange={mockOnChange} disabled />);

    expect(screen.queryByRole('button', { name: 'Buttons.Delete' })).not.toBeInTheDocument();
  });

  test('disables inputs when disabled', () => {
    render(<KeyValueGrid value={{ a: '1' }} onChange={mockOnChange} disabled />);

    expect(screen.getByDisplayValue('a')).toBeDisabled();
    expect(screen.getByDisplayValue('1')).toBeDisabled();
  });

  test('renders the provided label', () => {
    render(<KeyValueGrid value={{}} onChange={mockOnChange} label="Default headers" />);

    expect(screen.getByText('Default headers')).toBeInTheDocument();
  });
});
