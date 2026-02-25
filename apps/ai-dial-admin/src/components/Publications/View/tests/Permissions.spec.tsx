import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ActionType, Publication } from '@/src/models/dial/publications';
import { DialRule, RuleFunction } from '@/src/models/dial/rule';
import PublicationPermissions from '../Permissions';

let capturedRulesItemProps: any = {};
let capturedRulesItemChildren: any = null;

vi.mock('@/src/components/Rules/Item/RulesItem', () => ({
  default: (props: any) => {
    capturedRulesItemProps = props;
    capturedRulesItemChildren = props.children;
    return (
      <div role="region" aria-label="rules-item">
        <span>Folder: {props.folderName}</span>
        <span>Description: {props.folderDescription}</span>
        <span>Rules: {props.rules.length}</span>
        {props.children}
      </div>
    );
  },
}));

let capturedRulesCompareProps: any = {};
vi.mock('@/src/components/Publications/Popup/RulesCompare', () => ({
  default: (props: any) => {
    capturedRulesCompareProps = props;
    return (
      <div role="dialog" aria-label="rules-compare">
        <span>Compare Rules: {props.rules.length} vs {props.compareRules.length}</span>
        <button aria-label="close-compare" onClick={props.onClose}>Close</button>
      </div>
    );
  },
}));

const mockRules: DialRule[] = [
  { source: 'role', function: RuleFunction.EQUAL, targets: ['admin'] },
  { source: 'groups', function: RuleFunction.CONTAIN, targets: ['devs'] },
];

const mockCurrentRules: DialRule[] = [
  { source: 'title', function: RuleFunction.REGEX, targets: ['.*engineer.*'] },
];

const createMockPublication = (overrides?: Partial<Publication>): Publication => ({
  path: 'publications/test',
  requestName: 'test-request',
  author: 'test@example.com',
  displayAuthor: 'Test Author',
  createdAt: '2024-01-01',
  status: 'pending',
  action: ActionType.ADD,
  folderId: 'folder1',
  rules: mockRules,
  ...overrides,
});

const setup = (
  props: Partial<{
    selectedPublication: Publication;
    onChange: any;
    isPermissionsChanged: boolean;
    currentRules: DialRule[];
  }> = {},
) => {
  const onChange = props.onChange ?? vi.fn();
  const selectedPublication = props.selectedPublication ?? createMockPublication();
  const isPermissionsChanged = props.isPermissionsChanged ?? false;
  const currentRules = props.currentRules ?? mockCurrentRules;

  const utils = render(
    <PublicationPermissions
      selectedPublication={selectedPublication}
      onChange={onChange}
      isPermissionsChanged={isPermissionsChanged}
      currentRules={currentRules}
    />,
  );

  return { onChange, selectedPublication, ...utils };
};

describe('Publications :: PublicationPermissions', () => {
  test('renders RulesItem when folderId is not root', () => {
    setup();

    expect(screen.getByRole('region', { name: 'rules-item' })).toBeInTheDocument();
  });

  test('renders "all rules" text when folderId is root folder', () => {
    const publication = createMockPublication({ folderId: 'public/' });
    setup({ selectedPublication: publication });

    expect(screen.getByText('Folder.AllRules')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'rules-item' })).not.toBeInTheDocument();
  });

  test('does not show warning when permissions are not changed', () => {
    setup({ isPermissionsChanged: false });

    expect(screen.queryByText('Publications.PermissionsWarningTitle')).not.toBeInTheDocument();
  });

  test('shows warning when permissions are changed', () => {
    setup({ isPermissionsChanged: true });

    expect(screen.getByText('Publications.PermissionsWarningTitle')).toBeInTheDocument();
    expect(screen.getByText('Publications.PermissionsWarningDescription')).toBeInTheDocument();
  });

  test('passes correct rules to RulesItem', () => {
    setup();

    expect(screen.getByText('Rules: 2')).toBeInTheDocument();
    expect(capturedRulesItemProps.rules).toEqual(mockRules);
  });

  test('passes empty rules array when publication has no rules', () => {
    const publication = createMockPublication({ rules: undefined });
    setup({ selectedPublication: publication });

    expect(capturedRulesItemProps.rules).toEqual([]);
  });

  test('passes folder permissions label as folderName', () => {
    setup();

    expect(screen.getByText('Folder: Folder.Permissions')).toBeInTheDocument();
  });

  test('passes folderId as folderDescription', () => {
    setup();

    expect(screen.getByText('Description: folder1')).toBeInTheDocument();
  });

  test('passes indentIndex 0 and isAlwaysToggled true to RulesItem', () => {
    setup();

    expect(capturedRulesItemProps.indentIndex).toBe(0);
    expect(capturedRulesItemProps.isAlwaysToggled).toBe(true);
  });

  test('does not show Compare Changes button when permissions are not changed', () => {
    setup({ isPermissionsChanged: false });

    expect(screen.queryByText('Compare.CompareChanges')).not.toBeInTheDocument();
  });

  test('shows Compare Changes button when permissions are changed', () => {
    setup({ isPermissionsChanged: true });

    expect(screen.getByText('Compare.CompareChanges')).toBeInTheDocument();
  });

  test('opens compare modal when Compare Changes button is clicked', async () => {
    setup({ isPermissionsChanged: true });

    expect(screen.queryByRole('dialog', { name: 'rules-compare' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Compare.CompareChanges'));

    expect(screen.getByRole('dialog', { name: 'rules-compare' })).toBeInTheDocument();
  });

  test('passes correct rules to RulesCompare modal', async () => {
    setup({ isPermissionsChanged: true });

    await userEvent.click(screen.getByText('Compare.CompareChanges'));

    expect(capturedRulesCompareProps.rules).toEqual(mockRules);
    expect(capturedRulesCompareProps.compareRules).toEqual(mockCurrentRules);
    expect(capturedRulesCompareProps.isOpen).toBe(true);
  });

  test('closes compare modal when onClose is called', async () => {
    setup({ isPermissionsChanged: true });

    await userEvent.click(screen.getByText('Compare.CompareChanges'));
    expect(screen.getByRole('dialog', { name: 'rules-compare' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'close-compare' }));
    expect(screen.queryByRole('dialog', { name: 'rules-compare' })).not.toBeInTheDocument();
  });

  test('calls onChange with updated rules when RulesItem onChange fires', () => {
    const onChange = vi.fn();
    setup({ onChange });

    const newRules: DialRule[] = [
      { source: 'title', function: RuleFunction.EQUAL, targets: ['lead'] },
    ];
    capturedRulesItemProps.onChange(newRules);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedPublication = onChange.mock.calls[0][0];
    expect(updatedPublication.rules).toEqual(newRules);
    expect(updatedPublication.path).toBe('publications/test');
    expect(updatedPublication.author).toBe('test@example.com');
  });

  test('preserves all publication properties when rules change', () => {
    const onChange = vi.fn();
    const publication = createMockPublication();
    setup({ onChange, selectedPublication: publication });

    capturedRulesItemProps.onChange([]);

    const updated = onChange.mock.calls[0][0];
    expect(updated.path).toBe(publication.path);
    expect(updated.requestName).toBe(publication.requestName);
    expect(updated.author).toBe(publication.author);
    expect(updated.displayAuthor).toBe(publication.displayAuthor);
    expect(updated.createdAt).toBe(publication.createdAt);
    expect(updated.status).toBe(publication.status);
    expect(updated.action).toBe(publication.action);
    expect(updated.folderId).toBe(publication.folderId);
  });

  test('passes empty rules to RulesCompare when publication has no rules', async () => {
    const publication = createMockPublication({ rules: undefined });
    setup({ selectedPublication: publication, isPermissionsChanged: true });

    await userEvent.click(screen.getByText('Compare.CompareChanges'));

    expect(capturedRulesCompareProps.rules).toEqual([]);
  });
});
