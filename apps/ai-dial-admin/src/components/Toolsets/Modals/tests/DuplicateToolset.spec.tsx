import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { Toolset, ToolsetAuthType } from '@/src/models/dial/toolset';
import { checkIsUniqueDeploymentName } from '@/src/app/actions';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import DuplicateToolset from '../DuplicateToolset';

vi.mock('@/src/app/actions');

describe('DuplicateToolset', () => {
  const baseToolset: Toolset = {
    name: 'toolset1',
    displayName: 'Toolset One',
    description: 'Test toolset',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (checkIsUniqueDeploymentName as ReturnType<typeof vi.fn>).mockResolvedValue(true);
  });

  describe('Rendering', () => {
    test('renders basic fields without auth settings', () => {
      render(
        <DuplicateToolset isModalOpen={true} onClose={vi.fn()} entity={baseToolset} onDuplicate={vi.fn()} names={[]} />,
      );

      expect(screen.getByText(EntityFieldsI18nKey.id)).toBeInTheDocument();
      expect(screen.getByText(EntityFieldsI18nKey.displayName)).toBeInTheDocument();
      expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
      expect(screen.getByText(ButtonsI18nKey.Duplicate)).toBeInTheDocument();

      // Auth fields should not be visible
      expect(screen.queryByText(ToolsetI18nKey.OAuth)).not.toBeInTheDocument();
      expect(screen.queryByText(ToolsetI18nKey.ApiKey)).not.toBeInTheDocument();
    });

    test('renders OAuth fields when auth type is OAuth', () => {
      const toolsetWithOAuth: Toolset = {
        ...baseToolset,
        authSettings: {
          authenticationType: ToolsetAuthType.OAUTH,
          clientId: 'test-client-id',
          clientSecret: 'test-secret',
          authorizationEndpoint: 'https://auth.example.com',
        },
      };

      render(
        <DuplicateToolset
          isModalOpen={true}
          onClose={vi.fn()}
          entity={toolsetWithOAuth}
          onDuplicate={vi.fn()}
          names={[]}
        />,
      );

      expect(screen.getByText(ToolsetI18nKey.OAuth)).toBeInTheDocument();
      expect(screen.getByText(EntityFieldsI18nKey.clientId)).toBeInTheDocument();
      expect(screen.getByText(EntityFieldsI18nKey.clientSecret)).toBeInTheDocument();
      expect(screen.getByText(EntityFieldsI18nKey.authorizationEndpoint)).toBeInTheDocument();

      // API Key field should not be visible
      expect(screen.queryByText(ToolsetI18nKey.ApiKey)).not.toBeInTheDocument();
    });

    test('renders API Key field when auth type is API_KEY', () => {
      const toolsetWithApiKey: Toolset = {
        ...baseToolset,
        authSettings: {
          authenticationType: ToolsetAuthType.API_KEY,
          apiKeyHeader: 'X-API-Key',
        },
      };

      render(
        <DuplicateToolset
          isModalOpen={true}
          onClose={vi.fn()}
          entity={toolsetWithApiKey}
          onDuplicate={vi.fn()}
          names={[]}
        />,
      );

      expect(screen.getByText(ToolsetI18nKey.ApiKey)).toBeInTheDocument();
      expect(screen.getByText(EntityFieldsI18nKey.apiKeyHeader)).toBeInTheDocument();

      // OAuth fields should not be visible
      expect(screen.queryByText(ToolsetI18nKey.OAuth)).not.toBeInTheDocument();
      expect(screen.queryByText(EntityFieldsI18nKey.clientId)).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    test('submit button is enabled when all required fields are filled for toolset without auth', () => {
      render(
        <DuplicateToolset isModalOpen={true} onClose={vi.fn()} entity={baseToolset} onDuplicate={vi.fn()} names={[]} />,
      );

      const duplicateButton = screen.getByText(ButtonsI18nKey.Duplicate);
      expect(duplicateButton).not.toBeDisabled();
    });

    test('submit button is enabled when all OAuth fields are filled', () => {
      const toolsetWithOAuth: Toolset = {
        ...baseToolset,
        authSettings: {
          authenticationType: ToolsetAuthType.OAUTH,
          clientId: 'test-client-id',
          clientSecret: 'test-secret',
          authorizationEndpoint: 'https://auth.example.com',
        },
      };

      render(
        <DuplicateToolset
          isModalOpen={true}
          onClose={vi.fn()}
          entity={toolsetWithOAuth}
          onDuplicate={vi.fn()}
          names={[]}
        />,
      );

      const duplicateButton = screen.getByText(ButtonsI18nKey.Duplicate);
      expect(duplicateButton).not.toBeDisabled();
    });

    test('submit button is enabled when API Key header is filled', () => {
      const toolsetWithApiKey: Toolset = {
        ...baseToolset,
        authSettings: {
          authenticationType: ToolsetAuthType.API_KEY,
          apiKeyHeader: 'X-API-Key',
        },
      };

      render(
        <DuplicateToolset
          isModalOpen={true}
          onClose={vi.fn()}
          entity={toolsetWithApiKey}
          onDuplicate={vi.fn()}
          names={[]}
        />,
      );

      const duplicateButton = screen.getByText(ButtonsI18nKey.Duplicate);
      expect(duplicateButton).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    test('calls onClose when Cancel is clicked', () => {
      const onClose = vi.fn();
      render(
        <DuplicateToolset isModalOpen={true} onClose={onClose} entity={baseToolset} onDuplicate={vi.fn()} names={[]} />,
      );

      fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
      expect(onClose).toHaveBeenCalled();
    });

    test('calls onDuplicate with correct entity when Duplicate is clicked', async () => {
      const onDuplicate = vi.fn();
      render(
        <DuplicateToolset
          isModalOpen={true}
          onClose={vi.fn()}
          entity={baseToolset}
          onDuplicate={onDuplicate}
          names={[]}
        />,
      );

      fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));

      await waitFor(() =>
        expect(onDuplicate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.stringContaining('toolset1'),
            displayName: expect.stringContaining('Toolset One'),
          }),
        ),
      );
    });

    test('updates clientId when OAuth field changes', async () => {
      const toolsetWithOAuth: Toolset = {
        ...baseToolset,
        authSettings: {
          authenticationType: ToolsetAuthType.OAUTH,
          clientId: 'old-client-id',
          clientSecret: 'test-secret',
          authorizationEndpoint: 'https://auth.example.com',
        },
      };

      const onDuplicate = vi.fn();
      render(
        <DuplicateToolset
          isModalOpen={true}
          onClose={vi.fn()}
          entity={toolsetWithOAuth}
          onDuplicate={onDuplicate}
          names={[]}
        />,
      );

      const clientIdInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientId);
      fireEvent.change(clientIdInput, { target: { value: 'new-client-id' } });

      fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));

      await waitFor(() =>
        expect(onDuplicate).toHaveBeenCalledWith(
          expect.objectContaining({
            authSettings: expect.objectContaining({
              clientId: 'new-client-id',
            }),
          }),
        ),
      );
    });

    test('updates clientSecret when OAuth field changes', async () => {
      const toolsetWithOAuth: Toolset = {
        ...baseToolset,
        authSettings: {
          authenticationType: ToolsetAuthType.OAUTH,
          clientId: 'test-client-id',
          clientSecret: 'old-secret',
          authorizationEndpoint: 'https://auth.example.com',
        },
      };

      const onDuplicate = vi.fn();
      render(
        <DuplicateToolset
          isModalOpen={true}
          onClose={vi.fn()}
          entity={toolsetWithOAuth}
          onDuplicate={onDuplicate}
          names={[]}
        />,
      );

      const clientSecretInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ClientSecret);
      fireEvent.change(clientSecretInput, { target: { value: 'new-secret' } });

      fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));

      await waitFor(() =>
        expect(onDuplicate).toHaveBeenCalledWith(
          expect.objectContaining({
            authSettings: expect.objectContaining({
              clientSecret: 'new-secret',
            }),
          }),
        ),
      );
    });

    test('updates authorizationEndpoint when OAuth field changes', async () => {
      const toolsetWithOAuth: Toolset = {
        ...baseToolset,
        authSettings: {
          authenticationType: ToolsetAuthType.OAUTH,
          clientId: 'test-client-id',
          clientSecret: 'test-secret',
          authorizationEndpoint: 'https://auth.example.com',
        },
      };

      const onDuplicate = vi.fn();
      render(
        <DuplicateToolset
          isModalOpen={true}
          onClose={vi.fn()}
          entity={toolsetWithOAuth}
          onDuplicate={onDuplicate}
          names={[]}
        />,
      );

      const endpointInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.AuthorizationEndpoint);
      fireEvent.change(endpointInput, { target: { value: 'https://new-auth.example.com' } });

      fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));

      await waitFor(() =>
        expect(onDuplicate).toHaveBeenCalledWith(
          expect.objectContaining({
            authSettings: expect.objectContaining({
              authorizationEndpoint: 'https://new-auth.example.com',
            }),
          }),
        ),
      );
    });

    test('updates apiKeyHeader when API Key field changes', async () => {
      const toolsetWithApiKey: Toolset = {
        ...baseToolset,
        authSettings: {
          authenticationType: ToolsetAuthType.API_KEY,
          apiKeyHeader: 'X-API-Key',
        },
      };

      const onDuplicate = vi.fn();
      render(
        <DuplicateToolset
          isModalOpen={true}
          onClose={vi.fn()}
          entity={toolsetWithApiKey}
          onDuplicate={onDuplicate}
          names={[]}
        />,
      );

      const apiKeyHeaderInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Header);
      fireEvent.change(apiKeyHeaderInput, { target: { value: 'X-Custom-API-Key' } });

      fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));

      await waitFor(() =>
        expect(onDuplicate).toHaveBeenCalledWith(
          expect.objectContaining({
            authSettings: expect.objectContaining({
              apiKeyHeader: 'X-Custom-API-Key',
            }),
          }),
        ),
      );
    });

    test('updates displayName when field changes', async () => {
      const onDuplicate = vi.fn();
      render(
        <DuplicateToolset
          isModalOpen={true}
          onClose={vi.fn()}
          entity={baseToolset}
          onDuplicate={onDuplicate}
          names={[]}
        />,
      );

      const displayNameInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName);
      fireEvent.change(displayNameInput, { target: { value: 'New Toolset Name' } });

      fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));

      await waitFor(() =>
        expect(onDuplicate).toHaveBeenCalledWith(
          expect.objectContaining({
            displayName: 'New Toolset Name',
          }),
        ),
      );
    });
  });

  describe('Entity Name Cloning', () => {
    test('initializes with cloned name and displayName', async () => {
      const onDuplicate = vi.fn();
      render(
        <DuplicateToolset
          isModalOpen={true}
          onClose={vi.fn()}
          entity={baseToolset}
          onDuplicate={onDuplicate}
          names={[]}
        />,
      );

      fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));

      await waitFor(() =>
        expect(onDuplicate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.stringContaining('toolset1'),
            displayName: expect.stringContaining('Toolset One'),
          }),
        ),
      );
    });
  });
});
