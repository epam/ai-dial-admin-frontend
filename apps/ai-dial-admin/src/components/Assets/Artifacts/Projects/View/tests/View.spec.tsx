import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { removeProjectFile, uploadProjectFile } from '@/src/app/[lang]/projects/actions';
import { ButtonsI18nKey, EntityFieldsI18nKey, ProjectI18nKey } from '@/src/constants/i18n';
import { DialProjectResource } from '@/src/models/dial/resource';
import { ProjectContextLimits } from '@/src/models/project-context';
import ProjectView from '../View';

vi.mock('@/src/components/Common/MdEditor/MdEditor', () => ({
  default: ({ content, onChangeContent }: { content: string; onChangeContent: (value: string) => void }) => (
    <textarea aria-label="instructions-editor" value={content} onChange={(e) => onChangeContent(e.target.value)} />
  ),
}));

vi.mock('@/src/app/[lang]/projects/actions', () => ({
  getProject: vi.fn(),
  getProjects: vi.fn(),
  getProjectManifest: vi.fn(),
  getContextLimits: vi.fn(),
  removeProject: vi.fn(),
  bulkDeleteProjects: vi.fn(),
  uploadProjectFile: vi.fn(),
  removeProjectFile: vi.fn(),
  moveProjects: vi.fn(),
}));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

const refresh = vi.fn();
const push = vi.fn();

const LIMITS: ProjectContextLimits = {
  allowedExtensions: ['csv', 'pdf'],
  maxFileBytes: 1000,
  maxTotalBytes: 5000,
  maxFiles: 100,
};

const MANIFEST = '---\nname: my-project\ndescription: Does a thing\nowner: team-a\n---\n\nBe helpful.';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({ refresh, push } as unknown as ReturnType<typeof useRouter>);
});

const buildProject = (overrides?: Partial<DialProjectResource>): DialProjectResource => ({
  name: 'my-project',
  path: 'public/my-project',
  folderId: 'public/',
  etag: 'etag-1',
  files: [{ name: 'PROJECT.md' }, { name: 'context/a.csv' }, { name: 'notes/other.txt' }],
  _metadata: { author: 'author@example.com', createdAt: '1700000000000', updatedAt: '1700000001000' },
  ...overrides,
});

const renderView = (manifestContent = MANIFEST, project = buildProject()) =>
  render(<ProjectView project={project} manifestContent={manifestContent} limits={LIMITS} />);

const descriptionBox = () => screen.getByRole('textbox', { name: EntityFieldsI18nKey.description });
const addInput = () => screen.getByLabelText(ButtonsI18nKey.Add, { selector: 'input' });

describe('ProjectView', () => {
  test('renders the path, author, a disabled name, and the fields read from PROJECT.md', () => {
    renderView();

    expect(screen.getByText('public/my-project')).toBeTruthy();
    expect(screen.getByText('author@example.com')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: EntityFieldsI18nKey.name }).hasAttribute('disabled')).toBe(true);
    expect((descriptionBox() as HTMLTextAreaElement).value).toBe('Does a thing');
    expect((screen.getByRole('textbox', { name: 'instructions-editor' }) as HTMLTextAreaElement).value).toBe(
      'Be helpful.',
    );
  });

  test('shows only the Properties tab and no folder field', () => {
    renderView();

    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.queryByRole('tab', { name: /audit/i })).toBeNull();
  });

  test('lists only files under context/, without PROJECT.md or files elsewhere', () => {
    renderView();

    // A tile shows the name without its extension; the extension is its type label.
    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.getByText('CSV')).toBeTruthy();
    expect(screen.queryByText('PROJECT')).toBeNull();
    expect(screen.queryByText('other')).toBeNull();
  });

  test('counts the sizes of the stored context files toward the capacity meter', () => {
    renderView(
      MANIFEST,
      buildProject({
        files: [
          { name: 'PROJECT.md', size: 400 },
          { name: 'context/a.csv', size: 1000 },
        ],
      }),
    );

    // The manifest is not context: only the 1000-byte file counts, out of the 5000-byte total limit.
    expect(
      screen.getByRole('progressbar', { name: ProjectI18nKey.CapacityMeterLabel }).getAttribute('aria-valuenow'),
    ).toBe('20');
  });

  test('treats a stored file with no reported size as empty', () => {
    renderView();

    expect(
      screen.getByRole('progressbar', { name: ProjectI18nKey.CapacityMeterLabel }).getAttribute('aria-valuenow'),
    ).toBe('0');
  });

  test('shows an empty description and the whole text as instructions when PROJECT.md has no frontmatter', () => {
    renderView('Just text.');

    expect((descriptionBox() as HTMLTextAreaElement).value).toBe('');
    expect((screen.getByRole('textbox', { name: 'instructions-editor' }) as HTMLTextAreaElement).value).toBe(
      'Just text.',
    );
  });

  test('shows no Save or Discard until something is staged', () => {
    renderView();

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Discard })).toBeNull();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Delete })).toBeTruthy();
  });

  test('editing the description stages a change without calling Core', async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(descriptionBox(), '!');

    expect(await screen.findByRole('button', { name: ButtonsI18nKey.Save })).toBeTruthy();
    expect(uploadProjectFile).not.toHaveBeenCalled();
  });

  test('saving a description change rewrites PROJECT.md and keeps unknown frontmatter keys', async () => {
    vi.mocked(uploadProjectFile).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderView();

    await user.type(descriptionBox(), '!');
    await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Save }));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(uploadProjectFile).toHaveBeenCalledWith('public/my-project', 'PROJECT.md', expect.any(FormData));
    const formData = vi.mocked(uploadProjectFile).mock.calls[0][2];
    const written = await (formData.get('file') as File).text();
    expect(written).toBe('---\nname: my-project\ndescription: Does a thing!\nowner: team-a\n---\n\nBe helpful.');
  });

  test('adding a context file stages it and writes it under context/ on Save', async () => {
    vi.mocked(uploadProjectFile).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderView();

    await user.upload(addInput(), new File(['x'], 'notes.csv'));
    expect(uploadProjectFile).not.toHaveBeenCalled();
    await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Save }));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(uploadProjectFile).toHaveBeenCalledOnce();
    expect(uploadProjectFile).toHaveBeenCalledWith('public/my-project', 'context/notes.csv', expect.any(FormData));
  });

  test('removing a stored context file deletes it from context/ on Save', async () => {
    vi.mocked(removeProjectFile).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: ProjectI18nKey.RemoveFile }));
    expect(removeProjectFile).not.toHaveBeenCalled();
    await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Save }));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(removeProjectFile).toHaveBeenCalledWith('public/my-project', 'context/a.csv');
  });

  test('saves in order: manifest, then removals, then additions', async () => {
    const calls: string[] = [];
    vi.mocked(uploadProjectFile).mockImplementation(async (_path, filePath) => {
      calls.push(`upload:${filePath}`);
      return { success: true };
    });
    vi.mocked(removeProjectFile).mockImplementation(async (_path, filePath) => {
      calls.push(`remove:${filePath}`);
      return { success: true };
    });
    const user = userEvent.setup();
    renderView();

    await user.type(descriptionBox(), '!');
    await user.click(screen.getByRole('button', { name: ProjectI18nKey.RemoveFile }));
    await user.upload(addInput(), new File(['x'], 'notes.csv'));
    await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Save }));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(calls).toEqual(['upload:PROJECT.md', 'remove:context/a.csv', 'upload:context/notes.csv']);
  });

  test('a failed step stops the save, shows an error and keeps the staged changes', async () => {
    vi.mocked(uploadProjectFile).mockResolvedValue({ success: false, errorHeader: 'Boom', errorMessage: 'nope' });
    const user = userEvent.setup();
    renderView();

    await user.upload(addInput(), new File(['x'], 'notes.csv'));
    await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Save }));

    await vi.waitFor(() => expect(showNotification).toHaveBeenCalledOnce());
    expect(refresh).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeTruthy();
  });

  test('discarding reverts the staged edits without calling Core', async () => {
    const user = userEvent.setup();
    renderView();

    await user.type(descriptionBox(), '!');
    await user.upload(addInput(), new File(['x'], 'notes.csv'));
    await user.click(await screen.findByRole('button', { name: ButtonsI18nKey.Discard }));
    // Discarding asks for confirmation before anything is reverted.
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: ButtonsI18nKey.Discard }));

    expect((descriptionBox() as HTMLTextAreaElement).value).toBe('Does a thing');
    expect(screen.queryByText('notes.csv')).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
    expect(uploadProjectFile).not.toHaveBeenCalled();
    expect(removeProjectFile).not.toHaveBeenCalled();
  });
});
