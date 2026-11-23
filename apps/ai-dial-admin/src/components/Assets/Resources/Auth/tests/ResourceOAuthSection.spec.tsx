import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps, useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import {
  DialToolsetResourceAuthSettings,
  TokenEndpointAuthMethod,
  ToolsetAuthStatus,
  ToolsetAuthType,
} from '@/src/models/dial/resource';
import ResourceOAuthSection from '../ResourceOAuthSection';

const mockDispatch = vi.mocked(useSaveValidationContext().dispatch);

const ADMIN_CALLBACK = 'https://admin.example.com/external-service-signin';
const DISCOVERY_URL = 'https://mcp.example.com/mcp';

const oauthSettings = (overrides: Partial<DialToolsetResourceAuthSettings> = {}): DialToolsetResourceAuthSettings => ({
  authentication_type: ToolsetAuthType.OAUTH,
  client_id: 'client-id',
  ...overrides,
});

const registeredSettings = (
  overrides: Partial<DialToolsetResourceAuthSettings> = {},
): DialToolsetResourceAuthSettings => ({
  authentication_type: ToolsetAuthType.OAUTH,
  discovery_url: DISCOVERY_URL,
  dynamically_registered: true,
  client_id: 'registered-id',
  authorization_endpoint: 'https://auth.example.com/authorize',
  token_endpoint: 'https://auth.example.com/token',
  token_endpoint_auth_method: TokenEndpointAuthMethod.CLIENT_SECRET_NONE,
  ...overrides,
});

type HarnessProps = Partial<ComponentProps<typeof ResourceOAuthSection>> & {
  initial?: DialToolsetResourceAuthSettings;
  onChangeSpy?: (settings: DialToolsetResourceAuthSettings) => void;
};

// Holds the settings the way the Add/Edit form does, so a mode change re-renders with what it emitted.
const Harness = ({ initial, onChangeSpy, ...props }: HarnessProps) => {
  const [settings, setSettings] = useState(initial);
  return (
    <ResourceOAuthSection
      redirectUri={ADMIN_CALLBACK}
      {...props}
      authSettings={settings}
      onChange={(next) => {
        onChangeSpy?.(next);
        setSettings(next);
      }}
    />
  );
};

const typeSelectorName = new RegExp(ToolsetI18nKey.ClientRegistrationType);

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

describe('ResourceOAuthSection — Discovery URL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows the Discovery URL with its caption for an external service', () => {
    render(<ResourceOAuthSection authSettings={oauthSettings()} isDiscoveryUrlSupported />);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DiscoveryUrl)).toHaveValue('');
    expect(screen.getByText(ToolsetI18nKey.DiscoveryUrlCaption)).toBeTruthy();
  });

  test('does not show the Discovery URL for a toolset', () => {
    render(<ResourceOAuthSection authSettings={oauthSettings({ discovery_url: DISCOVERY_URL })} />);

    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.DiscoveryUrl)).toBeNull();
  });

  test('shows the stored Discovery URL', () => {
    render(
      <ResourceOAuthSection authSettings={oauthSettings({ discovery_url: DISCOVERY_URL })} isDiscoveryUrlSupported />,
    );

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DiscoveryUrl)).toHaveValue(DISCOVERY_URL);
  });

  test('does not require a Discovery URL for an existing client', () => {
    render(<ResourceOAuthSection authSettings={oauthSettings()} isDiscoveryUrlSupported />);

    expect(mockDispatch).not.toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'discoveryUrl',
      isValid: false,
    });
  });

  test('reports an invalid Discovery URL to the save validation', () => {
    render(
      <ResourceOAuthSection authSettings={oauthSettings({ discovery_url: 'not a url' })} isDiscoveryUrlSupported />,
    );

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'discoveryUrl',
      isValid: false,
    });
  });

  test('passes an empty string, not undefined, when the Discovery URL is cleared', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ResourceOAuthSection
        authSettings={oauthSettings({ discovery_url: DISCOVERY_URL })}
        isDiscoveryUrlSupported
        onChange={onChange}
      />,
    );

    await user.clear(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DiscoveryUrl));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ discovery_url: '' }));
  });

  test('locks the Discovery URL while signed in', () => {
    render(
      <ResourceOAuthSection
        authSettings={oauthSettings({ discovery_url: DISCOVERY_URL, global_auth_status: ToolsetAuthStatus.SIGNED_IN })}
        isDiscoveryUrlSupported
      />,
    );

    expect(screen.getByDisplayValue(DISCOVERY_URL)).toBeDisabled();
  });
});

describe('ResourceOAuthSection — registration type', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const chooseAutomatic = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('combobox', { name: typeSelectorName }));
    await user.click(screen.getByRole('option', { name: ToolsetI18nKey.RegisterAutomatically }));
  };

  test('offers only an existing client for a toolset', async () => {
    const user = userEvent.setup();
    render(<ResourceOAuthSection authSettings={oauthSettings()} />);

    await user.click(screen.getByRole('combobox', { name: typeSelectorName }));

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: ToolsetI18nKey.ExistingClient })).toBeTruthy();
  });

  test('offers automatic registration next to an existing client when it is allowed', async () => {
    const user = userEvent.setup();
    render(
      <ResourceOAuthSection authSettings={oauthSettings()} isDiscoveryUrlSupported isDynamicRegistrationOffered />,
    );

    await user.click(screen.getByRole('combobox', { name: typeSelectorName }));

    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('option', { name: ToolsetI18nKey.RegisterAutomatically })).toBeTruthy();
  });

  test('shows no selector for a stored OAuth external service', () => {
    render(<ResourceOAuthSection authSettings={oauthSettings()} isDiscoveryUrlSupported />);

    expect(screen.queryByRole('combobox', { name: typeSelectorName })).toBeNull();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DiscoveryUrl)).toBeTruthy();
  });

  test('sends only the type and the Discovery URL after choosing automatic registration', async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(
      <Harness
        initial={oauthSettings({ redirect_uri: ADMIN_CALLBACK, discovery_url: DISCOVERY_URL })}
        onChangeSpy={onChangeSpy}
        isDiscoveryUrlSupported
        isDynamicRegistrationOffered
      />,
    );

    await chooseAutomatic(user);

    expect(onChangeSpy).toHaveBeenLastCalledWith({
      authentication_type: ToolsetAuthType.OAUTH,
      discovery_url: DISCOVERY_URL,
    });
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret)).toBeNull();
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.AuthorizationEndpoint)).toBeNull();
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.TokenEndpoint)).toBeNull();
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.Resource)).toBeNull();
  });

  test('stays in automatic registration while the Discovery URL is empty and requires it', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={oauthSettings({ redirect_uri: ADMIN_CALLBACK })}
        isDiscoveryUrlSupported
        isDynamicRegistrationOffered
      />,
    );

    await chooseAutomatic(user);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DiscoveryUrl)).toHaveValue('');
    expect(screen.getByRole('combobox', { name: new RegExp(ToolsetI18nKey.ClientRegistrationType) })).toHaveValue(
      ToolsetI18nKey.RegisterAutomatically,
    );
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'discoveryUrl',
      isValid: false,
    });
  });

  test('restores an empty existing client and the admin callback when switching back', async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(
      <Harness
        initial={oauthSettings({ redirect_uri: ADMIN_CALLBACK, discovery_url: DISCOVERY_URL })}
        onChangeSpy={onChangeSpy}
        isDiscoveryUrlSupported
        isDynamicRegistrationOffered
      />,
    );
    await chooseAutomatic(user);

    await user.click(screen.getByRole('combobox', { name: typeSelectorName }));
    await user.click(screen.getByRole('option', { name: ToolsetI18nKey.ExistingClient }));

    expect(onChangeSpy).toHaveBeenLastCalledWith({
      authentication_type: ToolsetAuthType.OAUTH,
      discovery_url: DISCOVERY_URL,
      client_id: '',
      redirect_uri: ADMIN_CALLBACK,
    });
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret)).toBeTruthy();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DiscoveryUrl)).toHaveValue(DISCOVERY_URL);
  });
});

describe('ResourceOAuthSection — registered by DIAL Core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows the registered client read-only with no client secret field', () => {
    render(<ResourceOAuthSection authSettings={registeredSettings()} isDiscoveryUrlSupported />);

    expect(screen.getByText(ToolsetI18nKey.RegisteredByCore)).toBeTruthy();
    expect(screen.getByDisplayValue('registered-id')).toBeDisabled();
    expect(screen.getByDisplayValue(DISCOVERY_URL)).toBeDisabled();
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret)).toBeNull();
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecretMasked)).toBeNull();
    expect(screen.getByRole('button', { name: ToolsetI18nKey.UseExistingClientInstead })).toBeEnabled();
  });

  test('does not offer the conversion to a read-only admin', () => {
    render(<ResourceOAuthSection authSettings={registeredSettings()} isDiscoveryUrlSupported disabled />);

    expect(screen.queryByRole('button', { name: ToolsetI18nKey.UseExistingClientInstead })).toBeNull();
  });

  test('disables the conversion while signed in', () => {
    render(
      <ResourceOAuthSection
        authSettings={registeredSettings({ user_level_auth_status: ToolsetAuthStatus.SIGNED_IN })}
        isDiscoveryUrlSupported
      />,
    );

    expect(screen.getByRole('button', { name: ToolsetI18nKey.UseExistingClientInstead })).toBeDisabled();
  });

  test('converts to an existing client that needs its own credentials', async () => {
    const user = userEvent.setup();
    const onChangeSpy = vi.fn();
    render(<Harness initial={registeredSettings()} onChangeSpy={onChangeSpy} isDiscoveryUrlSupported />);

    await user.click(screen.getByRole('button', { name: ToolsetI18nKey.UseExistingClientInstead }));

    expect(onChangeSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        dynamically_registered: false,
        client_id: '',
        client_secret: '',
        discovery_url: DISCOVERY_URL,
        token_endpoint_auth_method: TokenEndpointAuthMethod.CLIENT_SECRET_BASIC,
      }),
    );
    expect(screen.queryByText(ToolsetI18nKey.RegisteredByCore)).toBeNull();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret)).toBeEnabled();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'authSettings.clientSecret',
      isValid: false,
    });
  });

  test('keeps the Discovery URL locked after the conversion while the stored client is registered', async () => {
    const user = userEvent.setup();
    render(<Harness initial={registeredSettings()} isDiscoveryUrlSupported isDiscoveryUrlLocked />);

    await user.click(screen.getByRole('button', { name: ToolsetI18nKey.UseExistingClientInstead }));

    expect(screen.getByDisplayValue(DISCOVERY_URL)).toBeDisabled();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret)).toBeEnabled();
  });
});

describe('ResourceOAuthSection — token endpoint authentication method', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const methodSelectorName = new RegExp(ToolsetI18nKey.TokenEndpointAuthMethod);

  test('shows a stored none as None', () => {
    render(
      <ResourceOAuthSection
        authSettings={oauthSettings({ token_endpoint_auth_method: TokenEndpointAuthMethod.CLIENT_SECRET_NONE })}
      />,
    );

    expect(screen.getByRole('combobox', { name: methodSelectorName })).toHaveValue(
      ToolsetI18nKey.TokenEndpointAuthMethodNone,
    );
  });

  test('saves none when None is chosen', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ResourceOAuthSection authSettings={oauthSettings()} onChange={onChange} />);

    await user.click(screen.getByRole('combobox', { name: methodSelectorName }));
    await user.click(screen.getByRole('option', { name: ToolsetI18nKey.TokenEndpointAuthMethodNone }));

    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ token_endpoint_auth_method: 'none' }));
  });
});
