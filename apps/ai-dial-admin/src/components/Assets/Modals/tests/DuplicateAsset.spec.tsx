import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import * as formPopupUtils from '@/src/components/Common/FormPopup/utils';

import { ButtonsI18nKey, EntityFieldsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ToolsetAuthType } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getClonedEntityName } from '@/src/utils/entities/duplicate-entity';
import DuplicateAsset from '@/src/components/Assets/Modals/DuplicateAsset';

const renderModal = (entity: AssetWithVersion, onDuplicate = vi.fn()) => {
  render(
    <DuplicateAsset
      view={ApplicationRoute.AssetsApplications}
      isModalOpen
      entity={entity}
      onDuplicate={onDuplicate}
      onClose={vi.fn()}
    />,
  );

  return { onDuplicate };
};

describe('DuplicateAsset', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('rejects an empty name even when the submit button is enabled', async () => {
    const user = userEvent.setup();
    const getFormPopupButtons = formPopupUtils.getFormPopupButtons;
    vi.spyOn(formPopupUtils, 'getFormPopupButtons').mockImplementation((params) =>
      getFormPopupButtons({ ...params, isSubmitDisabled: false }),
    );
    const { onDuplicate } = renderModal({ name: 'app', version: 'stable' } as AssetWithVersion);

    await user.clear(screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.id) }));
    const submitButton = screen.getByRole('button', { name: ButtonsI18nKey.Duplicate });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(onDuplicate).not.toHaveBeenCalled();
  });

  test('renders the API-key heading and header control together and preserves edits on duplicate', async () => {
    const user = userEvent.setup();
    const { onDuplicate } = renderModal({
      name: 'toolset',
      version: 'stable',
      auth_settings: { authentication_type: ToolsetAuthType.API_KEY, api_key_header: 'X-API-Key' },
    } as unknown as AssetWithVersion);

    expect(screen.getByRole('heading', { name: ToolsetI18nKey.ApiKey })).toBeInTheDocument();
    const headerInput = screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.apiKeyHeader) });
    expect(headerInput).toHaveValue('X-API-Key');
    await user.clear(headerInput);
    await user.type(headerInput, 'Authorization');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 'stable',
        display_version: 'stable',
        auth_settings: { authentication_type: ToolsetAuthType.API_KEY, api_key_header: 'Authorization' },
      }),
    );
  });

  test('has only a new-entity flow and synchronizes an edited text version', async () => {
    const user = userEvent.setup();
    const entity = {
      name: 'app',
      version: 'stable',
      path: 'public/app__stable',
      _metadata: { name: 'app', folderId: 'public/', path: 'public/app__stable', version: 'stable' },
    } as AssetWithVersion;
    const { onDuplicate } = renderModal(entity);
    expect(screen.queryByRole('radio')).toBeNull();
    const versionInput = screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.version) });
    expect(versionInput).toHaveValue('stable');
    await user.clear(versionInput);
    await user.type(versionInput, 'release candidate');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));
    expect(onDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: getClonedEntityName('app'),
        version: 'release candidate',
        display_version: 'release candidate',
      }),
    );
  });

  test('rejects the original complete destination but allows the same name with a different version', async () => {
    const user = userEvent.setup();
    const entity = {
      name: 'app',
      version: 'stable',
      path: 'public/app__stable',
      _metadata: { name: 'app', folderId: 'public/', path: 'public/app__stable', version: 'stable' },
    } as AssetWithVersion;
    render(
      <DuplicateAsset
        view={ApplicationRoute.AssetsApplications}
        isModalOpen
        entity={entity}
        versionsMap={{ app: ['stable'] }}
        onDuplicate={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const idInput = screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.id) });
    await user.clear(idInput);
    await user.type(idInput, 'app');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate })).toBeDisabled();
    const versionInput = screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.version) });
    await user.clear(versionInput);
    await user.type(versionInput, 'preview');
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate })).toBeEnabled();
  });

  test('resets an OAuth external service to NONE on duplicate', async () => {
    const user = userEvent.setup();
    const entity = {
      name: 'app',
      _metadata: { folderId: 'public/' },
      external_services: {
        svc: {
          display_name: 'Service',
          description: 'A service',
          auth_settings: { authentication_type: ToolsetAuthType.OAUTH, client_id: 'id' },
        },
      },
    } as unknown as AssetWithVersion;
    const { onDuplicate } = renderModal(entity);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({
      ...entity,
      name: getClonedEntityName(entity.name),
      folderId: 'public/',
      version: '1.0.0',
      display_version: '1.0.0',
      _metadata: { folderId: 'public/', version: '1.0.0' },
      external_services: {
        svc: {
          display_name: 'Service',
          description: 'A service',
          auth_settings: { authentication_type: ToolsetAuthType.NONE },
        },
      },
    });
  });

  test('leaves a non-OAuth external service unchanged on duplicate', async () => {
    const user = userEvent.setup();
    const entity = {
      name: 'app',
      _metadata: { folderId: 'public/' },
      external_services: {
        svc: { auth_settings: { authentication_type: ToolsetAuthType.API_KEY } },
      },
    } as unknown as AssetWithVersion;
    const { onDuplicate } = renderModal(entity);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({
      ...entity,
      name: getClonedEntityName(entity.name),
      folderId: 'public/',
      version: '1.0.0',
      display_version: '1.0.0',
      _metadata: { folderId: 'public/', version: '1.0.0' },
    });
  });

  test('resets only the OAuth entry in a mix of OAuth and non-OAuth external services', async () => {
    const user = userEvent.setup();
    const entity = {
      name: 'app',
      _metadata: { folderId: 'public/' },
      external_services: {
        oauthSvc: { auth_settings: { authentication_type: ToolsetAuthType.OAUTH } },
        apiKeySvc: { auth_settings: { authentication_type: ToolsetAuthType.API_KEY } },
      },
    } as unknown as AssetWithVersion;
    const { onDuplicate } = renderModal(entity);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({
      ...entity,
      name: getClonedEntityName(entity.name),
      folderId: 'public/',
      version: '1.0.0',
      display_version: '1.0.0',
      _metadata: { folderId: 'public/', version: '1.0.0' },
      external_services: {
        oauthSvc: { auth_settings: { authentication_type: ToolsetAuthType.NONE } },
        apiKeySvc: { auth_settings: { authentication_type: ToolsetAuthType.API_KEY } },
      },
    });
  });

  test('is unaffected when the application has no external services', async () => {
    const user = userEvent.setup();
    const entity = { name: 'app', _metadata: { folderId: 'public/' } } as unknown as AssetWithVersion;
    const { onDuplicate } = renderModal(entity);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({
      ...entity,
      name: getClonedEntityName(entity.name),
      folderId: 'public/',
      version: '1.0.0',
      display_version: '1.0.0',
      _metadata: { folderId: 'public/', version: '1.0.0' },
    });
  });

  test('still resets a toolset auth_settings OAuth entry to NONE, unaffected by the external-services walk', async () => {
    const user = userEvent.setup();
    const entity = {
      name: 'toolset',
      _metadata: { folderId: 'public/' },
      auth_settings: { authentication_type: ToolsetAuthType.OAUTH, client_id: 'id' },
    } as unknown as AssetWithVersion;
    const { onDuplicate } = renderModal(entity);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({
      ...entity,
      name: getClonedEntityName(entity.name),
      folderId: 'public/',
      version: '1.0.0',
      display_version: '1.0.0',
      _metadata: { folderId: 'public/', version: '1.0.0' },
      auth_settings: { authentication_type: ToolsetAuthType.NONE },
    });
  });
});
