import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ToolsetI18nKey } from '@/src/constants/i18n';
import { DialExternalService, ToolsetAuthCredentialLevel, ToolsetAuthType } from '@/src/models/dial/resource';
import ExternalServiceAuthButtons from '../ExternalServiceAuthButtons';

vi.mock('../ResourceLoginPopup', () => ({
  default: ({ onLogin }: { onLogin: (levels: ToolsetAuthCredentialLevel[], apiKey: string) => void }) => (
    <button onClick={() => onLogin([ToolsetAuthCredentialLevel.USER], '')}>confirm-login</button>
  ),
}));

const originalLocation = window.location;

const service = (resource?: string): DialExternalService =>
  ({
    auth_settings: {
      authentication_type: ToolsetAuthType.OAUTH,
      client_id: 'client-id',
      authorization_endpoint: 'https://auth.example.com/authorize',
      resource,
    },
  }) as unknown as DialExternalService;

describe('ExternalServiceAuthButtons — OAuth authorization URL', () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, origin: 'http://localhost', pathname: '/apps', search: '', assign },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  const startLogin = async (selectedService: DialExternalService) => {
    const user = userEvent.setup();
    render(
      <ExternalServiceAuthButtons
        appPath="public/my-app"
        serviceId="svc"
        service={selectedService}
        signIn={vi.fn()}
        signOut={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: ToolsetI18nKey.LogIn }));
    await user.click(screen.getByRole('button', { name: 'confirm-login' }));
    return new URL(assign.mock.calls[0][0]);
  };

  test('adds the resource to the authorization URL when it is set', async () => {
    const url = await startLogin(service('https://mcp.example.com/mcp'));

    expect(url.searchParams.get('resource')).toBe('https://mcp.example.com/mcp');
    expect(url.searchParams.get('client_id')).toBe('client-id');
  });

  test.each([undefined, ''])('leaves the resource off the authorization URL when it is %j', async (resource) => {
    const url = await startLogin(service(resource));

    expect(url.searchParams.has('resource')).toBe(false);
  });
});
