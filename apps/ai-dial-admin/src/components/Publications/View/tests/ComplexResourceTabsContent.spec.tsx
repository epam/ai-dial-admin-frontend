import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ProjectPublication, Publication, SkillPublication } from '@/src/models/dial/publications';
import { DialRule } from '@/src/models/dial/rule';
import { ProjectContextLimits } from '@/src/models/project-context';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import { ProjectStaging } from '@/src/components/Assets/Artifacts/Projects/View/models';
import ComplexResourceTabsContent from '../ComplexResourceTabsContent';
import { SkillPublicationStaging } from '../use-skill-publication-staging';

vi.mock('../Permissions', () => ({
  default: () => <div role="region" aria-label="permissions" />,
}));

vi.mock('@/src/components/Publications/Properties/SkillProperties', () => ({
  default: ({ publication }: any) => (
    <div role="region" aria-label="skill-properties">
      {publication.path}
    </div>
  ),
}));

vi.mock('@/src/components/Publications/Properties/ProjectProperties', () => ({
  default: ({ staging, disabled }: any) => (
    <div role="region" aria-label="project-properties">
      <span>{disabled ? 'fields-disabled' : 'fields-enabled'}</span>
      <span>{staging.description}</span>
      <span>{staging.instructions}</span>
      <button onClick={() => staging.onChangeDescription('changed')}>change-description</button>
      <button onClick={() => staging.onAddFiles([])}>add-files</button>
    </div>
  ),
}));

vi.mock('@/src/components/Assets/Artifacts/Skills/View/SkillManifestTab', () => ({
  default: ({ name, description, onChangeDescription }: any) => (
    <div role="region" aria-label="skill-manifest-tab">
      <span>{name}</span>
      <span>{description}</span>
      <button onClick={() => onChangeDescription('changed')}>change-manifest-description</button>
    </div>
  ),
}));

const LIMITS: ProjectContextLimits = {
  allowedExtensions: ['csv'],
  maxFileBytes: 1,
  maxTotalBytes: 1,
  maxFiles: 1,
};

const publication = (overrides?: Partial<Publication>): Publication =>
  ({
    path: 'publications/public/req-1',
    requestName: 'req-1',
    author: 'author@example.com',
    displayAuthor: 'Author',
    folderId: 'public/',
    resourceIssues: [],
    ...overrides,
  }) as Publication;

const skillStaging = (overrides?: Partial<SkillPublicationStaging>): SkillPublicationStaging => ({
  addedFiles: [],
  setAddedFiles: vi.fn(),
  removedFileNames: [],
  setRemovedFileNames: vi.fn(),
  isChanged: false,
  onChangeDescription: vi.fn(),
  onChangeBody: vi.fn(),
  reset: vi.fn(),
  discard: vi.fn(),
  apply: vi.fn(),
  ...overrides,
});

const projectStaging = (overrides?: Partial<ProjectStaging>): ProjectStaging => ({
  isLoaded: true,
  description: 'A project',
  instructions: 'Be helpful.',
  storedFiles: [],
  addedFiles: [],
  removedFileNames: [],
  isChanged: false,
  onChangeDescription: vi.fn(),
  onChangeInstructions: vi.fn(),
  onAddFiles: vi.fn(),
  onRemoveStoredFile: vi.fn(),
  onRemoveAddedFile: vi.fn(),
  discard: vi.fn(),
  apply: vi.fn(),
  ...overrides,
});

const renderTabs = (props: {
  view: ApplicationRoute.SkillPublications | ApplicationRoute.ProjectPublications;
  activeTab: EntityViewTab;
  skill?: SkillPublicationStaging;
  project?: ProjectStaging;
}) =>
  render(
    <ComplexResourceTabsContent
      view={props.view}
      activeTab={props.activeTab}
      selectedPublication={publication() as SkillPublication & ProjectPublication}
      onChange={vi.fn()}
      isPermissionsChanged={false}
      currentRules={[] as DialRule[]}
      skillStaging={props.skill ?? skillStaging()}
      projectStaging={props.project ?? projectStaging()}
      projectLimits={LIMITS}
    />,
  );

describe('ComplexResourceTabsContent :: Skill publication', () => {
  test('renders the info header and the skill properties on the Properties tab', () => {
    renderTabs({ view: ApplicationRoute.SkillPublications, activeTab: EntityViewTab.Properties });

    expect(screen.getByText(EntityFieldsI18nKey.displayAuthor)).toBeTruthy();
    expect(screen.getByRole('region', { name: 'skill-properties' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'project-properties' })).toBeNull();
  });

  test('renders the manifest tab with the staged manifest when the Skill tab is active', () => {
    renderTabs({
      view: ApplicationRoute.SkillPublications,
      activeTab: EntityViewTab.Skill,
      skill: skillStaging({ stagedManifest: { name: 'my-skill', description: 'Does a thing', body: 'Body' } }),
    });

    expect(screen.getByRole('region', { name: 'skill-manifest-tab' })).toBeTruthy();
    expect(screen.getByText('my-skill')).toBeTruthy();
    expect(screen.getByText('Does a thing')).toBeTruthy();
  });

  test('does not render the manifest tab before a manifest has been fetched', () => {
    renderTabs({ view: ApplicationRoute.SkillPublications, activeTab: EntityViewTab.Skill });

    expect(screen.queryByRole('region', { name: 'skill-manifest-tab' })).toBeNull();
  });

  test('forwards a description edit from the manifest tab', async () => {
    const user = userEvent.setup();
    const staging = skillStaging({ stagedManifest: { name: 'my-skill', description: 'Does a thing', body: 'Body' } });
    renderTabs({ view: ApplicationRoute.SkillPublications, activeTab: EntityViewTab.Skill, skill: staging });

    await user.click(screen.getByRole('button', { name: 'change-manifest-description' }));

    expect(staging.onChangeDescription).toHaveBeenCalledWith('changed');
  });
});

describe('ComplexResourceTabsContent :: Project publication', () => {
  test('renders the info header and the project properties on the Properties tab', () => {
    renderTabs({ view: ApplicationRoute.ProjectPublications, activeTab: EntityViewTab.Properties });

    expect(screen.getByText(EntityFieldsI18nKey.displayAuthor)).toBeTruthy();
    expect(screen.getByRole('region', { name: 'project-properties' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'skill-properties' })).toBeNull();
  });

  test('passes the staged description and instructions to the project properties', () => {
    renderTabs({ view: ApplicationRoute.ProjectPublications, activeTab: EntityViewTab.Properties });

    expect(screen.getByText('A project')).toBeTruthy();
    expect(screen.getByText('Be helpful.')).toBeTruthy();
  });

  test('enables the project fields once PROJECT.md has been read', () => {
    renderTabs({ view: ApplicationRoute.ProjectPublications, activeTab: EntityViewTab.Properties });

    expect(screen.getByText('fields-enabled')).toBeTruthy();
  });

  test('keeps the project fields disabled until PROJECT.md has been read, so nothing typed is lost to it', () => {
    renderTabs({
      view: ApplicationRoute.ProjectPublications,
      activeTab: EntityViewTab.Properties,
      project: projectStaging({ isLoaded: false }),
    });

    expect(screen.getByText('fields-disabled')).toBeTruthy();
  });

  test('forwards edits to the project staging', async () => {
    const user = userEvent.setup();
    const staging = projectStaging();
    renderTabs({ view: ApplicationRoute.ProjectPublications, activeTab: EntityViewTab.Properties, project: staging });

    await user.click(screen.getByRole('button', { name: 'change-description' }));
    await user.click(screen.getByRole('button', { name: 'add-files' }));

    expect(staging.onChangeDescription).toHaveBeenCalledWith('changed');
    expect(staging.onAddFiles).toHaveBeenCalledWith([]);
  });

  test('has no manifest tab content', () => {
    renderTabs({ view: ApplicationRoute.ProjectPublications, activeTab: EntityViewTab.Skill });

    expect(screen.queryByRole('region', { name: 'skill-manifest-tab' })).toBeNull();
  });
});

describe('ComplexResourceTabsContent :: Permissions', () => {
  test.each([ApplicationRoute.SkillPublications, ApplicationRoute.ProjectPublications] as const)(
    'renders the permissions tab for %s',
    (view) => {
      renderTabs({ view, activeTab: EntityViewTab.Permissions });

      expect(screen.getByRole('region', { name: 'permissions' })).toBeTruthy();
    },
  );
});
