import { ToolsetAuthSettings, ToolsetAuthStatus, ToolsetAuthType } from '@/src/models/dial/toolset';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import OAuthSection from '../OAuthSection';

describe('OAuthSection', () => {
  test('renders all input fields with correct values', () => {
    const authSettings: ToolsetAuthSettings = {
      authenticationType: ToolsetAuthType.OAUTH,
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'redirect-uri',
      scopesSupported: ['scope1', 'scope2'],
      authorizationEndpoint: 'auth-endpoint',
      tokenEndpoint: 'token-endpoint',
      codeChallengeMethod: 'S256',
    };
    render(<OAuthSection authSettings={authSettings} view={ApplicationRoute.Toolsets} />);
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientId)).toHaveValue('client-id');
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret)).toHaveValue('client-secret');
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.AuthorizationEndpoint)).toHaveValue('auth-endpoint');
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.TokenEndpoint)).toHaveValue('token-endpoint');
  });

  test('calls onChange for clientId', () => {
    const handleChange = vi.fn();
    render(<OAuthSection onChange={handleChange} view={ApplicationRoute.Toolsets} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientId);
    fireEvent.change(input, { target: { value: 'new-client-id' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'new-client-id' }));
  });

  test('calls onChange for clientSecret', () => {
    const handleChange = vi.fn();
    render(<OAuthSection onChange={handleChange} view={ApplicationRoute.Toolsets} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret);
    fireEvent.change(input, { target: { value: 'new-client-secret' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ clientSecret: 'new-client-secret' }));
  });

  test('calls onChange for authorizationEndpoint', () => {
    const handleChange = vi.fn();
    render(<OAuthSection onChange={handleChange} view={ApplicationRoute.Toolsets} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.AuthorizationEndpoint);
    fireEvent.change(input, { target: { value: 'new-auth-endpoint' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ authorizationEndpoint: 'new-auth-endpoint' }));
  });

  test('calls onChange for tokenEndpoint', () => {
    const handleChange = vi.fn();
    render(<OAuthSection onChange={handleChange} view={ApplicationRoute.Toolsets} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.TokenEndpoint);
    fireEvent.change(input, { target: { value: 'new-token-endpoint' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ tokenEndpoint: 'new-token-endpoint' }));
  });

  test('shows info banner when toolset is logged in', () => {
    const authSettings: ToolsetAuthSettings = {
      authenticationType: ToolsetAuthType.OAUTH,
      globalAuthStatus: ToolsetAuthStatus.SIGNED_IN,
    };
    render(<OAuthSection authSettings={authSettings} view={ApplicationRoute.Toolsets} />);

    expect(screen.getByText(ToolsetI18nKey.AuthSettingsLockedMessage)).toBeInTheDocument();
  });

  test('does not show info banner when toolset is not logged in', () => {
    const authSettings: ToolsetAuthSettings = {
      authenticationType: ToolsetAuthType.OAUTH,
      globalAuthStatus: ToolsetAuthStatus.SIGNED_OUT,
    };
    render(<OAuthSection authSettings={authSettings} view={ApplicationRoute.Toolsets} />);

    expect(screen.queryByText(ToolsetI18nKey.AuthSettingsLockedMessage)).not.toBeInTheDocument();
  });

  test('does not disable fields when toolset is not logged in', () => {
    const authSettings: ToolsetAuthSettings = {
      authenticationType: ToolsetAuthType.OAUTH,
      clientId: 'client-id',
      clientSecret: 'client-secret',
      globalAuthStatus: ToolsetAuthStatus.SIGNED_OUT,
    };
    render(<OAuthSection authSettings={authSettings} view={ApplicationRoute.Toolsets} />);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientId)).not.toBeDisabled();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret)).not.toBeDisabled();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.AuthorizationEndpoint)).not.toBeDisabled();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.TokenEndpoint)).not.toBeDisabled();
  });
});
