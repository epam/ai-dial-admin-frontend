import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ValidationActionType } from '@/src/context/SaveValidationContext';
import ClientIdControl from '../ClientIdControl';

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

describe('ClientIdControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with label "Client ID" and required indicator', () => {
    render(<ClientIdControl clientId="test-id" />);

    const input = screen.getByLabelText(/EntityFields\.clientId/i);
    expect(input).toBeInTheDocument();
  });

  test('shows error when clientId is empty', () => {
    render(<ClientIdControl clientId="" />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientId',
      isValid: false,
    });
  });

  test('calls onChange with trimmed value', () => {
    const onChange = vi.fn();
    render(<ClientIdControl clientId="" onChange={onChange} />);

    const input = screen.getByLabelText(/EntityFields\.clientId/i);
    fireEvent.change(input, { target: { value: '  test-id  ' } });

    expect(onChange).toHaveBeenCalledWith('test-id  ');
  });

  test('dispatches validation to SaveValidationContext', () => {
    render(<ClientIdControl clientId="valid-id" />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientId',
      isValid: true,
    });
  });

  test('validates on mount', () => {
    render(<ClientIdControl clientId="" />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientId',
      isValid: false,
    });
  });

  test('skips dispatch when isLoggedIn=true', () => {
    mockDispatch.mockClear();
    render(<ClientIdControl clientId="" isLoggedIn={true} />);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('shows validation error for empty value', () => {
    render(<ClientIdControl clientId="" />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientId',
      isValid: false,
    });
  });

  test('clears error when valid value is entered', () => {
    const onChange = vi.fn();
    render(<ClientIdControl clientId="" onChange={onChange} />);

    const input = screen.getByLabelText(/EntityFields\.clientId/i);
    fireEvent.change(input, { target: { value: 'valid-id' } });

    expect(mockDispatch).toHaveBeenLastCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientId',
      isValid: true,
    });
  });

  test('is disabled when disabled prop is true', () => {
    render(<ClientIdControl clientId="test-id" disabled={true} />);

    const input = screen.getByLabelText(/EntityFields\.clientId/i);
    expect(input).toBeDisabled();
  });
});
