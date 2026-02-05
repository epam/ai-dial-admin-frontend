import { ToolsetAuthSettings } from '@/src/models/dial/toolset';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import OAuthSection from '../../View/Auth/OAuthSection';

describe('OAuthSection', () => {
  test('renders all input fields with correct values', () => {
    const authSettings: ToolsetAuthSettings = {
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'redirect-uri',
      scopesSupported: ['scope1', 'scope2'],
      authorizationEndpoint: 'auth-endpoint',
      tokenEndpoint: 'token-endpoint',
      codeChallengeMethod: 'S256',
    };
    render(<OAuthSection authSettings={authSettings} />);
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientId)).toHaveValue('client-id');
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret)).toHaveValue('client-secret');
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.AuthorizationEndpoint)).toHaveValue('auth-endpoint');
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.TokenEndpoint)).toHaveValue('token-endpoint');
  });

  test('calls onChange for clientId', () => {
    const handleChange = vi.fn();
    render(<OAuthSection onChange={handleChange} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientId);
    fireEvent.change(input, { target: { value: 'new-client-id' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ clientId: 'new-client-id' }));
  });

  test('calls onChange for clientSecret', () => {
    const handleChange = vi.fn();
    render(<OAuthSection onChange={handleChange} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret);
    fireEvent.change(input, { target: { value: 'new-client-secret' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ clientSecret: 'new-client-secret' }));
  });

  test('calls onChange for authorizationEndpoint', () => {
    const handleChange = vi.fn();
    render(<OAuthSection onChange={handleChange} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.AuthorizationEndpoint);
    fireEvent.change(input, { target: { value: 'new-auth-endpoint' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ authorizationEndpoint: 'new-auth-endpoint' }));
  });

  test('calls onChange for tokenEndpoint', () => {
    const handleChange = vi.fn();
    render(<OAuthSection onChange={handleChange} />);
    const input = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.TokenEndpoint);
    fireEvent.change(input, { target: { value: 'new-token-endpoint' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ tokenEndpoint: 'new-token-endpoint' }));
  });
});
