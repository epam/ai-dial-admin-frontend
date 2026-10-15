import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { ValidationActionType } from '@/src/context/SaveValidationContext';
import { DialToolsetResourceAuthSettings, ToolsetAuthType } from '@/src/models/dial/resource';
import ResourceOAuthSection from '../ResourceOAuthSection';

const mockDispatch = vi.fn();

vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ dispatch: mockDispatch }),
  ValidationActionType: {
    SetField: 'SetField',
  },
}));

const oauthSettings = (overrides: Partial<DialToolsetResourceAuthSettings> = {}): DialToolsetResourceAuthSettings => ({
  authentication_type: ToolsetAuthType.OAUTH,
  client_id: 'client-id',
  ...overrides,
});

describe('ResourceOAuthSection — client secret', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows the masked placeholder and no required error when Core returned a hint', () => {
    render(<ResourceOAuthSection authSettings={oauthSettings({ client_secret_hint: 'cret' })} />);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecretMasked)).toHaveValue('');
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: true,
    });
  });

  test('requires a client secret when there is no hint', () => {
    render(<ResourceOAuthSection authSettings={oauthSettings()} />);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret)).toHaveValue('');
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: false,
    });
  });

  test('rejects a typed client secret shorter than the Core minimum', () => {
    render(<ResourceOAuthSection authSettings={oauthSettings({ client_secret: 'short' })} />);

    expect(screen.getByText('Error.ClientSecretMinLength')).toBeInTheDocument();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: false,
    });
  });
});
