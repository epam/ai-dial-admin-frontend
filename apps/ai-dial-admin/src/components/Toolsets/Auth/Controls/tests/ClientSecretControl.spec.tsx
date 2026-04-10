import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ValidationActionType } from '@/src/context/SaveValidationContext';
import ClientSecretControl from '../ClientSecretControl';

const mockDispatch = vi.fn();

vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ dispatch: mockDispatch }),
  ValidationActionType: {
    SetField: 'SetField',
  },
}));

vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string) => key,
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
