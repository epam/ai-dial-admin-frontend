import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ToolsetI18nKey } from '@/src/constants/i18n';
import { DialToolsetResource, ToolsetAuthCredentialLevel, ToolsetAuthType } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import ResourceAuthButtons from '../ResourceAuthButtons';

vi.mock('../ResourceLoginPopup', () => ({
  default: ({ onLogin }: { onLogin: (levels: ToolsetAuthCredentialLevel[], apiKey: string) => void }) => (
    <button onClick={() => onLogin([ToolsetAuthCredentialLevel.USER], '')}>confirm-login</button>
  ),
}));

const originalLocation = window.location;

const toolset = (resource?: string): DialToolsetResource =>
  ({
    name: 'my-toolset',
    auth_settings: {
      authentication_type: ToolsetAuthType.OAUTH,
      client_id: 'client-id',
      authorization_endpoint: 'https://auth.example.com/authorize',
      resource,
    },
  }) as unknown as DialToolsetResource;

describe('ResourceAuthButtons — OAuth authorization URL', () => {
  const assign = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, origin: 'http://localhost', pathname: '/assets-toolsets', assign },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  const startLogin = async (selectedToolset: DialToolsetResource) => {
    const user = userEvent.setup();
    render(
      <ResourceAuthButtons
        view={ApplicationRoute.AssetsToolsets}
        selectedToolset={selectedToolset}
        signInToolset={vi.fn()}
        signOutToolset={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: ToolsetI18nKey.LogIn }));
    await user.click(screen.getByRole('button', { name: 'confirm-login' }));
    return new URL(assign.mock.calls[0][0]);
  };

  test('adds the resource to the authorization URL when it is set', async () => {
    const url = await startLogin(toolset('https://mcp.example.com/mcp'));

    expect(url.searchParams.get('resource')).toBe('https://mcp.example.com/mcp');
    expect(url.searchParams.get('client_id')).toBe('client-id');
  });

  test.each([undefined, ''])('leaves the resource off the authorization URL when it is %j', async (resource) => {
    const url = await startLogin(toolset(resource));

    expect(url.searchParams.has('resource')).toBe(false);
  });
});
