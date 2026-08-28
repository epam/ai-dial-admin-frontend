import { ColDef } from 'ag-grid-community';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { getSkillManifest, moveSkills, removeSkillFile, uploadSkillFile } from '@/src/app/[lang]/skills/actions';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialSkillResource } from '@/src/models/dial/resource';
import SkillView from '../View';

let capturedColumnDefs: ColDef[] | undefined;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: (props: { columnDefs?: ColDef[] }) => {
    capturedColumnDefs = props.columnDefs;
    return <section aria-label="skill-files" />;
  },
}));

vi.mock('@/src/components/Common/FilePath/FilePath', () => ({
  default: ({ value, onChange }: { value?: string; onChange: (v: string) => void }) => (
    <div>
      <span>{value}</span>
      <button onClick={() => onChange('archive/')}>Change folder</button>
    </div>
  ),
}));

vi.mock('@/src/app/[lang]/skills/actions', () => ({
  getSkill: vi.fn(),
  getSkills: vi.fn(),
  getSkillManifest: vi.fn(),
  removeSkill: vi.fn(),
  bulkDeleteSkills: vi.fn(),
  uploadSkillFile: vi.fn(),
  removeSkillFile: vi.fn(),
  moveSkills: vi.fn(),
}));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

const refresh = vi.fn();
const push = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({ refresh, push } as unknown as ReturnType<typeof useRouter>);
});

const buildSkill = (overrides?: Partial<DialSkillResource>): DialSkillResource => ({
  name: 'my-skill',
  path: 'public/my-skill',
  folderId: 'public/',
  etag: 'etag-1',
  author: 'author@example.com',
  createdAt: 1700000000000,
  updatedAt: 1700000001000,
  files: [{ name: 'SKILL.md' }],
  ...overrides,
});

describe('SkillView', () => {
  test('renders the skill name, path, author, dates, and the reused files grid', () => {
    render(<SkillView skill={buildSkill()} />);

    expect(screen.getAllByText('my-skill').length).toBeGreaterThan(0);
    expect(screen.getByText('public/my-skill')).toBeInTheDocument();
    expect(screen.getByText('author@example.com')).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.createdAt)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.updatedAt)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'skill-files' })).toBeInTheDocument();
  });

  test('shows no Save/Discard buttons until something is staged', () => {
    render(<SkillView skill={buildSkill()} />);

    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /discard/i })).not.toBeInTheDocument();
  });

  test('does not render an Audit tab', () => {
    render(<SkillView skill={buildSkill()} />);

    expect(screen.queryByRole('tab', { name: /audit/i })).not.toBeInTheDocument();
  });

  test('shows Save/Discard once a file is staged for upload, and applies it on Save', async () => {
    vi.mocked(uploadSkillFile).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<SkillView skill={buildSkill()} />);

    const file = new File(['content'], 'notes.md', { type: 'text/markdown' });
    const input = screen.getByLabelText(/add/i, { selector: 'input' });
    await user.upload(input, file);

    const saveButton = await screen.findByRole('button', { name: /save/i });
    await user.click(saveButton);

    expect(uploadSkillFile).toHaveBeenCalledWith('public/my-skill', 'notes.md', expect.any(FormData));
    expect(refresh).toHaveBeenCalled();
  });

  test('discarding a staged add clears it without calling Core', async () => {
    const user = userEvent.setup();
    render(<SkillView skill={buildSkill()} />);

    const file = new File(['content'], 'notes.md');
    const input = screen.getByLabelText(/add/i, { selector: 'input' });
    await user.upload(input, file);

    const discardButton = await screen.findByRole('button', { name: /discard/i });
    await user.click(discardButton);
    const confirmButton = await screen.findByRole('button', { name: /discard/i });
    await user.click(confirmButton);

    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    expect(uploadSkillFile).not.toHaveBeenCalled();
  });

  test('removing an existing file stages it, applying the removal on Save', async () => {
    vi.mocked(removeSkillFile).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<SkillView skill={buildSkill({ files: [{ name: 'notes.md' }] })} />);

    const actionsColumn = capturedColumnDefs?.find((col) => col.field === ACTIONS_COLUMN_CEL_ID);
    const removeItem = (
      actionsColumn?.cellRendererParams as { items: { id: string; onClick: (file: unknown) => void }[] }
    )?.items.find((item) => item.id === 'ActionMenuOperation.Remove');
    removeItem?.onClick({ name: 'notes.md' });

    const saveButton = await screen.findByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => expect(removeSkillFile).toHaveBeenCalledWith('public/my-skill', 'notes.md'));
    expect(refresh).toHaveBeenCalled();
  });

  test('changing the destination folder and saving moves the skill and navigates to its new path', async () => {
    vi.mocked(moveSkills).mockResolvedValue([{ success: true }]);
    const user = userEvent.setup();
    render(<SkillView skill={buildSkill()} />);

    await user.click(screen.getByRole('button', { name: 'Change folder' }));
    const saveButton = await screen.findByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => expect(moveSkills).toHaveBeenCalledWith(['public/my-skill'], 'archive'));
    expect(push).toHaveBeenCalled();
  });

  test('shows an error notification and does not navigate when Core rejects the move', async () => {
    vi.mocked(moveSkills).mockResolvedValue([{ success: false, errorMessage: 'destination already exists' }]);
    const user = userEvent.setup();
    render(<SkillView skill={buildSkill()} />);

    await user.click(screen.getByRole('button', { name: 'Change folder' }));
    const saveButton = await screen.findByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  test('shows an error notification instead of failing silently when moveSkills rejects', async () => {
    vi.mocked(moveSkills).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    render(<SkillView skill={buildSkill()} />);

    await user.click(screen.getByRole('button', { name: 'Change folder' }));
    const saveButton = await screen.findByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
    expect(push).not.toHaveBeenCalled();
  });

  describe('Skill tab', () => {
    const manifestContent = '---\nname: my-skill\ndescription: Does a thing\n---\nBody text.\n';

    test('fetches and shows the parsed manifest on first activation', async () => {
      vi.mocked(getSkillManifest).mockResolvedValue({ success: true, response: manifestContent });
      const user = userEvent.setup();
      render(<SkillView skill={buildSkill()} />);

      await user.click(screen.getByRole('tab', { name: 'Tabs.Skill' }));

      await waitFor(() => expect(getSkillManifest).toHaveBeenCalledWith('public/my-skill'));
      const nameInput = (await screen.findByLabelText(EntityFieldsI18nKey.name)) as HTMLInputElement;
      expect(nameInput.value).toBe('my-skill');
      expect(nameInput).toBeDisabled();
    });

    test('shows an error notification when the manifest fails to load', async () => {
      vi.mocked(getSkillManifest).mockResolvedValue({ success: false, errorMessage: 'boom' });
      const user = userEvent.setup();
      render(<SkillView skill={buildSkill()} />);

      await user.click(screen.getByRole('tab', { name: 'Tabs.Skill' }));

      await waitFor(() => expect(showNotification).toHaveBeenCalled());
    });

    test('editing description stages a change, and saving reassembles and uploads SKILL.md', async () => {
      vi.mocked(getSkillManifest).mockResolvedValue({ success: true, response: manifestContent });
      vi.mocked(uploadSkillFile).mockResolvedValue({ success: true });
      const user = userEvent.setup();
      render(<SkillView skill={buildSkill()} />);

      await user.click(screen.getByRole('tab', { name: 'Tabs.Skill' }));
      const descriptionInput = await screen.findByLabelText(new RegExp(EntityFieldsI18nKey.description));
      await user.type(descriptionInput, '!');

      const saveButton = await screen.findByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => expect(uploadSkillFile).toHaveBeenCalled());
      const [path, filePath, formData] = vi.mocked(uploadSkillFile).mock.calls[0];
      expect(path).toBe('public/my-skill');
      expect(filePath).toBe('SKILL.md');
      const uploadedContent = await (formData.get('file') as File).text();
      expect(uploadedContent).toContain('description: Does a thing!');
      expect(refresh).toHaveBeenCalled();
    });

    test('discarding a staged description edit reverts it without calling Core', async () => {
      vi.mocked(getSkillManifest).mockResolvedValue({ success: true, response: manifestContent });
      const user = userEvent.setup();
      render(<SkillView skill={buildSkill()} />);

      await user.click(screen.getByRole('tab', { name: 'Tabs.Skill' }));
      const descriptionInput = (await screen.findByLabelText(
        new RegExp(EntityFieldsI18nKey.description),
      )) as HTMLTextAreaElement;
      await user.type(descriptionInput, '!');

      const discardButton = await screen.findByRole('button', { name: /discard/i });
      await user.click(discardButton);
      const confirmButton = await screen.findByRole('button', { name: /discard/i });
      await user.click(confirmButton);

      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
      expect(uploadSkillFile).not.toHaveBeenCalled();
    });
  });
});
