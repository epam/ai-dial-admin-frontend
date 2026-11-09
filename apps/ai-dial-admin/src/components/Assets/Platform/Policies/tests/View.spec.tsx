import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updatePolicy } from '@/src/app/[lang]/platform-policies/actions';
import { useNotification } from '@/src/context/NotificationContext';
import { DialPolicyResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PolicyAssetView from '../View';

vi.mock('@/src/app/[lang]/platform-policies/actions', () => ({
  updatePolicy: vi.fn(),
  removePolicy: vi.fn(),
  getPolicies: vi.fn().mockResolvedValue([]),
}));

let capturedJsonConfiguration: { onHideFormatSelector?: () => boolean } | undefined;
vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({
    onSave,
    onDiscard,
    isChanged,
    tabs,
    jsonConfiguration,
  }: {
    onSave: () => void;
    onDiscard: () => void;
    isChanged: boolean;
    tabs: { id: string }[];
    jsonConfiguration: { onHideFormatSelector?: () => boolean };
  }) => {
    capturedJsonConfiguration = jsonConfiguration;
    return (
      <>
        <button type="button" onClick={onSave}>
          save
        </button>
        <button type="button" onClick={onDiscard}>
          discard
        </button>
        <span>{isChanged ? 'changed' : 'unchanged'}</span>
        <span>tabs:{tabs.map((tab) => tab.id).join(',')}</span>
      </>
    );
  },
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const POLICY = {
  name: 'team-cap',
  priority: 10,
  object: '*',
  cost: { day: 5 },
  _metadata: { name: 'team-cap', path: 'team-a/team-cap', folderId: 'team-a/' },
} as DialPolicyResource;

describe('PolicyAssetView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updatePolicy).mockResolvedValue({ success: true } as never);
  });

  test('offers the Properties and Subjects tabs', () => {
    render(<PolicyAssetView etag="etag" originalPolicy={POLICY} />);

    expect(screen.getByText(`tabs:${EntityViewTab.Properties},${EntityViewTab.Subjects}`)).toBeTruthy();
  });

  test('renders the tab content and starts unchanged', () => {
    render(<PolicyAssetView etag="etag" originalPolicy={POLICY} />);

    expect(screen.getByText('tabs-content')).toBeTruthy();
    expect(screen.getByText('unchanged')).toBeTruthy();
  });

  test('hides the format selector, since a policy has no admin-backend projection', () => {
    render(<PolicyAssetView etag="etag" originalPolicy={POLICY} />);

    expect(capturedJsonConfiguration?.onHideFormatSelector?.()).toBe(true);
  });

  test('sends the policy to Core with the etag it was loaded with on save', async () => {
    const user = userEvent.setup();
    render(<PolicyAssetView etag="etag-1" originalPolicy={POLICY} />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(updatePolicy).toHaveBeenCalledWith(expect.objectContaining({ name: 'team-cap' }), 'etag-1');
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  test('shows Core’s message in an error notification and keeps the page when the save is refused', async () => {
    vi.mocked(updatePolicy).mockResolvedValue({
      success: false,
      errorHeader: 'Unprocessable',
      errorMessage: 'priority tie',
    } as never);
    const user = userEvent.setup();
    render(<PolicyAssetView etag="etag" originalPolicy={POLICY} />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    await vi.waitFor(() =>
      expect(useNotification().showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'priority tie' }),
      ),
    );
    expect(refresh).not.toHaveBeenCalled();
  });
});
