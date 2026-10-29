import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  addOrgUnitAssignment,
  getOrgUnitAssignments,
  getOrgUnitRoles,
  removeOrgUnitAssignment,
} from '@/src/app/[lang]/folders-storage/actions';
import { RolesCardStatus } from '@/src/components/FoldersStorage/models';
import { OrgUnitSubject, OrgUnitSubjectFunction } from '@/src/models/dial/org-unit';
import { useUnitRolesDraft } from '../use-unit-roles-draft';

vi.mock('@/src/app/[lang]/folders-storage/actions', () => ({
  getOrgUnitRoles: vi.fn(),
  getOrgUnitAssignments: vi.fn(),
  addOrgUnitAssignment: vi.fn(),
  removeOrgUnitAssignment: vi.fn(),
}));

const UNIT = 'public/Acme';

const person = (email: string): OrgUnitSubject => ({
  type: 'claimsPredicate',
  source: 'email',
  function: OrgUnitSubjectFunction.EQUAL,
  targets: [email],
});

const stored = [
  { id: 'a1', roleName: 'editor', subject: person('carol@acme.com') },
  { id: 'a2', roleName: 'viewer', subject: person('dave@acme.com') },
];

const mockLoad = (assignments = stored) => {
  vi.mocked(getOrgUnitRoles).mockResolvedValue({
    success: true,
    response: { items: [{ name: 'editor' }, { name: 'viewer' }] },
  });
  vi.mocked(getOrgUnitAssignments).mockResolvedValue({ success: true, response: { items: assignments } });
};

const renderDraft = async () => {
  const hook = renderHook(() => useUnitRolesDraft(UNIT));
  await waitFor(() => expect(hook.result.current.status).toBe(RolesCardStatus.READY));
  return hook;
};

describe('useUnitRolesDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad();
  });

  test('loads roles and assignments for the unit', async () => {
    const { result } = await renderDraft();

    expect(getOrgUnitRoles).toHaveBeenCalledWith(UNIT);
    expect(result.current.roles.map((role) => role.name)).toEqual(['editor', 'viewer']);
    expect(result.current.draft).toHaveLength(2);
    expect(result.current.isChanged).toBe(false);
  });

  test('hides the card state on 403', async () => {
    vi.mocked(getOrgUnitAssignments).mockResolvedValue({ success: false, status: 403 });
    const { result } = renderHook(() => useUnitRolesDraft(UNIT));

    await waitFor(() => expect(result.current.status).toBe(RolesCardStatus.FORBIDDEN));
  });

  test('reports an error state for other failures', async () => {
    vi.mocked(getOrgUnitRoles).mockResolvedValue({ success: false, status: 500 });
    const { result } = renderHook(() => useUnitRolesDraft(UNIT));

    await waitFor(() => expect(result.current.status).toBe(RolesCardStatus.ERROR));
  });

  test('adding a holder only changes the draft', async () => {
    const { result } = await renderDraft();

    act(() => result.current.addHolder('editor', person('new@acme.com')));

    expect(result.current.isChanged).toBe(true);
    expect(result.current.draft).toHaveLength(3);
    expect(addOrgUnitAssignment).not.toHaveBeenCalled();
  });

  test('re-adding an identical holder does not duplicate it', async () => {
    const { result } = await renderDraft();

    act(() => result.current.addHolder('editor', person('CAROL@acme.com')));

    expect(result.current.draft).toHaveLength(2);
    expect(result.current.isChanged).toBe(false);
  });

  test('removing a stored holder marks it, and discard restores it', async () => {
    const { result } = await renderDraft();
    const key = result.current.draft[0].key;

    act(() => result.current.removeHolder(key));
    expect(result.current.draft[0].isRemoved).toBe(true);
    expect(result.current.isChanged).toBe(true);

    act(() => result.current.discard());
    expect(result.current.draft[0].isRemoved).toBeUndefined();
    expect(result.current.isChanged).toBe(false);
  });

  test('removing an added holder drops it from the draft', async () => {
    const { result } = await renderDraft();
    act(() => result.current.addHolder('editor', person('new@acme.com')));

    act(() => result.current.removeHolder(result.current.draft[2].key));

    expect(result.current.draft).toHaveLength(2);
  });

  test('save sends one POST and one DELETE, then reloads', async () => {
    vi.mocked(addOrgUnitAssignment).mockResolvedValue({ success: true });
    vi.mocked(removeOrgUnitAssignment).mockResolvedValue({ success: true });
    const { result } = await renderDraft();
    act(() => result.current.addHolder('editor', person('new@acme.com')));
    act(() => result.current.removeHolder(result.current.draft[1].key));

    let outcome;
    await act(async () => {
      outcome = await result.current.save();
    });

    expect(addOrgUnitAssignment).toHaveBeenCalledOnce();
    expect(addOrgUnitAssignment).toHaveBeenCalledWith(UNIT, { roleName: 'editor', subject: person('new@acme.com') });
    expect(removeOrgUnitAssignment).toHaveBeenCalledOnce();
    expect(removeOrgUnitAssignment).toHaveBeenCalledWith(UNIT, 'a2');
    expect(getOrgUnitAssignments).toHaveBeenCalledTimes(2);
    expect(outcome).toEqual({ isSuccess: true });
  });

  test('save stops at the first failure and reloads what core holds', async () => {
    vi.mocked(addOrgUnitAssignment).mockResolvedValue({ success: true });
    vi.mocked(removeOrgUnitAssignment).mockResolvedValue({ success: false, status: 500, errorMessage: 'boom' });
    const { result } = await renderDraft();
    act(() => result.current.addHolder('editor', person('new@acme.com')));
    act(() => result.current.removeHolder(result.current.draft[0].key));
    act(() => result.current.removeHolder(result.current.draft[1].key));

    let outcome;
    await act(async () => {
      outcome = await result.current.save();
    });

    expect(removeOrgUnitAssignment).toHaveBeenCalledOnce();
    expect(getOrgUnitAssignments).toHaveBeenCalledTimes(2);
    expect(outcome).toEqual({ isSuccess: false, errorMessage: 'boom' });
    expect(result.current.isChanged).toBe(false);
  });
});
