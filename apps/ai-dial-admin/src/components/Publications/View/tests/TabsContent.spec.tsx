import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ActionType, FilePublication, PromptPublication, Publication } from '@/src/models/dial/publications';
import { DialRule, RuleFunction } from '@/src/models/dial/rule';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('../Permissions', () => ({
  default: ({ selectedPublication, onChange, isPermissionsChanged, currentRules }: any) => (
    <div role="region" aria-label="permissions">
      <div role="region" aria-label="permissions-publication">
        {selectedPublication.path}
      </div>
      <div role="region" aria-label="permissions-changed">
        {isPermissionsChanged.toString()}
      </div>
      <div role="region" aria-label="permissions-rules-count">
        {currentRules.length}
      </div>
      <button role="button" aria-label="permissions-change-button" onClick={() => onChange({ ...selectedPublication })}>
        Change
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/Publications/Properties/FileProperties', () => ({
  default: ({ publication, onChange }: any) => (
    <div role="region" aria-label="file-properties">
      <div role="region" aria-label="file-publication-path">
        {publication.path}
      </div>
      <button role="button" aria-label="file-change-button" onClick={() => onChange({ ...publication })}>
        Change File
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/Publications/Properties/PromptProperties', () => ({
  default: ({ publication, onChange }: any) => (
    <div role="region" aria-label="prompt-properties">
      <div role="region" aria-label="prompt-publication-path">
        {publication.path}
      </div>
      <button role="button" aria-label="prompt-change-button" onClick={() => onChange({ ...publication })}>
        Change Prompt
      </button>
    </div>
  ),
}));

const mockRules: DialRule[] = [
  {
    source: 'role',
    function: RuleFunction.EQUAL,
    targets: ['admin'],
  },
];

const mockCurrentRules: DialRule[] = [
  {
    source: 'groups',
    function: RuleFunction.CONTAIN,
    targets: ['developers'],
  },
];

const createMockPublication = (overrides?: Partial<Publication>): Publication => ({
  path: 'publications/test',
  requestName: 'test-request',
  author: 'test@example.com',
  displayAuthor: 'Test Author',
  createdAt: '2024-01-15T10:30:00Z',
  status: 'pending',
  action: ActionType.ADD,
  folderId: 'folder1',
  rules: mockRules,
  ...overrides,
});

const createMockFilePublication = (overrides?: Partial<FilePublication>): FilePublication => ({
  ...createMockPublication(),
  files: [],
  ...overrides,
});

const createMockPromptPublication = (overrides?: Partial<PromptPublication>): PromptPublication => ({
  ...createMockPublication(),
  prompts: [],
  ...overrides,
});

const setup = (props: {
  view: ApplicationRoute;
  selectedPublication: Publication;
  activeTab: EntityViewTab;
  onChange?: any;
  isPermissionsChanged: boolean;
  currentRules: DialRule[];
}) => {
  const onChange = props.onChange || vi.fn();
  const utils = render(
    <TabsContent
      view={props.view}
      selectedPublication={props.selectedPublication}
      activeTab={props.activeTab}
      onChange={onChange}
      isPermissionsChanged={props.isPermissionsChanged}
      currentRules={props.currentRules}
    />,
  );
  return { onChange, ...utils };
};

describe('Publications :: TabsContent', () => {
  test('renders InfoHeader and FileProperties when Properties tab is active for FilePublications', () => {
    const publication = createMockFilePublication();
    setup({
      view: ApplicationRoute.FilePublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'info-header' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'file-properties' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'prompt-properties' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'permissions' })).not.toBeInTheDocument();
  });

  test('renders InfoHeader and PromptProperties when Properties tab is active for PromptPublications', () => {
    const publication = createMockPromptPublication();
    setup({
      view: ApplicationRoute.PromptPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'info-header' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'prompt-properties' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'file-properties' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'permissions' })).not.toBeInTheDocument();
  });

  test('renders Permissions when Permissions tab is active', () => {
    const publication = createMockPublication();
    setup({
      view: ApplicationRoute.PromptPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Permissions,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'permissions' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'info-header' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'file-properties' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'prompt-properties' })).not.toBeInTheDocument();
  });

  test('wraps FileProperties in FileFolderProvider', () => {
    const publication = createMockFilePublication();
    setup({
      view: ApplicationRoute.FilePublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    const provider = screen.getByTestId('file-folder-provider');
    expect(provider).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'file-properties' }).parentElement).toBe(provider);
  });

  test('wraps PromptProperties in FileFolderProvider', () => {
    const publication = createMockPromptPublication();
    setup({
      view: ApplicationRoute.PromptPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    const provider = screen.getByTestId('file-folder-provider');
    expect(provider).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'prompt-properties' }).parentElement).toBe(provider);
  });

  test('passes view and entity to InfoHeader', () => {
    const publication = createMockFilePublication({ path: 'test/custom/path' });
    setup({
      view: ApplicationRoute.FilePublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'header-view' })).toHaveTextContent(ApplicationRoute.FilePublications);
    expect(screen.getByRole('region', { name: 'header-entity' })).toHaveTextContent('test/custom/path');
  });

  test('passes publication and onChange to FileProperties', () => {
    const publication = createMockFilePublication({ path: 'file/publication/path' });
    const { onChange } = setup({
      view: ApplicationRoute.FilePublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'file-publication-path' })).toHaveTextContent('file/publication/path');

    const changeButton = screen.getByRole('button', { name: 'file-change-button' });
    changeButton.click();
    expect(onChange).toHaveBeenCalled();
  });

  test('passes publication and onChange to PromptProperties', () => {
    const publication = createMockPromptPublication({ path: 'prompt/publication/path' });
    const { onChange } = setup({
      view: ApplicationRoute.PromptPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'prompt-publication-path' })).toHaveTextContent(
      'prompt/publication/path',
    );

    const changeButton = screen.getByRole('button', { name: 'prompt-change-button' });
    changeButton.click();
    expect(onChange).toHaveBeenCalled();
  });

  test('passes correct props to Permissions component', () => {
    const publication = createMockPublication({ path: 'permissions/test/path' });
    const { onChange } = setup({
      view: ApplicationRoute.PromptPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Permissions,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'permissions-publication' })).toHaveTextContent('permissions/test/path');
    expect(screen.getByRole('region', { name: 'permissions-changed' })).toHaveTextContent('true');
    expect(screen.getByRole('region', { name: 'permissions-rules-count' })).toHaveTextContent('1');

    const changeButton = screen.getByRole('button', { name: 'permissions-change-button' });
    changeButton.click();
    expect(onChange).toHaveBeenCalled();
  });

  test('applies correct container styling for Properties tab', () => {
    const publication = createMockFilePublication();
    const { container } = setup({
      view: ApplicationRoute.FilePublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    const propertiesContainer = container.querySelector('.flex.flex-col.h-full');
    expect(propertiesContainer).toBeInTheDocument();
  });

  test('does not render Properties content when Permissions tab is active', () => {
    const publication = createMockPromptPublication();
    setup({
      view: ApplicationRoute.PromptPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Permissions,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.queryByRole('region', { name: 'info-header' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'prompt-properties' })).not.toBeInTheDocument();
  });

  test('does not render Permissions content when Properties tab is active', () => {
    const publication = createMockFilePublication();
    setup({
      view: ApplicationRoute.FilePublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.queryByRole('region', { name: 'permissions' })).not.toBeInTheDocument();
  });

  test('does not render FileProperties for PromptPublications on Properties tab', () => {
    const publication = createMockPromptPublication();
    setup({
      view: ApplicationRoute.PromptPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.queryByRole('region', { name: 'file-properties' })).not.toBeInTheDocument();
  });

  test('does not render PromptProperties for FilePublications on Properties tab', () => {
    const publication = createMockFilePublication();
    setup({
      view: ApplicationRoute.FilePublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.queryByRole('region', { name: 'prompt-properties' })).not.toBeInTheDocument();
  });

  test('passes isPermissionsChanged false to Permissions', () => {
    const publication = createMockPublication();
    setup({
      view: ApplicationRoute.PromptPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Permissions,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'permissions-changed' })).toHaveTextContent('false');
  });

  test('handles empty currentRules array', () => {
    const publication = createMockPublication();
    setup({
      view: ApplicationRoute.PromptPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Permissions,
      isPermissionsChanged: false,
      currentRules: [],
    });

    expect(screen.getByRole('region', { name: 'permissions-rules-count' })).toHaveTextContent('0');
  });

  test('works with ApplicationPublications view for Permissions tab', () => {
    const publication = createMockPublication();
    setup({
      view: ApplicationRoute.ApplicationPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Permissions,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'permissions' })).toBeInTheDocument();
  });

  test('renders empty fragment for unsupported view on Properties tab', () => {
    const publication = createMockPublication();
    setup({
      view: ApplicationRoute.ApplicationPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'info-header' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'file-properties' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'prompt-properties' })).not.toBeInTheDocument();
  });

  test('updates when activeTab changes from Properties to Permissions', () => {
    const publication = createMockFilePublication();
    const { rerender } = setup({
      view: ApplicationRoute.FilePublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'file-properties' })).toBeInTheDocument();

    rerender(
      <TabsContent
        view={ApplicationRoute.FilePublications}
        selectedPublication={publication}
        activeTab={EntityViewTab.Permissions}
        onChange={vi.fn()}
        isPermissionsChanged={false}
        currentRules={mockCurrentRules}
      />,
    );

    expect(screen.queryByRole('region', { name: 'file-properties' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'permissions' })).toBeInTheDocument();
  });

  test('updates when view changes from FilePublications to PromptPublications', () => {
    const filePublication = createMockFilePublication();
    const { rerender } = setup({
      view: ApplicationRoute.FilePublications,
      selectedPublication: filePublication,
      activeTab: EntityViewTab.Properties,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'file-properties' })).toBeInTheDocument();

    const promptPublication = createMockPromptPublication();
    rerender(
      <TabsContent
        view={ApplicationRoute.PromptPublications}
        selectedPublication={promptPublication}
        activeTab={EntityViewTab.Properties}
        onChange={vi.fn()}
        isPermissionsChanged={false}
        currentRules={mockCurrentRules}
      />,
    );

    expect(screen.queryByRole('region', { name: 'file-properties' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'prompt-properties' })).toBeInTheDocument();
  });

  test('handles publication with different action types', () => {
    const publication = createMockPublication({ action: ActionType.DELETE });
    setup({
      view: ApplicationRoute.PromptPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Permissions,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'permissions' })).toBeInTheDocument();
  });

  test('renders correctly with multiple rules in currentRules', () => {
    const publication = createMockPublication();
    const multipleRules: DialRule[] = [
      { source: 'role', function: RuleFunction.EQUAL, targets: ['admin'] },
      { source: 'groups', function: RuleFunction.CONTAIN, targets: ['dev'] },
      { source: 'title', function: RuleFunction.REGEX, targets: ['.*manager.*'] },
    ];

    setup({
      view: ApplicationRoute.PromptPublications,
      selectedPublication: publication,
      activeTab: EntityViewTab.Permissions,
      isPermissionsChanged: true,
      currentRules: multipleRules,
    });

    expect(screen.getByRole('region', { name: 'permissions-rules-count' })).toHaveTextContent('3');
  });
});
