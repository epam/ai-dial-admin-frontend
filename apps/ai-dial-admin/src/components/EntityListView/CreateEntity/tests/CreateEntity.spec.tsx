import { ButtonsI18nKey, CreateI18nKey, EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { Mock, describe, expect, test, vi } from 'vitest';
import CreateEntity from '../CreateEntity';
import { ApplicationRoute } from '@/src/types/routes';

describe('CreateEntity', () => {
  test('renders popup and adapter properties', () => {
    render(<CreateEntity route={ApplicationRoute.Models} isModalOpen={true} onClose={vi.fn()} names={['model1']} />);
    expect(screen.getByText(CreateI18nKey.Title)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Create)).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<CreateEntity route={ApplicationRoute.Models} isModalOpen={true} onClose={onClose} names={[]} />);
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(onClose).toHaveBeenCalled();
  });

  test('does not inject a version into the create body for AssetsModels, unlike AssetsApplications', async () => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });

    const createModel = vi.fn().mockResolvedValue({ success: true, response: { name: 'model1' } });
    render(
      <CreateEntity
        route={ApplicationRoute.PlatformModels}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createModel}
      />,
    );

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() => expect(createModel).toHaveBeenCalled());
    expect(createModel.mock.calls[0][0]).not.toHaveProperty('version');

    const createApp = vi.fn().mockResolvedValue({ success: true, response: { name: 'app1' } });
    render(
      <CreateEntity
        route={ApplicationRoute.AssetsApplications}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createApp}
      />,
    );

    fireEvent.click(screen.getAllByText(ButtonsI18nKey.Create)[1]);

    await vi.waitFor(() => expect(createApp).toHaveBeenCalled());
    expect(createApp.mock.calls[0][0]).toMatchObject({ version: '1.0.0' });
  });

  test('omits the version field and does not require it when creating into the platform bucket', async () => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });

    const createApp = vi.fn().mockResolvedValue({ success: true, response: { name: 'platform-app' } });
    const context = () => ({ filePath: 'platform/', fetchFiles: vi.fn() });

    render(
      <CreateEntity
        route={ApplicationRoute.AssetsApplications}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createApp}
        context={context as any}
      />,
    );

    expect(screen.queryByDisplayValue('1.0.0')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() => expect(createApp).toHaveBeenCalled());
    expect(createApp.mock.calls[0][0]).not.toHaveProperty('version');
  });

  test('omits the version field and does not require it when creating a toolset into the platform bucket', async () => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });

    const createToolset = vi.fn().mockResolvedValue({ success: true, response: { name: 'platform-toolset' } });
    const context = () => ({ filePath: 'platform/', fetchFiles: vi.fn() });

    render(
      <CreateEntity
        route={ApplicationRoute.AssetsToolsets}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createToolset}
        context={context as any}
      />,
    );

    expect(screen.queryByDisplayValue('1.0.0')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() => expect(createToolset).toHaveBeenCalled());
    expect(createToolset.mock.calls[0][0]).not.toHaveProperty('version');
  });

  test('seeds the default display version for AssetsModels', async () => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });

    const createModel = vi.fn().mockResolvedValue({ success: true, response: { name: 'model1' } });
    render(
      <CreateEntity
        route={ApplicationRoute.PlatformModels}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createModel}
      />,
    );

    expect(screen.getByDisplayValue('1.0.0')).toBeInTheDocument();

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() => expect(createModel).toHaveBeenCalled());
    expect(createModel.mock.calls[0][0]).toMatchObject({ displayVersion: '1.0.0' });
  });

  test('starts a new platform model with userRoles: []', async () => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });

    const createModel = vi.fn().mockResolvedValue({ success: true, response: { name: 'model1' } });
    render(
      <CreateEntity
        route={ApplicationRoute.PlatformModels}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createModel}
      />,
    );

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() => expect(createModel).toHaveBeenCalled());
    expect(createModel.mock.calls[0][0]).toMatchObject({ userRoles: [] });
  });

  test('starts a new platform route with userRoles: []', async () => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });

    const createRoute = vi.fn().mockResolvedValue({ success: true, response: { name: 'route1' } });
    render(
      <CreateEntity
        route={ApplicationRoute.PlatformRoutes}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createRoute}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}*` }), {
      target: { value: 'route1' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.paths}*` }), {
      target: { value: '/v1' },
    });
    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() => expect(createRoute).toHaveBeenCalled());
    expect(createRoute).toHaveBeenCalledWith(expect.objectContaining({ userRoles: [], paths: ['/v1'] }));
  });

  test('starts a new platform-bucket application with user_roles: []', async () => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });

    const createApp = vi.fn().mockResolvedValue({ success: true, response: { name: 'platform-app' } });
    const context = () => ({ filePath: 'platform/', fetchFiles: vi.fn() });

    render(
      <CreateEntity
        route={ApplicationRoute.AssetsApplications}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createApp}
        context={context as any}
      />,
    );

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() => expect(createApp).toHaveBeenCalled());
    expect(createApp.mock.calls[0][0]).toMatchObject({ user_roles: [] });
  });

  test('starts a new platform-bucket toolset with user_roles: []', async () => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });

    const createToolset = vi.fn().mockResolvedValue({ success: true, response: { name: 'platform-toolset' } });
    const context = () => ({ filePath: 'platform/', fetchFiles: vi.fn() });

    render(
      <CreateEntity
        route={ApplicationRoute.AssetsToolsets}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createToolset}
        context={context as any}
      />,
    );

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() => expect(createToolset).toHaveBeenCalled());
    expect(createToolset.mock.calls[0][0]).toMatchObject({ user_roles: [] });
  });

  test('leaves the admin-BE (public-bucket) application create body without userRoles/user_roles', async () => {
    (useRouter as Mock).mockReturnValue({ push: vi.fn() });

    const createApp = vi.fn().mockResolvedValue({ success: true, response: { name: 'app1' } });
    render(
      <CreateEntity
        route={ApplicationRoute.AssetsApplications}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createApp}
      />,
    );

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() => expect(createApp).toHaveBeenCalled());
    expect(createApp.mock.calls[0][0]).not.toHaveProperty('userRoles');
    expect(createApp.mock.calls[0][0]).not.toHaveProperty('user_roles');
  });

  test('navigates a Catalog model created from Core metadata to its encoded detail route', async () => {
    const push = vi.fn();
    (useRouter as Mock).mockReturnValue({ push });

    const createModel = vi.fn().mockResolvedValue({
      success: true,
      response: { _metadata: { name: 'anthropic.claude-haiku-4-5-20251001-v1:0' } },
    });
    render(
      <CreateEntity
        route={ApplicationRoute.PlatformModels}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createModel}
      />,
    );

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith('/platform-models/anthropic.claude-haiku-4-5-20251001-v1%3A0'),
    );
  });

  test('navigates to a path built from folderId + name for AssetsSkills, with no version suffix', async () => {
    const push = vi.fn();
    (useRouter as Mock).mockReturnValue({ push });

    const createSkill = vi.fn().mockResolvedValue({ success: true });
    render(
      <CreateEntity
        route={ApplicationRoute.Skills}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createSkill}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.name}*` }), {
      target: { value: 'my-skill' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.description}*` }), {
      target: { value: 'Does a thing' },
    });

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() => expect(createSkill).toHaveBeenCalled());
    await vi.waitFor(() => expect(push).toHaveBeenCalled());
    expect(push.mock.calls[0][0]).not.toContain('undefined');
    expect(push.mock.calls[0][0]).toContain('my-skill');
  });

  test('inserts the missing separator when navigating into a skill created inside a nested folder', async () => {
    const push = vi.fn();
    (useRouter as Mock).mockReturnValue({ push });

    const createSkill = vi.fn().mockResolvedValue({ success: true });
    // A folder's own path (once navigated into) carries no trailing slash, unlike the root default
    // — concatenating it verbatim previously produced a path with no separator (`New folder 1my-skill`).
    const context = () => ({
      filePath: 'public/New folder 1',
      fetchFiles: vi.fn(),
    });

    render(
      <CreateEntity
        route={ApplicationRoute.Skills}
        isModalOpen={true}
        onClose={vi.fn()}
        names={[]}
        versionsMap={{}}
        createEntity={createSkill}
        context={context as any}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.name}*` }), {
      target: { value: 'folder-s2' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.description}*` }), {
      target: { value: 'Does a thing' },
    });

    fireEvent.click(screen.getByText(ButtonsI18nKey.Create));

    await vi.waitFor(() => expect(push).toHaveBeenCalled());
    // The navigation target embeds the resolved path as an encoded query param, so the `/` between
    // the folder and the skill name is itself percent-encoded (`%2F`) — the separator this test
    // guards against being dropped entirely.
    expect(push.mock.calls[0][0]).toContain(encodeURIComponent('public/New folder 1/folder-s2'));
  });

  test('shows an inline error and permits creation after correcting an existing Catalog Schema ID', async () => {
    const user = userEvent.setup();
    const existingId = 'https://dial.epam.com/catalog_schemas/existing';
    const correctedId = 'https://dial.epam.com/catalog_schemas/corrected';
    const createCatalogSchema = vi.fn().mockResolvedValue({ success: false });
    const getCatalogSchemaById = vi.fn().mockImplementation(async (id: string) => ({
      success: id === existingId,
      response: id === existingId ? {} : undefined,
    }));

    render(
      <CreateEntity
        route={ApplicationRoute.PlatformCatalogSchemas}
        isModalOpen={true}
        isModal
        onClose={vi.fn()}
        names={[]}
        createEntity={createCatalogSchema}
        getEntityById={getCatalogSchemaById}
        initialValues={{
          name: 'catalog-schema',
          $id: existingId,
          'dial:catalogEntityType': 'agent',
          'dial:catalogDisplayName': 'Catalog schema',
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    expect(await screen.findByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
    expect(getCatalogSchemaById).toHaveBeenCalledWith(existingId);
    expect(createCatalogSchema).not.toHaveBeenCalled();

    const idInput = screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}*` });
    await user.clear(idInput);
    await user.type(idInput, correctedId);

    expect(screen.queryByText(ErrorI18nKey.NameExists)).toBeNull();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await vi.waitFor(() =>
      expect(createCatalogSchema).toHaveBeenCalledWith(expect.objectContaining({ $id: correctedId })),
    );
  });

  test('uses the normal Catalog Schema create callback when the ID does not resolve', async () => {
    const user = userEvent.setup();
    const id = 'https://dial.epam.com/catalog_schemas/new';
    const createCatalogSchema = vi.fn().mockResolvedValue({ success: false });
    const getCatalogSchemaById = vi.fn().mockResolvedValue({ success: false });

    render(
      <CreateEntity
        route={ApplicationRoute.PlatformCatalogSchemas}
        isModalOpen={true}
        isModal
        onClose={vi.fn()}
        names={[]}
        createEntity={createCatalogSchema}
        getEntityById={getCatalogSchemaById}
        initialValues={{
          name: 'catalog-schema',
          $id: id,
          'dial:catalogEntityType': 'agent',
          'dial:catalogDisplayName': 'Catalog schema',
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await vi.waitFor(() => expect(createCatalogSchema).toHaveBeenCalledWith(expect.objectContaining({ $id: id })));
  });

  test('uses the normal Catalog Schema create callback when ID resolution fails', async () => {
    const user = userEvent.setup();
    const id = 'https://dial.epam.com/catalog_schemas/unavailable';
    const createCatalogSchema = vi.fn().mockResolvedValue({ success: false });
    const getCatalogSchemaById = vi.fn().mockRejectedValue(new Error('Core is unavailable'));

    render(
      <CreateEntity
        route={ApplicationRoute.PlatformCatalogSchemas}
        isModalOpen={true}
        isModal
        onClose={vi.fn()}
        names={[]}
        createEntity={createCatalogSchema}
        getEntityById={getCatalogSchemaById}
        initialValues={{
          name: 'catalog-schema',
          $id: id,
          'dial:catalogEntityType': 'agent',
          'dial:catalogDisplayName': 'Catalog schema',
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await vi.waitFor(() => expect(createCatalogSchema).toHaveBeenCalledWith(expect.objectContaining({ $id: id })));
  });

  test('shows an inline error and permits creation after correcting an existing Platform App Runner ID', async () => {
    const user = userEvent.setup();
    const existingId = 'https://dial.epam.com/application_type_schemas/existing';
    const correctedId = 'https://dial.epam.com/application_type_schemas/corrected';
    const createRunner = vi.fn().mockResolvedValue({ success: false });
    const getResolvedRunnerSchema = vi.fn().mockImplementation(async (id: string) => ({
      success: id === existingId,
      response: id === existingId ? {} : undefined,
    }));

    render(
      <CreateEntity
        route={ApplicationRoute.PlatformAppRunners}
        isModalOpen={true}
        isModal
        onClose={vi.fn()}
        names={[]}
        createEntity={createRunner}
        getEntityById={getResolvedRunnerSchema}
        initialValues={{
          name: 'app-runner',
          $id: existingId,
          'dial:applicationTypeDisplayName': 'App Runner',
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    expect(await screen.findByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
    expect(getResolvedRunnerSchema).toHaveBeenCalledWith(existingId);
    expect(createRunner).not.toHaveBeenCalled();

    const idInput = screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}*` });
    await user.clear(idInput);
    await user.type(idInput, correctedId);

    expect(screen.queryByText(ErrorI18nKey.NameExists)).toBeNull();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await vi.waitFor(() => expect(createRunner).toHaveBeenCalledWith(expect.objectContaining({ $id: correctedId })));
  });

  test('uses the normal Platform App Runner create callback when ID resolution fails', async () => {
    const user = userEvent.setup();
    const id = 'https://dial.epam.com/application_type_schemas/unavailable';
    const createRunner = vi.fn().mockResolvedValue({ success: false });
    const getResolvedRunnerSchema = vi.fn().mockRejectedValue(new Error('Core is unavailable'));

    render(
      <CreateEntity
        route={ApplicationRoute.PlatformAppRunners}
        isModalOpen={true}
        isModal
        onClose={vi.fn()}
        names={[]}
        createEntity={createRunner}
        getEntityById={getResolvedRunnerSchema}
        initialValues={{
          name: 'app-runner',
          $id: id,
          'dial:applicationTypeDisplayName': 'App Runner',
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await vi.waitFor(() => expect(createRunner).toHaveBeenCalledWith(expect.objectContaining({ $id: id })));
  });
});
