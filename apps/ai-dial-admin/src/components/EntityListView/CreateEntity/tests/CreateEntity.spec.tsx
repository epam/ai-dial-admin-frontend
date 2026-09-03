import { ButtonsI18nKey, CreateI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

    await waitFor(() => expect(createModel).toHaveBeenCalled());
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

    await waitFor(() => expect(createApp).toHaveBeenCalled());
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

    await waitFor(() => expect(createApp).toHaveBeenCalled());
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

    await waitFor(() => expect(createToolset).toHaveBeenCalled());
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

    await waitFor(() => expect(createModel).toHaveBeenCalled());
    expect(createModel.mock.calls[0][0]).toMatchObject({ displayVersion: '1.0.0' });
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

    await waitFor(() => expect(createSkill).toHaveBeenCalled());
    await waitFor(() => expect(push).toHaveBeenCalled());
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

    await waitFor(() => expect(push).toHaveBeenCalled());
    // The navigation target embeds the resolved path as an encoded query param, so the `/` between
    // the folder and the skill name is itself percent-encoded (`%2F`) — the separator this test
    // guards against being dropped entirely.
    expect(push.mock.calls[0][0]).toContain(encodeURIComponent('public/New folder 1/folder-s2'));
  });
});
