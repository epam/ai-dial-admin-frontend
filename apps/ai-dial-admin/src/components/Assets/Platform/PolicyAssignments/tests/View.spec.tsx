import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updatePolicyAssignment } from '@/src/app/[lang]/platform-policy-assignments/actions';
import { DialPolicyAssignmentResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PolicyAssignmentAssetView from '../View';

vi.mock('@/src/app/[lang]/platform-policy-assignments/actions', () => ({
  updatePolicyAssignment: vi.fn(),
  removePolicyAssignment: vi.fn(),
  getPolicyAssignments: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ onSave, tabs }: { onSave: () => void; tabs: { id: string }[] }) => (
    <>
      <button type="button" onClick={onSave}>
        save
      </button>
      <span>tabs:{tabs.map((tab) => tab.id).join(',')}</span>
    </>
  ),
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const ASSIGNMENT = {
  name: 'grant-1',
  policy: 'daily-cap',
  _metadata: { name: 'grant-1', path: 'team-a/grant-1', folderId: 'team-a/' },
} as DialPolicyAssignmentResource;

describe('PolicyAssignmentAssetView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updatePolicyAssignment).mockResolvedValue({ success: true } as never);
  });

  test('offers the Properties and Subjects tabs and renders the tab content', () => {
    render(<PolicyAssignmentAssetView etag="etag" originalAssignment={ASSIGNMENT} />);

    expect(screen.getByText(`tabs:${EntityViewTab.Properties},${EntityViewTab.Subjects}`)).toBeTruthy();
    expect(screen.getByText('tabs-content')).toBeTruthy();
  });

  test('sends the assignment to Core with the etag it was loaded with on save', async () => {
    const user = userEvent.setup();
    render(<PolicyAssignmentAssetView etag="etag-1" originalAssignment={ASSIGNMENT} />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(updatePolicyAssignment).toHaveBeenCalledWith(expect.objectContaining({ name: 'grant-1' }), 'etag-1');
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  test('keeps the page and does not refresh when Core refuses the save', async () => {
    vi.mocked(updatePolicyAssignment).mockResolvedValue({
      success: false,
      errorHeader: 'Unprocessable',
      errorMessage: "Policy 'x' does not exist",
    } as never);
    const user = userEvent.setup();
    render(<PolicyAssignmentAssetView etag="etag" originalAssignment={ASSIGNMENT} />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    await vi.waitFor(() => expect(updatePolicyAssignment).toHaveBeenCalled());
    expect(refresh).not.toHaveBeenCalled();
  });
});
