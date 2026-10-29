import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { DraftHolder } from '@/src/components/FoldersStorage/models';
import { ButtonsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { OrgUnitSubjectFunction } from '@/src/models/dial/org-unit';
import UnitRolesCard from '../UnitRolesCard';

const holder = (roleName: string, source: string, fn: OrgUnitSubjectFunction, targets?: string[]): DraftHolder => ({
  key: `${roleName}|${source}|${targets?.join(',')}`,
  roleName,
  subject: { type: 'claimsPredicate', source, function: fn, targets },
});

const ROLES = [{ name: 'editor', description: 'Edits content' }, { name: 'viewer' }];

describe('UnitRolesCard', () => {
  const renderCard = (props: Partial<React.ComponentProps<typeof UnitRolesCard>> = {}) =>
    render(
      <UnitRolesCard roles={ROLES} holders={[]} groupClaim="groups" onAdd={vi.fn()} onRemove={vi.fn()} {...props} />,
    );

  test('renders one labelled group per role in core order, including configured ones', () => {
    renderCard({ roles: [...ROLES, { name: 'files-reader' }] });

    const groups = screen.getAllByRole('group').filter((el) => el.tagName === 'SECTION');
    expect(groups.map((el) => el.getAttribute('aria-label'))).toEqual(['editor', 'viewer', 'files-reader']);
    expect(screen.getByText('Edits content')).toBeTruthy();
  });

  test('classifies holders into chips', () => {
    renderCard({
      holders: [
        holder('editor', 'email', OrgUnitSubjectFunction.EQUAL, ['carol@acme.com']),
        holder('editor', 'groups', OrgUnitSubjectFunction.EQUAL, ['us-risk-analysts']),
        holder('viewer', 'sub', OrgUnitSubjectFunction.TRUE),
        holder('viewer', 'tenant', OrgUnitSubjectFunction.EQUAL, ['a']),
      ],
    });

    expect(screen.getByText('carol@acme.com')).toBeTruthy();
    expect(screen.getByText('us-risk-analysts')).toBeTruthy();
    expect(screen.getByText(FoldersI18nKey.HolderEveryone, { selector: '[title]' })).toBeTruthy();
    expect(screen.getByText('tenant = a')).toBeTruthy();
  });

  test('shows a section for a role core no longer lists but that still has holders', () => {
    renderCard({ holders: [holder('legacy', 'email', OrgUnitSubjectFunction.EQUAL, ['x@y.z'])] });

    expect(screen.getByRole('group', { name: 'legacy' })).toBeTruthy();
  });

  test('removes a holder through its labelled remove button', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const item = holder('editor', 'email', OrgUnitSubjectFunction.EQUAL, ['carol@acme.com']);
    renderCard({ holders: [item], onRemove });

    await user.click(screen.getByRole('button', { name: FoldersI18nKey.RemoveHolder }));

    expect(onRemove).toHaveBeenCalledWith(item.key);
  });

  test('adds a group holder using the configured claim', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderCard({ onAdd, groupClaim: 'realm_access.roles' });
    const editor = within(screen.getByRole('group', { name: 'editor' }));

    await user.click(editor.getByRole('radio', { name: FoldersI18nKey.HolderGroup }));
    await user.type(editor.getByRole('textbox'), 'us-risk-analysts');
    await user.click(editor.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(onAdd).toHaveBeenCalledWith('editor', {
      type: 'claimsPredicate',
      source: 'realm_access.roles',
      function: OrgUnitSubjectFunction.EQUAL,
      targets: ['us-risk-analysts'],
    });
  });

  test('keeps Add disabled for a blank value', () => {
    renderCard();
    const editor = within(screen.getByRole('group', { name: 'editor' }));

    expect(editor.getByRole('button', { name: ButtonsI18nKey.Add })).toBeDisabled();
  });

  test('adds everyone signed in without a value', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderCard({ onAdd });
    const viewer = within(screen.getByRole('group', { name: 'viewer' }));

    await user.click(viewer.getByRole('radio', { name: FoldersI18nKey.HolderEveryone }));
    await user.click(viewer.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(onAdd).toHaveBeenCalledWith('viewer', expect.objectContaining({ source: 'sub', function: 'TRUE' }));
  });

  test('is read-only without remove or add controls', () => {
    renderCard({
      isReadonly: true,
      holders: [holder('editor', 'email', OrgUnitSubjectFunction.EQUAL, ['carol@acme.com'])],
    });

    expect(screen.queryByRole('button', { name: FoldersI18nKey.RemoveHolder })).toBeNull();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Add })).toBeNull();
  });
});
