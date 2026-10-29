import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getContextLimits, getProjectManifest, uploadProjectFile } from '@/src/app/[lang]/projects/actions';
import { getSkillManifest, uploadSkillFile } from '@/src/app/[lang]/skills/actions';
import { updatePublication } from '@/src/app/actions/publications';
import { ActionType, ProjectPublication, SkillPublication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ComplexResourcePublicationView from '../ComplexResourceView';

vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest: () => vi.fn((fn, ...args) => fn(...args)),
}));

vi.mock('@/src/app/actions/publications', () => ({ updatePublication: vi.fn() }));
vi.mock('@/src/app/[lang]/folders-storage/actions', () => ({ getRules: vi.fn() }));

vi.mock('@/src/app/[lang]/projects/actions', () => ({
  getProject: vi.fn(),
  getProjects: vi.fn(),
  getProjectManifest: vi.fn(),
  getContextLimits: vi.fn(),
  uploadProjectFile: vi.fn(),
  removeProjectFile: vi.fn(),
}));

vi.mock('@/src/app/[lang]/skills/actions', () => ({
  getSkills: vi.fn(),
  getSkillManifest: vi.fn(),
  uploadSkillFile: vi.fn(),
  removeSkillFile: vi.fn(),
}));

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification }),
}));

vi.mock('@/src/components/EntityHeaderControls/PublicationsHeader', () => ({
  default: ({ isChanged, onSave, onDiscard, onChangeActiveTab }: any) => (
    <div>
      <span>{isChanged ? 'changed' : 'unchanged'}</span>
      <button onClick={onSave}>save</button>
      <button onClick={onDiscard}>discard</button>
      <button onClick={() => onChangeActiveTab(EntityViewTab.Skill)}>open-skill-tab</button>
    </div>
  ),
}));

vi.mock('../ComplexResourceTabsContent', () => ({
  default: ({ projectStaging, skillStaging }: any) => (
    <div>
      <span>description:{projectStaging.description}</span>
      <button onClick={() => projectStaging.onChangeDescription('changed')}>stage-project-description</button>
      <button onClick={() => skillStaging.setAddedFiles([new File(['x'], 'a.md')])}>stage-skill-file</button>
    </div>
  ),
}));

const refresh = vi.fn();
const push = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useRouter).mockReturnValue({ refresh, push } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(updatePublication).mockResolvedValue({ success: true });
  vi.mocked(getProjectManifest).mockResolvedValue({
    success: true,
    response: '---\nname: my-project\ndescription: Original\n---\n\nBe helpful.',
  });
  vi.mocked(getContextLimits).mockResolvedValue({
    allowedExtensions: ['csv'],
    maxFileBytes: 10,
    maxTotalBytes: 100,
    maxFiles: 5,
  });
  vi.mocked(uploadProjectFile).mockResolvedValue({ success: true });
  vi.mocked(uploadSkillFile).mockResolvedValue({ success: true });
});

const projectPublication = (): ProjectPublication =>
  ({
    path: 'publications/public/req-1',
    requestName: 'req-1',
    folderId: 'public/',
    rules: [],
    resourceIssues: [],
    projectResources: [
      {
        action: ActionType.ADD,
        sourceUrl: 'projects/src/my-project',
        targetUrl: 'projects/public/my-project',
        reviewUrl: 'projects/review/my-project',
        projectResource: {
          name: 'my-project',
          path: 'review/my-project',
          folderId: 'review/',
          files: [{ name: 'PROJECT.md' }],
        },
      },
    ],
  }) as unknown as ProjectPublication;

const skillPublication = (): SkillPublication =>
  ({
    path: 'publications/public/req-2',
    requestName: 'req-2',
    folderId: 'public/',
    rules: [],
    resourceIssues: [],
    skillResources: [
      {
        action: ActionType.ADD,
        sourceUrl: 'skills/src/my-skill',
        targetUrl: 'skills/public/my-skill',
        reviewUrl: 'skills/review/my-skill',
        skillResource: { name: 'my-skill', path: 'review/my-skill', folderId: 'review/', files: [] },
      },
    ],
  }) as unknown as SkillPublication;

describe('ComplexResourcePublicationView — Project', () => {
  test('reads the project manifest and the context limits for the project path', async () => {
    render(
      <ComplexResourcePublicationView view={ApplicationRoute.ProjectPublications} publication={projectPublication()} />,
    );

    expect(await screen.findByText('description:Original')).toBeTruthy();
    expect(getProjectManifest).toHaveBeenCalledWith('review/my-project');
    expect(getContextLimits).toHaveBeenCalledOnce();
  });

  test('reads the project manifest again when the publication is replaced, e.g. after a save refreshed it', async () => {
    const { rerender } = render(
      <ComplexResourcePublicationView view={ApplicationRoute.ProjectPublications} publication={projectPublication()} />,
    );
    expect(await screen.findByText('description:Original')).toBeTruthy();
    vi.mocked(getProjectManifest).mockResolvedValue({
      success: true,
      response: '---\nname: my-project\ndescription: Saved\n---\n\nBe helpful.',
    });

    rerender(
      <ComplexResourcePublicationView view={ApplicationRoute.ProjectPublications} publication={projectPublication()} />,
    );

    expect(await screen.findByText('description:Saved')).toBeTruthy();
    expect(getProjectManifest).toHaveBeenCalledTimes(2);
    expect(getContextLimits).toHaveBeenCalledOnce();
  });

  test('shows nothing changed until an edit is staged', async () => {
    render(
      <ComplexResourcePublicationView view={ApplicationRoute.ProjectPublications} publication={projectPublication()} />,
    );

    expect(await screen.findByText('description:Original')).toBeTruthy();
    expect(screen.getByText('unchanged')).toBeTruthy();
  });

  test('saves the publication, then writes the staged project edits to PROJECT.md', async () => {
    const user = userEvent.setup();
    render(
      <ComplexResourcePublicationView view={ApplicationRoute.ProjectPublications} publication={projectPublication()} />,
    );
    await screen.findByText('description:Original');

    await user.click(screen.getByRole('button', { name: 'stage-project-description' }));
    expect(await screen.findByText('changed')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'save' }));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(updatePublication).toHaveBeenCalledOnce();
    expect(uploadProjectFile).toHaveBeenCalledWith('review/my-project', 'PROJECT.md', expect.any(FormData));
    const written = await (vi.mocked(uploadProjectFile).mock.calls[0][2].get('file') as File).text();
    expect(written).toBe('---\nname: my-project\ndescription: changed\n---\n\nBe helpful.');
    expect(vi.mocked(updatePublication).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(uploadProjectFile).mock.invocationCallOrder[0],
    );
  });

  test('does not touch the project when the publication itself fails to save', async () => {
    vi.mocked(updatePublication).mockResolvedValue({ success: false, errorHeader: 'Boom', errorMessage: 'nope' });
    const user = userEvent.setup();
    render(
      <ComplexResourcePublicationView view={ApplicationRoute.ProjectPublications} publication={projectPublication()} />,
    );
    await screen.findByText('description:Original');

    await user.click(screen.getByRole('button', { name: 'stage-project-description' }));
    await user.click(await screen.findByRole('button', { name: 'save' }));

    await vi.waitFor(() => expect(showNotification).toHaveBeenCalledOnce());
    expect(uploadProjectFile).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  test('reports a failed project write and does not refresh', async () => {
    vi.mocked(uploadProjectFile).mockResolvedValue({ success: false, errorHeader: 'Boom', errorMessage: 'nope' });
    const user = userEvent.setup();
    render(
      <ComplexResourcePublicationView view={ApplicationRoute.ProjectPublications} publication={projectPublication()} />,
    );
    await screen.findByText('description:Original');

    await user.click(screen.getByRole('button', { name: 'stage-project-description' }));
    await user.click(await screen.findByRole('button', { name: 'save' }));

    await vi.waitFor(() => expect(showNotification).toHaveBeenCalledOnce());
    expect(refresh).not.toHaveBeenCalled();
  });

  test('discarding reverts the staged edit without contacting Core', async () => {
    const user = userEvent.setup();
    render(
      <ComplexResourcePublicationView view={ApplicationRoute.ProjectPublications} publication={projectPublication()} />,
    );
    await screen.findByText('description:Original');

    await user.click(screen.getByRole('button', { name: 'stage-project-description' }));
    expect(await screen.findByText('description:changed')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'discard' }));

    expect(await screen.findByText('description:Original')).toBeTruthy();
    expect(screen.getByText('unchanged')).toBeTruthy();
    expect(updatePublication).not.toHaveBeenCalled();
    expect(uploadProjectFile).not.toHaveBeenCalled();
  });
});

describe('ComplexResourcePublicationView — Skill', () => {
  test('does not read the project manifest or the skill manifest on mount', async () => {
    render(
      <ComplexResourcePublicationView view={ApplicationRoute.SkillPublications} publication={skillPublication()} />,
    );

    expect(await screen.findByText('unchanged')).toBeTruthy();
    expect(getProjectManifest).not.toHaveBeenCalled();
    expect(getSkillManifest).not.toHaveBeenCalled();
  });

  test('reads SKILL.md lazily once the Skill tab is opened', async () => {
    vi.mocked(getSkillManifest).mockResolvedValue({
      success: true,
      response: '---\nname: my-skill\ndescription: D\n---\nBody',
    });
    const user = userEvent.setup();
    render(
      <ComplexResourcePublicationView view={ApplicationRoute.SkillPublications} publication={skillPublication()} />,
    );

    await user.click(screen.getByRole('button', { name: 'open-skill-tab' }));

    await vi.waitFor(() => expect(getSkillManifest).toHaveBeenCalledWith('review/my-skill'));
  });

  test('saves the publication, then uploads the staged skill file', async () => {
    const user = userEvent.setup();
    render(
      <ComplexResourcePublicationView view={ApplicationRoute.SkillPublications} publication={skillPublication()} />,
    );

    await user.click(screen.getByRole('button', { name: 'stage-skill-file' }));
    expect(await screen.findByText('changed')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'save' }));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(updatePublication).toHaveBeenCalledOnce();
    expect(uploadSkillFile).toHaveBeenCalledWith('review/my-skill', 'a.md', expect.any(FormData));
    expect(uploadProjectFile).not.toHaveBeenCalled();
  });
});
