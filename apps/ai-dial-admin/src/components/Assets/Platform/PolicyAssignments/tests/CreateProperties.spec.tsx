import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getPolicies } from '@/src/app/[lang]/platform-policies/actions';
import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { PolicyAssignmentsI18nKey, PolicySubjectsI18nKey } from '@/src/constants/i18n';
import { DialPolicyAssignmentResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/app/[lang]/platform-policies/actions', () => ({ getPolicies: vi.fn() }));

const renderCreateForm = (entity: Record<string, unknown> = { name: '', folderId: 'team-a/' }) => {
  const onChangeEntity = vi.fn();
  render(
    <Properties
      view={ApplicationRoute.PlatformPolicyAssignments}
      entity={entity as unknown as DialPolicyAssignmentResource}
      names={[]}
      isModal
      onChangeEntity={onChangeEntity}
    />,
  );
  return onChangeEntity;
};

describe('Policy assignment :: create form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPolicies).mockResolvedValue([]);
  });

  test('writes the typed id as the name', () => {
    const onChangeEntity = renderCreateForm();

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: 'grant-1' } });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ name: 'grant-1' }));
  });

  test('shows the cost object from the folder and says it is taken from there', () => {
    renderCreateForm({ name: '', folderId: 'platform/team-a/' });

    expect(
      (screen.getByRole('textbox', { name: new RegExp(PolicyAssignmentsI18nKey.CostObject) }) as HTMLInputElement)
        .value,
    ).toBe('team-a');
  });

  test('stores the typed cost object as the folder', () => {
    const onChangeEntity = renderCreateForm({ name: '', folderId: '' });

    fireEvent.change(screen.getByRole('textbox', { name: new RegExp(PolicyAssignmentsI18nKey.CostObject) }), {
      target: { value: 'team-b' },
    });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ folderId: 'team-b/' }));
  });

  test('asks for the subject rules, since Core needs them pinned by the policy or the assignment', () => {
    renderCreateForm();

    expect(screen.getByRole('button', { name: PolicySubjectsI18nKey.AddRule })).toBeTruthy();
  });

  test('reads the policies for the typed cost object', async () => {
    renderCreateForm({ name: '', folderId: 'team-a/' });

    await vi.waitFor(() => expect(getPolicies).toHaveBeenCalledWith('team-a/'));
  });
});
