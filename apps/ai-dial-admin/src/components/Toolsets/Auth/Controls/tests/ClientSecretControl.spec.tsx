import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { ValidationActionType } from '@/src/context/SaveValidationContext';
import ClientSecretControl from '../ClientSecretControl';

const mockDispatch = vi.fn();

vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ dispatch: mockDispatch }),
  ValidationActionType: {
    SetField: 'SetField',
  },
}));

describe('ClientSecretControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with label "Client Secret" and required indicator', () => {
    render(<ClientSecretControl clientSecret="test-secret" />);

    const input = screen.getByLabelText(/EntityFields\.clientSecret/i);
    expect(input).toBeInTheDocument();
  });

  test('shows error when clientSecret is empty', () => {
    render(<ClientSecretControl clientSecret="" />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: false,
    });
  });

  test('calls onChange with trimmed value', () => {
    const onChange = vi.fn();
    render(<ClientSecretControl clientSecret="" onChange={onChange} />);

    const input = screen.getByLabelText(/EntityFields\.clientSecret/i);
    fireEvent.change(input, { target: { value: '  secret-key  ' } });

    expect(onChange).toHaveBeenCalledWith('secret-key  ');
  });

  test('dispatches validation to SaveValidationContext', () => {
    render(<ClientSecretControl clientSecret="valid-secret" />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: true,
    });
  });

  test('validates on mount', () => {
    render(<ClientSecretControl clientSecret="" />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: false,
    });
  });

  test('skips dispatch when isLoggedIn=true', () => {
    mockDispatch.mockClear();
    render(<ClientSecretControl clientSecret="" isLoggedIn={true} />);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('shows validation error for empty value', () => {
    render(<ClientSecretControl clientSecret="" />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: false,
    });
  });

  test('clears error when valid value is entered', () => {
    const onChange = vi.fn();
    render(<ClientSecretControl clientSecret="" onChange={onChange} />);

    const input = screen.getByLabelText(/EntityFields\.clientSecret/i);
    fireEvent.change(input, { target: { value: 'valid-secret' } });

    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: true,
    });
  });

  test('is disabled when disabled prop is true', () => {
    render(<ClientSecretControl clientSecret="test-secret" disabled={true} />);

    const input = screen.getByLabelText(/EntityFields\.clientSecret/i);
    expect(input).toBeDisabled();
  });
});

describe('ClientSecretControl — stored secret hint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows the masked placeholder and an empty value when a hint is present', () => {
    render(<ClientSecretControl clientSecret="" hasSecretHint />);

    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecretMasked);
    expect(input).toHaveValue('');
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret)).toBeNull();
  });

  test('treats an empty value as valid when a hint is present', () => {
    render(<ClientSecretControl clientSecret="" hasSecretHint />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: true,
    });
    expect(screen.queryByText('Error.RequiredField')).toBeNull();
  });

  test('still requires a value when there is no hint', () => {
    render(<ClientSecretControl clientSecret="" />);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret)).toBeInTheDocument();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: false,
    });
  });

  test('returns to the valid unchanged state when a typed secret is cleared', () => {
    const { rerender } = render(<ClientSecretControl clientSecret="typed-secret" hasSecretHint />);
    rerender(<ClientSecretControl clientSecret="" hasSecretHint />);

    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: true,
    });
  });
});

describe('ClientSecretControl — minLength', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('is invalid and shows the length error for a value below the minimum', () => {
    render(<ClientSecretControl clientSecret="short" minLength={8} />);

    expect(screen.getByText('Error.ClientSecretMinLength')).toBeInTheDocument();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: false,
    });
  });

  test('is invalid for a short typed value even when a hint is present', () => {
    render(<ClientSecretControl clientSecret="short" minLength={8} hasSecretHint />);

    expect(screen.getByText('Error.ClientSecretMinLength')).toBeInTheDocument();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: false,
    });
  });

  test('is valid for a value at the minimum', () => {
    render(<ClientSecretControl clientSecret="12345678" minLength={8} />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: true,
    });
  });

  test('accepts a short value when no minimum is given', () => {
    render(<ClientSecretControl clientSecret="short" />);

    expect(screen.queryByText('Error.ClientSecretMinLength')).toBeNull();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: true,
    });
  });
});
