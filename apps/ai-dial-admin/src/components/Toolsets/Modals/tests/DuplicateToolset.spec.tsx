import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { Toolset, ToolsetAuthStatus, ToolsetAuthType } from '@/src/models/dial/toolset';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import DuplicateToolset from '../DuplicateToolset';

describe('DuplicateToolset', () => {
  const baseToolset: Toolset = {
    name: 'toolset1',
    displayName: 'Toolset One',
  };

  const oauthToolset: Toolset = {
    name: 'oauth-toolset',
    displayName: 'OAuth Toolset',
    authSettings: {
      authenticationType: ToolsetAuthType.OAUTH,
      clientId: 'client123',
      clientSecret: 'secret123',
      authorizationEndpoint: 'https://auth.example.com',
    },
  };

  const apiKeyToolset: Toolset = {
    name: 'apikey-toolset',
    displayName: 'API Key Toolset',
    authSettings: {
      authenticationType: ToolsetAuthType.API_KEY,
      apiKeyHeader: 'X-API-Key',
    },
  };

  const loggedInToolset: Toolset = {
    name: 'logged-in-toolset',
    displayName: 'Logged In Toolset',
    authSettings: {
      authenticationType: ToolsetAuthType.OAUTH,
      clientId: 'client456',
      clientSecret: 'secret456',
      authorizationEndpoint: 'https://auth.example.com',
      globalAuthStatus: ToolsetAuthStatus.SIGNED_IN,
    },
  };

  test('renders standard fields (ID and displayName)', () => {
    render(
      <DuplicateToolset isModalOpen={true} names={[]} entity={baseToolset} onClose={vi.fn()} onDuplicate={vi.fn()} />,
    );

    expect(screen.getByText(EntityFieldsI18nKey.id)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.displayName)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Duplicate)).toBeInTheDocument();
  });

  test('shows OAuth fields when auth type is OAuth', () => {
    render(
      <DuplicateToolset isModalOpen={true} names={[]} entity={oauthToolset} onClose={vi.fn()} onDuplicate={vi.fn()} />,
    );

    expect(screen.getByText(EntityFieldsI18nKey.authenticationType)).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.OAuth)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.clientId)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.clientSecret)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.authorizationEndpoint)).toBeInTheDocument();
  });

  test('shows API Key field when auth type is API_KEY', () => {
    render(
      <DuplicateToolset isModalOpen={true} names={[]} entity={apiKeyToolset} onClose={vi.fn()} onDuplicate={vi.fn()} />,
    );

    expect(screen.getByText(EntityFieldsI18nKey.authenticationType)).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.ApiKey)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.apiKeyHeader)).toBeInTheDocument();
  });

  test('hides auth fields when auth type is NONE', () => {
    const noneToolset: Toolset = {
      ...baseToolset,
      authSettings: {
        authenticationType: ToolsetAuthType.NONE,
      },
    };

    render(
      <DuplicateToolset isModalOpen={true} names={[]} entity={noneToolset} onClose={vi.fn()} onDuplicate={vi.fn()} />,
    );

    expect(screen.queryByText(EntityFieldsI18nKey.authenticationType)).not.toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.clientId)).not.toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.apiKeyHeader)).not.toBeInTheDocument();
  });

  test('disables submit when required OAuth fields are empty', () => {
    const emptyOAuthToolset: Toolset = {
      name: 'empty-oauth',
      displayName: 'Empty OAuth',
      authSettings: {
        authenticationType: ToolsetAuthType.OAUTH,
      },
    };

    render(
      <DuplicateToolset
        isModalOpen={true}
        names={[]}
        entity={emptyOAuthToolset}
        onClose={vi.fn()}
        onDuplicate={vi.fn()}
      />,
    );

    expect(screen.getByText(ButtonsI18nKey.Duplicate)).toBeDisabled();
  });

  test('disables submit when required API Key field is empty', () => {
    const emptyApiKeyToolset: Toolset = {
      name: 'empty-apikey',
      displayName: 'Empty API Key',
      authSettings: {
        authenticationType: ToolsetAuthType.API_KEY,
      },
    };

    render(
      <DuplicateToolset
        isModalOpen={true}
        names={[]}
        entity={emptyApiKeyToolset}
        onClose={vi.fn()}
        onDuplicate={vi.fn()}
      />,
    );

    expect(screen.getByText(ButtonsI18nKey.Duplicate)).toBeDisabled();
  });

  test('enables submit when all required OAuth fields are filled', () => {
    render(
      <DuplicateToolset isModalOpen={true} names={[]} entity={oauthToolset} onClose={vi.fn()} onDuplicate={vi.fn()} />,
    );

    expect(screen.getByText(ButtonsI18nKey.Duplicate)).not.toBeDisabled();
  });

  test('enables submit when all required API Key fields are filled', () => {
    render(
      <DuplicateToolset isModalOpen={true} names={[]} entity={apiKeyToolset} onClose={vi.fn()} onDuplicate={vi.fn()} />,
    );

    expect(screen.getByText(ButtonsI18nKey.Duplicate)).not.toBeDisabled();
  });

  test('calls onDuplicate with correct entity when Duplicate is clicked', () => {
    const onDuplicate = vi.fn();
    render(
      <DuplicateToolset
        isModalOpen={true}
        names={[]}
        entity={oauthToolset}
        onClose={vi.fn()}
        onDuplicate={onDuplicate}
      />,
    );

    fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));
    expect(onDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.any(String),
        displayName: expect.any(String),
        authSettings: expect.objectContaining({
          authenticationType: ToolsetAuthType.OAUTH,
          clientId: 'client123',
          clientSecret: 'secret123',
          authorizationEndpoint: 'https://auth.example.com',
        }),
      }),
    );
  });

  test('shows warning alert for logged-in toolset', () => {
    render(
      <DuplicateToolset
        isModalOpen={true}
        names={[]}
        entity={loggedInToolset}
        onClose={vi.fn()}
        onDuplicate={vi.fn()}
      />,
    );

    expect(screen.getByText(ToolsetI18nKey.DuplicateLoggedInWarning)).toBeInTheDocument();
  });

  test('does not show warning alert for non-logged-in toolset', () => {
    render(
      <DuplicateToolset isModalOpen={true} names={[]} entity={oauthToolset} onClose={vi.fn()} onDuplicate={vi.fn()} />,
    );

    expect(screen.queryByText(ToolsetI18nKey.DuplicateLoggedInWarning)).not.toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <DuplicateToolset isModalOpen={true} names={[]} entity={baseToolset} onClose={onClose} onDuplicate={vi.fn()} />,
    );

    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(onClose).toHaveBeenCalled();
  });

  test('updates auth fields when user types', () => {
    const emptyOAuthToolset: Toolset = {
      name: 'empty-oauth',
      displayName: 'Empty OAuth',
      authSettings: {
        authenticationType: ToolsetAuthType.OAUTH,
      },
    };

    render(
      <DuplicateToolset
        isModalOpen={true}
        names={[]}
        entity={emptyOAuthToolset}
        onClose={vi.fn()}
        onDuplicate={vi.fn()}
      />,
    );

    const clientIdInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientId);
    const clientSecretInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret);
    const authEndpointInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.AuthorizationEndpoint);

    fireEvent.change(clientIdInput, { target: { value: 'new-client-id' } });
    fireEvent.change(clientSecretInput, { target: { value: 'new-secret' } });
    fireEvent.change(authEndpointInput, { target: { value: 'https://new-auth.com' } });

    expect(clientIdInput).toHaveValue('new-client-id');
    expect(clientSecretInput).toHaveValue('new-secret');
    expect(authEndpointInput).toHaveValue('https://new-auth.com');
  });
});
