import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { ButtonsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import CreateRoute from '../CreateRoute';

describe('CreateRoute', () => {
  const baseProps = {
    isModalOpen: true,
    onClose: vi.fn(),
    onCreate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal with display name input', () => {
    render(<CreateRoute {...baseProps} />);
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Create)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
  });

  test('Create button is enabled for valid alphanumeric name', () => {
    render(<CreateRoute {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'valid_Route1' },
    });
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).not.toBeDisabled();
  });

  test('shows error and disables Create button for name with hyphen', () => {
    render(<CreateRoute {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'my-route' },
    });
    expect(screen.getByText(ErrorI18nKey.AlphanumericUnderscore)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeDisabled();
  });

  test('shows error and disables Create button for name with space', () => {
    render(<CreateRoute {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'my route' },
    });
    expect(screen.getByText(ErrorI18nKey.AlphanumericUnderscore)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeDisabled();
  });

  test('error clears after correcting invalid name', () => {
    render(<CreateRoute {...baseProps} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName);

    fireEvent.change(input, { target: { value: 'my-route' } });
    expect(screen.getByText(ErrorI18nKey.AlphanumericUnderscore)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'my_route' } });
    expect(screen.queryByText(ErrorI18nKey.AlphanumericUnderscore)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).not.toBeDisabled();
  });

  test('calls onCreate with the entered name on submit', () => {
    render(<CreateRoute {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'myRoute' },
    });
    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));
    expect(baseProps.onCreate).toHaveBeenCalledWith('myRoute');
  });
});
