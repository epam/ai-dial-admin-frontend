import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createPolicyAssignment } from '@/src/app/[lang]/platform-policy-assignments/actions';
import { getPolicies } from '@/src/app/[lang]/platform-policies/actions';
import CreatePlatformEntity from '@/src/components/Assets/Platform/CreatePlatformEntity';
import {
  ButtonsI18nKey,
  EntityFieldsI18nKey,
  PolicyAssignmentsI18nKey,
  PolicySubjectsI18nKey,
} from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { BucketType } from '@/src/models/dial/asset-list-item';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';

vi.mock('@/src/context/SaveValidationContext', async () => vi.importActual('@/src/context/SaveValidationContext'));

vi.mock('@/src/app/[lang]/platform-policy-assignments/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-policy-assignments/actions')>()),
  createPolicyAssignment: vi.fn(),
}));

vi.mock('@/src/app/[lang]/platform-policies/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-policies/actions')>()),
  getPolicies: vi.fn(),
}));

describe('CreatePlatformEntity — policy assignment creation', () => {
  const push = vi.fn();
  const onClose = vi.fn();
  const { showNotification } = useNotification();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(getPolicies).mockImplementation(async (folder) =>
      folder
        ? [
            {
              name: 'policy',
              folderId: 'team-a/',
              path: 'team-a/policy',
              bucket: BucketType.Platform,
              nodeType: DialFileNodeType.ITEM,
            },
          ]
        : [],
    );
  });

  const openAssignment = async () => {
    const user = userEvent.setup();
    render(
      <SaveValidationContextProvider>
        <CreatePlatformEntity view={ApplicationRoute.PlatformPolicyAssignments} isOpen names={[]} onClose={onClose} />
      </SaveValidationContextProvider>,
    );
    // Every query is fresh: the policy selector and the inputs are re-rendered as the listing for the cost object lands.
    const costObjectQuery = { name: new RegExp(PolicyAssignmentsI18nKey.CostObject) };
    const policyQuery = { name: new RegExp(PolicyAssignmentsI18nKey.Policy) };
    await screen.findByRole('combobox', policyQuery);
    await user.type(screen.getByRole('textbox', costObjectQuery), 'team-a');
    await waitFor(() => expect(screen.getByRole('textbox', costObjectQuery)).toHaveValue('team-a'));
    await user.type(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}(required)` }), 'ta-x');
    // Every keystroke of the cost object reloads the listing: let the one for the full value land before opening.
    await vi.waitFor(() => expect(getPolicies).toHaveBeenCalledWith('team-a/'));
    await act(async () => {});
    await waitFor(() => expect(screen.getByRole('combobox', policyQuery)).toBeEnabled());
    await user.click(screen.getByRole('combobox', policyQuery));
    await user.click(await screen.findByText('team-a/policy'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
    expect(screen.getByRole('button', { name: PolicySubjectsI18nKey.AddRule })).toBeInTheDocument();
    return user;
  };

  test('starts with an empty, editable cost object', () => {
    render(
      <SaveValidationContextProvider>
        <CreatePlatformEntity view={ApplicationRoute.PlatformPolicyAssignments} isOpen names={[]} onClose={onClose} />
      </SaveValidationContextProvider>,
    );

    const costObject = screen.getByRole('textbox', { name: new RegExp(PolicyAssignmentsI18nKey.CostObject) });
    expect(costObject).toHaveValue('');
    expect(costObject).toBeEnabled();
  });

  test.each([
    ['subject is pinned by neither the policy nor the assignment', 400],
    ['referenced policy does not exist', 422],
    ['Budget has the same priority', 409],
  ])('shows one unchanged error and retains edits after Core rejects creation: %s', async (message, status) => {
    vi.mocked(createPolicyAssignment).mockResolvedValue({
      success: false,
      status,
      errorHeader: 'Request error',
      errorMessage: message,
      requestId: 'request-123',
    });
    const user = await openAssignment();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));
    });

    expect(showNotification).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(getErrorNotification('Request error', message, 'request-123'));
    expect(createPolicyAssignment).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Back }));
    expect(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}(required)` })).toHaveValue('ta-x');
    expect(screen.getByRole('textbox', { name: new RegExp(PolicyAssignmentsI18nKey.CostObject) })).toHaveValue(
      'team-a',
    );
  });

  test('closes the form and navigates after creation succeeds', async () => {
    vi.mocked(createPolicyAssignment).mockResolvedValue({ success: true });
    const user = await openAssignment();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));
    });

    expect(push).toHaveBeenCalledOnce();
    expect(createPolicyAssignment).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
