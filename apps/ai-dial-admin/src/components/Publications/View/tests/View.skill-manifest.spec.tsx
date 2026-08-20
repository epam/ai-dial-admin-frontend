import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getSkillManifest, uploadSkillFile } from '@/src/app/[lang]/assets-skills/actions';
import SkillManifestTab from '@/src/components/Publications/Assets/Skill/SkillManifestTab';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ActionType, SkillPublication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PublicationView from '../View';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest: () => vi.fn((fn, ...args) => fn(...args)),
}));

vi.mock('@/src/app/actions/publications', () => ({
  updatePublication: vi.fn().mockResolvedValue({ success: true }),
  approvePublication: vi.fn(),
  declinePublication: vi.fn(),
  deletePublication: vi.fn(),
}));

vi.mock('@/src/app/[lang]/folders-storage/actions', () => ({
  getRules: vi.fn().mockResolvedValue({ success: true, response: {} }),
}));

vi.mock('@/src/app/[lang]/assets-toolsets/actions', () => ({
  signInToolset: vi.fn(),
  signOutToolset: vi.fn(),
}));

vi.mock('@/src/app/[lang]/assets-skills/actions', () => ({
  getSkillManifest: vi.fn(),
  uploadSkillFile: vi.fn(),
  removeSkillFile: vi.fn(),
}));

vi.mock('@/src/context/assets/SkillFolderContext', () => ({
  useSkillFolder: () => ({ fetchFiles: vi.fn(), files: [] }),
  SkillFolderProvider: ({ children }: any) => <>{children}</>,
}));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

// A shallow stand-in for the real `TabsContent` — this suite is about `PublicationView`'s own
// manifest fetch/stage/save wiring, not the Properties/Permissions branches already covered
// elsewhere (`TabsContent.spec.tsx`), so only the Skill-tab branch is reproduced here, using the
// real `SkillManifestTab` (a lightweight component, not a heavy child needing its own mock).
vi.mock('../TabsContent', () => ({
  default: ({ activeTab, skillManifest, onChangeSkillDescription, onChangeSkillBody }: any) =>
    activeTab === EntityViewTab.Skill && skillManifest ? (
      <SkillManifestTab
        name={skillManifest.name}
        description={skillManifest.description}
        body={skillManifest.body}
        onChangeDescription={onChangeSkillDescription}
        onChangeBody={onChangeSkillBody}
      />
    ) : (
      <div role="region" aria-label="properties-stub" />
    ),
}));

const refresh = vi.fn();
const push = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({ push, refresh } as unknown as ReturnType<typeof useRouter>);
});

const manifestContent = '---\nname: my-skill\ndescription: Does a thing\n---\nBody text.\n';

const buildPublication = (): SkillPublication =>
  ({
    path: 'publications/test',
    requestName: 'test-request',
    author: 'author@example.com',
    createdAt: '2024-01-01',
    status: 'pending',
    action: ActionType.ADD,
    folderId: 'folder1',
    rules: [],
    skillResources: [
      {
        sourceUrl: 'skills/src/my-skill',
        targetUrl: 'skills/public/my-skill',
        reviewUrl: 'skills/review/my-skill',
        action: ActionType.ADD,
        skillResource: { name: 'my-skill', path: 'review/my-skill', folderId: 'review/', files: [] },
      },
    ],
  }) as unknown as SkillPublication;

describe('PublicationView :: Skill manifest tab', () => {
  test('fetches the manifest for the skill resource path on first Skill-tab activation', async () => {
    vi.mocked(getSkillManifest).mockResolvedValue({ success: true, response: manifestContent });
    const user = userEvent.setup();
    render(<PublicationView view={ApplicationRoute.SkillPublications} publication={buildPublication()} />);

    await user.click(screen.getByRole('tab', { name: 'Tabs.Skill' }));

    await waitFor(() => expect(getSkillManifest).toHaveBeenCalledWith('review/my-skill'));
    const nameInput = (await screen.findByLabelText(EntityFieldsI18nKey.name)) as HTMLInputElement;
    expect(nameInput.value).toBe('my-skill');
  });

  test('editing description stages a change and saving reassembles and uploads SKILL.md', async () => {
    vi.mocked(getSkillManifest).mockResolvedValue({ success: true, response: manifestContent });
    vi.mocked(uploadSkillFile).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<PublicationView view={ApplicationRoute.SkillPublications} publication={buildPublication()} />);

    await user.click(screen.getByRole('tab', { name: 'Tabs.Skill' }));
    const descriptionInput = await screen.findByLabelText(new RegExp(EntityFieldsI18nKey.description));
    await user.type(descriptionInput, '!');

    const saveButton = await screen.findByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => expect(uploadSkillFile).toHaveBeenCalled());
    const [path, filePath, formData] = vi.mocked(uploadSkillFile).mock.calls[0];
    expect(path).toBe('review/my-skill');
    expect(filePath).toBe('SKILL.md');
    const uploadedContent = await (formData.get('file') as File).text();
    expect(uploadedContent).toContain('description: Does a thing!');
  });

  test('discarding a staged description edit reverts it without calling Core', async () => {
    vi.mocked(getSkillManifest).mockResolvedValue({ success: true, response: manifestContent });
    const user = userEvent.setup();
    render(<PublicationView view={ApplicationRoute.SkillPublications} publication={buildPublication()} />);

    await user.click(screen.getByRole('tab', { name: 'Tabs.Skill' }));
    const descriptionInput = await screen.findByLabelText(new RegExp(EntityFieldsI18nKey.description));
    await user.type(descriptionInput, '!');

    const discardButton = await screen.findByRole('button', { name: /discard/i });
    await user.click(discardButton);
    const confirmButton = await screen.findByRole('button', { name: /discard/i });
    await user.click(confirmButton);

    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    expect(uploadSkillFile).not.toHaveBeenCalled();
  });

  test('shows an error notification when the manifest fails to load', async () => {
    vi.mocked(getSkillManifest).mockResolvedValue({ success: false, errorMessage: 'boom' });
    const user = userEvent.setup();
    render(<PublicationView view={ApplicationRoute.SkillPublications} publication={buildPublication()} />);

    await user.click(screen.getByRole('tab', { name: 'Tabs.Skill' }));

    await waitFor(() => expect(showNotification).toHaveBeenCalled());
  });
});
