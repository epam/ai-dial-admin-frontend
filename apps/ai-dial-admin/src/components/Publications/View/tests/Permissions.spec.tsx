import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ActionType, Publication } from '@/src/models/dial/publications';
import { DialRule, RuleFunction } from '@/src/models/dial/rule';
import PublicationPermissions from '../Permissions';

vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (node: any) => node,
}));

vi.mock('@tabler/icons-react', () => ({
  IconReplace: (props: any) => <span role="img" aria-label="icon-replace" {...props} />,
}));

vi.mock('@/src/components/Rules/Item/RulesItem', () => ({
  default: ({ rules, folderName, folderDescription, onChange, children }: any) => (
    <div role="region" aria-label="rules-item">
      <div>{folderName}</div>
      <div>{folderDescription}</div>
      <div role="region" aria-label="rules-count">
        {rules.length}
      </div>
      <button
        role="button"
        aria-label="change-rules-button"
        onClick={() => onChange([...rules, { source: 'new', function: 'equal', targets: ['test'] }])}
      >
        Change Rules
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/Publications/Popup/RulesCompare', () => ({
  default: ({ rules, compareRules, isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return (
      <div role="region" aria-label="rules-compare-modal">
        <div role="region" aria-label="modal-rules-count">
          {rules.length}
        </div>
        <div role="region" aria-label="modal-compare-rules-count">
          {compareRules.length}
        </div>
        <button role="button" aria-label="close-modal-button" onClick={onClose}>
          Close
        </button>
      </div>
    );
  },
}));

const mockRules: DialRule[] = [
  {
    source: 'role',
    function: RuleFunction.EQUAL,
    targets: ['admin', 'user'],
  },
  {
    source: 'groups',
    function: RuleFunction.CONTAIN,
    targets: ['developers'],
  },
];

const mockCurrentRules: DialRule[] = [
  {
    source: 'role',
    function: RuleFunction.EQUAL,
    targets: ['admin'],
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

const setup = (props: {
  selectedPublication: Publication;
  onChange?: any;
  isPermissionsChanged: boolean;
  currentRules: DialRule[];
}) => {
  const onChange = props.onChange || vi.fn();
  const utils = render(
    <PublicationPermissions
      selectedPublication={props.selectedPublication}
      onChange={onChange}
      isPermissionsChanged={props.isPermissionsChanged}
      currentRules={props.currentRules}
    />,
  );
  return { onChange, ...utils };
};

describe('Publications :: Permissions', () => {
  test('renders RulesItem with publication rules', () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'rules-item' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'rules-count' })).toHaveTextContent('2');
  });

  test('renders folder name and description', () => {
    const publication = createMockPublication({ folderId: 'test-folder-123' });
    setup({
      selectedPublication: publication,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'folder-name' })).toHaveTextContent('Folder.Permissions');
  });

  test('shows warning alert when permissions changed', () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('data-variant', 'warning');
    expect(screen.getByText('Publications.PermissionsWarningTitle')).toBeInTheDocument();
    expect(screen.getByText('Publications.PermissionsWarningDescription')).toBeInTheDocument();
  });

  test('does not show warning alert when permissions not changed', () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('shows compare button when permissions changed', () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    const compareButton = screen.getByRole('button', { name: 'Compare.CompareChanges' });
    expect(compareButton).toBeInTheDocument();
    expect(compareButton).toHaveTextContent('Compare.CompareChanges');
    expect(screen.getByRole('img', { name: 'icon-replace' })).toBeInTheDocument();
  });

  test('does not show compare button when permissions not changed', () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.queryByRole('button', { name: 'Compare.CompareChanges' })).not.toBeInTheDocument();
  });

  test('opens compare modal when compare button is clicked', async () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    expect(screen.queryByRole('region', { name: 'rules-compare-modal' })).not.toBeInTheDocument();

    const compareButton = screen.getByRole('button', { name: 'Compare.CompareChanges' });
    await userEvent.click(compareButton);

    expect(screen.getByRole('region', { name: 'rules-compare-modal' })).toBeInTheDocument();
  });

  test('passes correct rules to compare modal', async () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    const compareButton = screen.getByRole('button', { name: 'Compare.CompareChanges' });
    await userEvent.click(compareButton);

    expect(screen.getByRole('region', { name: 'modal-rules-count' })).toHaveTextContent('2');
    expect(screen.getByRole('region', { name: 'modal-compare-rules-count' })).toHaveTextContent('1');
  });

  test('closes compare modal when close button is clicked', async () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    const compareButton = screen.getByRole('button', { name: 'Compare.CompareChanges' });
    await userEvent.click(compareButton);

    expect(screen.getByRole('region', { name: 'rules-compare-modal' })).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: 'Close' });
    await userEvent.click(closeButton);

    expect(screen.queryByRole('region', { name: 'rules-compare-modal' })).not.toBeInTheDocument();
  });

  test('calls onChange when rules are modified', async () => {
    const publication = createMockPublication();
    const { onChange } = setup({
      selectedPublication: publication,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    const changeRulesButton = screen.getByRole('button', { name: 'Change Rules' });
    await userEvent.click(changeRulesButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.rules).toHaveLength(3);
  });

  test('handles publication with no rules', () => {
    const publication = createMockPublication({ rules: undefined });
    setup({
      selectedPublication: publication,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'rules-count' })).toHaveTextContent('0');
  });

  test('handles publication with empty rules array', () => {
    const publication = createMockPublication({ rules: [] });
    setup({
      selectedPublication: publication,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'rules-count' })).toHaveTextContent('0');
  });

  test('handles empty current rules', () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: true,
      currentRules: [],
    });

    const compareButton = screen.getByRole('button', { name: 'Compare.CompareChanges' });
    expect(compareButton).toBeInTheDocument();
  });

  test('preserves other publication properties when updating rules', async () => {
    const publication = createMockPublication({
      path: 'test/path',
      author: 'author@test.com',
      folderId: 'folder123',
    });
    const { onChange } = setup({
      selectedPublication: publication,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    const changeRulesButton = screen.getByRole('button', { name: 'Change Rules' });
    await userEvent.click(changeRulesButton);

    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.path).toBe('test/path');
    expect(updatedPublication.author).toBe('author@test.com');
    expect(updatedPublication.folderId).toBe('folder123');
  });

  test('applies correct container styling', () => {
    const publication = createMockPublication();
    const { container } = setup({
      selectedPublication: publication,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    const mainContainer = container.firstElementChild;
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'gap-8', 'min-h-0');
  });

  test('modal is not rendered initially', () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    expect(screen.queryByRole('region', { name: 'rules-compare-modal' })).not.toBeInTheDocument();
  });

  test('works with different publication types', () => {
    const publication = createMockPublication({ action: ActionType.DELETE });
    setup({
      selectedPublication: publication,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    expect(screen.getByRole('region', { name: 'rules-item' })).toBeInTheDocument();
    expect(screen.getByRole('alert', { name: 'dial-alert' })).toBeInTheDocument();
  });

  test('handles multiple rule changes', async () => {
    const publication = createMockPublication();
    const { onChange, rerender } = setup({
      selectedPublication: publication,
      isPermissionsChanged: false,
      currentRules: mockCurrentRules,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Change Rules' }));
    expect(onChange).toHaveBeenCalledTimes(1);

    const updatedPublication = onChange.mock.calls[0][0];
    rerender(
      <PublicationPermissions
        selectedPublication={updatedPublication}
        onChange={onChange}
        isPermissionsChanged={false}
        currentRules={mockCurrentRules}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Change Rules' }));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  test('can open and close modal multiple times', async () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Compare.CompareChanges' }));
    expect(screen.getByRole('region', { name: 'rules-compare-modal' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('region', { name: 'rules-compare-modal' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Compare.CompareChanges' }));
    expect(screen.getByRole('region', { name: 'rules-compare-modal' })).toBeInTheDocument();
  });

  test('warning message renders with correct structure', () => {
    const publication = createMockPublication();
    setup({
      selectedPublication: publication,
      isPermissionsChanged: true,
      currentRules: mockCurrentRules,
    });

    const titleElement = screen.getByRole('heading', { name: 'Publications.PermissionsWarningTitle' });
    const descriptionElement = screen.getByRole('region', { name: 'Publications.PermissionsWarningDescription' });

    expect(titleElement.tagName).toBe('H3');
    expect(descriptionElement.className).toContain('text-sm');
  });
});
