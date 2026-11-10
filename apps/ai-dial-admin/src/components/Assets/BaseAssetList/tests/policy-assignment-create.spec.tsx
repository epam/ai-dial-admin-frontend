import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createPolicyAssignment } from '@/src/app/[lang]/platform-policy-assignments/actions';
import { getPolicies } from '@/src/app/[lang]/platform-policies/actions';
import BaseAssetList from '@/src/components/Assets/BaseAssetList/BaseAssetList';
import { AssetFolderContextMap } from '@/src/components/Assets/BaseAssetList/utils';
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

vi.mock('@/src/components/Common/FileManager/FileManager', () => ({
  default: ({ customCreateNewItemAction }: { customCreateNewItemAction: () => void }) => (
    <button onClick={customCreateNewItemAction}>Open create</button>
  ),
}));

const folderContext = {
  filePath: 'platform/team-a/',
  fetchedFoldersData: {},
  fetchFiles: vi.fn(),
  setFilePath: vi.fn(),
};

describe('BaseAssetList — policy assignment creation', () => {
  const push = vi.fn();
  const { showNotification } = useNotification();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
    vi.spyOn(AssetFolderContextMap, ApplicationRoute.PlatformPolicyAssignments).mockReturnValue(
      folderContext as unknown as ReturnType<
        (typeof AssetFolderContextMap)[ApplicationRoute.PlatformPolicyAssignments]
      >,
    );
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
        <BaseAssetList view={ApplicationRoute.PlatformPolicyAssignments} />
      </SaveValidationContextProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Open create' }));
    await user.type(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}(required)` }), 'ta-x');
    const policy = await screen.findByRole('combobox', { name: new RegExp(PolicyAssignmentsI18nKey.Policy) });
    await user.click(policy);
    await user.click(await screen.findByText('team-a/policy'));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
    expect(screen.getByRole('button', { name: PolicySubjectsI18nKey.AddRule })).toBeInTheDocument();
    return user;
  };

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
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Back }));
    expect(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}(required)` })).toHaveValue('ta-x');
    expect(screen.getByRole('textbox', { name: new RegExp(PolicyAssignmentsI18nKey.CostObject) })).toHaveValue(
      'team-a',
    );
    expect(screen.getByRole('combobox', { name: new RegExp(PolicyAssignmentsI18nKey.Policy) })).toHaveValue(
      'team-a/policy',
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
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Create })).toBeNull();
  });
});
