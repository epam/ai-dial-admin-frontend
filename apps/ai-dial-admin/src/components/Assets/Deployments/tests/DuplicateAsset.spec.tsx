import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ToolsetAuthType } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import DuplicateAsset from '../DuplicateAsset';

// A non-numeric last version segment makes `getInitialVersion` fall back to `DEFAULT_NEW_ENTITY_VERSION`
// ('1.0.0'), so the clone's derived version is deterministic without affecting the external-services walk.
const versionsMapFor = (name: string) => ({ [name]: ['1.0.x'] });

const renderModal = (entity: AssetWithVersion, onDuplicate = vi.fn()) => {
  render(
    <DuplicateAsset
      view={ApplicationRoute.AssetsApplications}
      isModalOpen
      entity={entity}
      versionsMap={versionsMapFor(entity.name)}
      onDuplicate={onDuplicate}
      onClose={vi.fn()}
    />,
  );

  return { onDuplicate };
};

describe('DuplicateAsset', () => {
  test('resets an OAuth external service to NONE on duplicate', async () => {
    const user = userEvent.setup();
    const entity = {
      name: 'app',
      folderId: 'public/',
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
      version: '1.0.0',
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
      folderId: 'public/',
      external_services: {
        svc: { auth_settings: { authentication_type: ToolsetAuthType.API_KEY } },
      },
    } as unknown as AssetWithVersion;
    const { onDuplicate } = renderModal(entity);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({ ...entity, version: '1.0.0' });
  });

  test('resets only the OAuth entry in a mix of OAuth and non-OAuth external services', async () => {
    const user = userEvent.setup();
    const entity = {
      name: 'app',
      folderId: 'public/',
      external_services: {
        oauthSvc: { auth_settings: { authentication_type: ToolsetAuthType.OAUTH } },
        apiKeySvc: { auth_settings: { authentication_type: ToolsetAuthType.API_KEY } },
      },
    } as unknown as AssetWithVersion;
    const { onDuplicate } = renderModal(entity);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({
      ...entity,
      version: '1.0.0',
      external_services: {
        oauthSvc: { auth_settings: { authentication_type: ToolsetAuthType.NONE } },
        apiKeySvc: { auth_settings: { authentication_type: ToolsetAuthType.API_KEY } },
      },
    });
  });

  test('is unaffected when the application has no external services', async () => {
    const user = userEvent.setup();
    const entity = { name: 'app', folderId: 'public/' } as unknown as AssetWithVersion;
    const { onDuplicate } = renderModal(entity);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({ ...entity, version: '1.0.0' });
  });

  test('still resets a toolset auth_settings OAuth entry to NONE, unaffected by the external-services walk', async () => {
    const user = userEvent.setup();
    const entity = {
      name: 'toolset',
      folderId: 'public/',
      auth_settings: { authentication_type: ToolsetAuthType.OAUTH, client_id: 'id' },
    } as unknown as AssetWithVersion;
    const { onDuplicate } = renderModal(entity);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({
      ...entity,
      version: '1.0.0',
      auth_settings: { authentication_type: ToolsetAuthType.NONE },
    });
  });
});
