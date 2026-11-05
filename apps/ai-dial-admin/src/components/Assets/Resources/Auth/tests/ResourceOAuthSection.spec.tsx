import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { DialToolsetResourceAuthSettings, ToolsetAuthStatus, ToolsetAuthType } from '@/src/models/dial/resource';
import ResourceOAuthSection from '../ResourceOAuthSection';

const mockDispatch = vi.mocked(useSaveValidationContext().dispatch);

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

    expect(screen.getByText('Error.ClientSecretMinLength')).toBeTruthy();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: false,
    });
  });
});

describe('ResourceOAuthSection — resource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows the stored resource', () => {
    render(<ResourceOAuthSection authSettings={oauthSettings({ resource: 'https://mcp.example.com/mcp' })} />);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Resource)).toHaveValue('https://mcp.example.com/mcp');
  });

  test('does not require a resource', () => {
    render(<ResourceOAuthSection authSettings={oauthSettings()} />);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Resource)).toHaveValue('');
    expect(mockDispatch).not.toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'resource',
      isValid: false,
    });
  });

  test('reports an invalid resource URL to the save validation', () => {
    render(<ResourceOAuthSection authSettings={oauthSettings({ resource: 'not a url' })} />);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'resource',
      isValid: false,
    });
  });

  test('passes a typed resource to onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ResourceOAuthSection authSettings={oauthSettings()} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Resource), 'h');

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ resource: 'h' }));
  });

  test('passes an empty string, not undefined, when the resource is cleared', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ResourceOAuthSection authSettings={oauthSettings({ resource: 'https://a.io' })} onChange={onChange} />);

    await user.clear(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Resource));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ resource: '' }));
  });

  test('locks the resource field while signed in', () => {
    render(
      <ResourceOAuthSection
        authSettings={oauthSettings({ resource: 'https://a.io', global_auth_status: ToolsetAuthStatus.SIGNED_IN })}
      />,
    );

    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.Resource)).toBeNull();
    expect(screen.getByDisplayValue('https://a.io')).toBeDisabled();
  });
});
