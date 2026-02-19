import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ActionType, FilePublication, PromptPublication, Publication } from '@/src/models/dial/publications';
import { DialRule, RuleFunction } from '@/src/models/dial/rule';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('../InfoHeader', () => ({
  default: ({ view, entity }: any) => (
    <div data-testid="info-header">
      <div data-testid="header-view">{view}</div>
      <div data-testid="header-entity">{entity.path}</div>
    </div>
  ),
}));

vi.mock('../Permissions', () => ({
  default: ({ selectedPublication, onChange, isPermissionsChanged, currentRules }: any) => (
    <div data-testid="permissions">
      <div data-testid="permissions-publication">{selectedPublication.path}</div>
      <div data-testid="permissions-changed">{isPermissionsChanged.toString()}</div>
      <div data-testid="permissions-rules-count">{currentRules.length}</div>
      <button data-testid="permissions-change-button" onClick={() => onChange({ ...selectedPublication })}>
        Change
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/Publications/Properties/FileProperties', () => ({
  default: ({ publication, onChange }: any) => (
    <div data-testid="file-properties">
      <div data-testid="file-publication-path">{publication.path}</div>
      <button data-testid="file-change-button" onClick={() => onChange({ ...publication })}>
        Change File
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/Publications/Properties/PromptProperties', () => ({
  default: ({ publication, onChange }: any) => (
    <div data-testid="prompt-properties">
      <div data-testid="prompt-publication-path">{publication.path}</div>
      <button data-testid="prompt-change-button" onClick={() => onChange({ ...publication })}>
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

    expect(screen.getByTestId('info-header')).toBeInTheDocument();
    expect(screen.getByTestId('file-properties')).toBeInTheDocument();
    expect(screen.queryByTestId('prompt-properties')).not.toBeInTheDocument();
    expect(screen.queryByTestId('permissions')).not.toBeInTheDocument();
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

    expect(screen.getByTestId('info-header')).toBeInTheDocument();
    expect(screen.getByTestId('prompt-properties')).toBeInTheDocument();
    expect(screen.queryByTestId('file-properties')).not.toBeInTheDocument();
    expect(screen.queryByTestId('permissions')).not.toBeInTheDocument();
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

    expect(screen.getByTestId('permissions')).toBeInTheDocument();
    expect(screen.queryByTestId('info-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('file-properties')).not.toBeInTheDocument();
    expect(screen.queryByTestId('prompt-properties')).not.toBeInTheDocument();
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
    expect(screen.getByTestId('file-properties').parentElement).toBe(provider);
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
    expect(screen.getByTestId('prompt-properties').parentElement).toBe(provider);
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

    expect(screen.getByTestId('header-view')).toHaveTextContent(ApplicationRoute.FilePublications);
    expect(screen.getByTestId('header-entity')).toHaveTextContent('test/custom/path');
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

    expect(screen.getByTestId('file-publication-path')).toHaveTextContent('file/publication/path');

    const changeButton = screen.getByTestId('file-change-button');
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

    expect(screen.getByTestId('prompt-publication-path')).toHaveTextContent('prompt/publication/path');

    const changeButton = screen.getByTestId('prompt-change-button');
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

    expect(screen.getByTestId('permissions-publication')).toHaveTextContent('permissions/test/path');
    expect(screen.getByTestId('permissions-changed')).toHaveTextContent('true');
    expect(screen.getByTestId('permissions-rules-count')).toHaveTextContent('1');

    const changeButton = screen.getByTestId('permissions-change-button');
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

    expect(screen.queryByTestId('info-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('prompt-properties')).not.toBeInTheDocument();
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

    expect(screen.queryByTestId('permissions')).not.toBeInTheDocument();
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

    expect(screen.queryByTestId('file-properties')).not.toBeInTheDocument();
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

    expect(screen.queryByTestId('prompt-properties')).not.toBeInTheDocument();
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

    expect(screen.getByTestId('permissions-changed')).toHaveTextContent('false');
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

    expect(screen.getByTestId('permissions-rules-count')).toHaveTextContent('0');
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

    expect(screen.getByTestId('permissions')).toBeInTheDocument();
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

    expect(screen.getByTestId('info-header')).toBeInTheDocument();
    expect(screen.queryByTestId('file-properties')).not.toBeInTheDocument();
    expect(screen.queryByTestId('prompt-properties')).not.toBeInTheDocument();
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

    expect(screen.getByTestId('file-properties')).toBeInTheDocument();

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

    expect(screen.queryByTestId('file-properties')).not.toBeInTheDocument();
    expect(screen.getByTestId('permissions')).toBeInTheDocument();
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

    expect(screen.getByTestId('file-properties')).toBeInTheDocument();

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

    expect(screen.queryByTestId('file-properties')).not.toBeInTheDocument();
    expect(screen.getByTestId('prompt-properties')).toBeInTheDocument();
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

    expect(screen.getByTestId('permissions')).toBeInTheDocument();
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

    expect(screen.getByTestId('permissions-rules-count')).toHaveTextContent('3');
  });
});
