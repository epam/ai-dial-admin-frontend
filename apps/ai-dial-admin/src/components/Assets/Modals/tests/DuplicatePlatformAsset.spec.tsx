import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getResolvedRunnerSchema } from '@/src/app/[lang]/platform-app-runners/actions';
import { ButtonsI18nKey, EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { PlatformAsset, ToolsetAuthType } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import DuplicatePlatformAsset from '../DuplicatePlatformAsset';

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getResolvedRunnerSchema: vi.fn(),
}));

const model = { name: 'gpt-4', displayName: 'GPT-4', endpoint: 'http://model/chat' } as PlatformAsset;
const runner = {
  name: 'runner',
  $id: 'http://runner/schema',
  'dial:applicationTypeDisplayName': 'Runner',
} as unknown as PlatformAsset;

const renderModal = (
  view: ApplicationRoute,
  entity: PlatformAsset,
  onDuplicate = vi.fn(),
  onClose = vi.fn(),
  names: string[] = [],
) => {
  render(
    <DuplicatePlatformAsset
      view={view}
      isModalOpen
      names={names}
      entity={entity}
      onClose={onClose}
      onDuplicate={onDuplicate}
    />,
  );

  return { onDuplicate, onClose };
};

describe('DuplicatePlatformAsset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getResolvedRunnerSchema).mockResolvedValue({ success: false });
  });

  test('Should offer only an id and a display name, these assets having no version or folder', () => {
    renderModal(ApplicationRoute.PlatformModels, model);

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  test('Should suffix the model id without brackets, which Core rejects in a resource name', () => {
    renderModal(ApplicationRoute.PlatformModels, model);

    expect(screen.getAllByRole('textbox')[0]).toHaveValue('gpt-4-copy');
  });

  test('Should duplicate a model under the edited name', async () => {
    const user = userEvent.setup();
    const { onDuplicate } = renderModal(ApplicationRoute.PlatformModels, model);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({ ...model, name: 'gpt-4-copy' });
    expect(getResolvedRunnerSchema).not.toHaveBeenCalled();
  });

  test('duplicates an app runner under an edited storage name and ID', async () => {
    const user = userEvent.setup();
    const { onDuplicate } = renderModal(ApplicationRoute.PlatformAppRunners, runner);
    const idInput = screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}*` });

    expect(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.name}*` })).toHaveValue('runner-copy');
    expect(idInput).toHaveValue('http://runner/schema-copy');

    fireEvent.change(idInput, { target: { value: 'http://runner/other' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    await waitFor(() => expect(getResolvedRunnerSchema).toHaveBeenCalledWith('http://runner/other'));
    expect(onDuplicate).toHaveBeenCalledWith({ ...runner, name: 'runner-copy', $id: 'http://runner/other' });
  });

  test('Should close without duplicating on cancel', async () => {
    const user = userEvent.setup();
    const { onDuplicate, onClose } = renderModal(ApplicationRoute.PlatformModels, model);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onClose).toHaveBeenCalled();
    expect(onDuplicate).not.toHaveBeenCalled();
  });

  test('renders storage name, ID, and display name fields for an app runner', () => {
    renderModal(ApplicationRoute.PlatformAppRunners, runner);

    expect(screen.getAllByRole('textbox')).toHaveLength(3);
    expect(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.name}*` })).toHaveValue('runner-copy');
  });

  test('renders an inline error when an app runner storage name exists', () => {
    renderModal(ApplicationRoute.PlatformAppRunners, runner, vi.fn(), vi.fn(), ['taken-name']);

    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.name}*` }), {
      target: { value: 'taken-name' },
    });

    expect(screen.getByText(ErrorI18nKey.LabelExists)).toBeInTheDocument();
  });

  test('blocks an app runner duplicate when Core resolves its declared ID and clears the error after editing', async () => {
    const user = userEvent.setup();
    const onDuplicate = vi.fn();
    vi.mocked(getResolvedRunnerSchema).mockResolvedValue({ success: true, response: {} });
    renderModal(ApplicationRoute.PlatformAppRunners, runner, onDuplicate);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    await waitFor(() => expect(screen.getByText(ErrorI18nKey.NameExists)).toBeInTheDocument());
    expect(onDuplicate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}*` }), {
      target: { value: 'http://runner/available' },
    });

    await waitFor(() => expect(screen.queryByText(ErrorI18nKey.NameExists)).toBeNull());
  });

  test('Should render only a name field for a route, which has no displayName', () => {
    const route = { name: 'my-route' } as PlatformAsset;
    renderModal(ApplicationRoute.PlatformRoutes, route);

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  test('Should render only a name field for a role, which has no displayName', () => {
    const role = { name: 'admin-role' } as PlatformAsset;
    renderModal(ApplicationRoute.PlatformRoles, role);

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  // Regression: platform-bucket applications/toolsets duplicate the flat, unversioned way every
  // other platform entity does (design.md's `platform-applications`/`platform-toolsets`
  // capabilities) — but their display name is `display_name` (snake_case), not `displayName`.
  describe.each([
    { view: ApplicationRoute.AssetsApplications, label: 'application' },
    { view: ApplicationRoute.AssetsToolsets, label: 'toolset' },
  ])('a platform-bucket $label', ({ view }) => {
    const platformEntity = { name: 'pl_Ts', display_name: 'Platform Thing', folderId: 'platform/' } as PlatformAsset;

    test('offers only an id and a display name, this asset having no version or folder', () => {
      renderModal(view, platformEntity);

      expect(screen.getAllByRole('textbox')).toHaveLength(2);
    });

    test('suffixes the name without brackets and duplicates under the edited name and display_name', async () => {
      const user = userEvent.setup();
      const { onDuplicate } = renderModal(view, platformEntity);

      expect(screen.getAllByRole('textbox')[0]).toHaveValue('pl_Ts-copy');

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

      expect(onDuplicate).toHaveBeenCalledWith({ ...platformEntity, name: 'pl_Ts-copy' });
    });
  });

  // Regression: Core never returns a real client_secret on read, so an OAuth toolset or external
  // service copied verbatim onto the clone fails Core's write-time validation.
  describe('a platform-bucket toolset with OAuth auth settings', () => {
    const toolset = {
      name: 'pl_Ts',
      display_name: 'Platform Toolset',
      auth_settings: { authentication_type: ToolsetAuthType.OAUTH, client_id: 'id' },
    } as unknown as PlatformAsset;

    test('resets auth_settings to NONE on duplicate', async () => {
      const user = userEvent.setup();
      const { onDuplicate } = renderModal(ApplicationRoute.AssetsToolsets, toolset);

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

      expect(onDuplicate).toHaveBeenCalledWith({
        ...toolset,
        name: 'pl_Ts-copy',
        auth_settings: { authentication_type: ToolsetAuthType.NONE },
      });
    });
  });

  test('leaves a platform-bucket toolset with non-OAuth auth settings unchanged on duplicate', async () => {
    const user = userEvent.setup();
    const toolset = {
      name: 'pl_Ts',
      display_name: 'Platform Toolset',
      auth_settings: { authentication_type: ToolsetAuthType.API_KEY, api_key_header: 'X-Key' },
    } as unknown as PlatformAsset;
    const { onDuplicate } = renderModal(ApplicationRoute.AssetsToolsets, toolset);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({ ...toolset, name: 'pl_Ts-copy' });
  });

  describe('a platform-bucket application with external services', () => {
    test('resets an OAuth external service to NONE on duplicate', async () => {
      const user = userEvent.setup();
      const application = {
        name: 'pl_App',
        display_name: 'Platform Application',
        external_services: {
          svc: {
            display_name: 'Service',
            auth_settings: { authentication_type: ToolsetAuthType.OAUTH, client_id: 'id' },
          },
        },
      } as unknown as PlatformAsset;
      const { onDuplicate } = renderModal(ApplicationRoute.AssetsApplications, application);

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

      expect(onDuplicate).toHaveBeenCalledWith({
        ...application,
        name: 'pl_App-copy',
        external_services: {
          svc: {
            display_name: 'Service',
            auth_settings: { authentication_type: ToolsetAuthType.NONE },
          },
        },
      });
    });

    test('resets only the OAuth entry in a mix of OAuth and non-OAuth external services', async () => {
      const user = userEvent.setup();
      const application = {
        name: 'pl_App',
        display_name: 'Platform Application',
        external_services: {
          oauthSvc: { auth_settings: { authentication_type: ToolsetAuthType.OAUTH } },
          apiKeySvc: { auth_settings: { authentication_type: ToolsetAuthType.API_KEY } },
        },
      } as unknown as PlatformAsset;
      const { onDuplicate } = renderModal(ApplicationRoute.AssetsApplications, application);

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

      expect(onDuplicate).toHaveBeenCalledWith({
        ...application,
        name: 'pl_App-copy',
        external_services: {
          oauthSvc: { auth_settings: { authentication_type: ToolsetAuthType.NONE } },
          apiKeySvc: { auth_settings: { authentication_type: ToolsetAuthType.API_KEY } },
        },
      });
    });

    test('is unaffected when the application has no external services', async () => {
      const user = userEvent.setup();
      const application = { name: 'pl_App', display_name: 'Platform Application' } as unknown as PlatformAsset;
      const { onDuplicate } = renderModal(ApplicationRoute.AssetsApplications, application);

      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

      expect(onDuplicate).toHaveBeenCalledWith({ ...application, name: 'pl_App-copy' });
    });
  });
});
