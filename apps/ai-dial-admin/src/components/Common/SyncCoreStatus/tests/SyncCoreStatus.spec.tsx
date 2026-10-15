import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getCoreSyncStatus } from '@/src/app/actions';
import { CoreSyncI18nKey } from '@/src/constants/i18n';
import { EntitySyncStatus } from '@/src/types/entity-sync-status';
import { ApplicationRoute } from '@/src/types/routes';
import CoreSyncEntityStatus from '../SyncCoreStatus';

vi.mock('@/src/app/actions', () => ({ getCoreSyncStatus: vi.fn() }));
vi.mock('../DiffModal', () => ({ default: () => <div role="dialog">diff-modal</div> }));

const mockStatus = (status?: EntitySyncStatus) =>
  vi
    .mocked(getCoreSyncStatus)
    .mockResolvedValue({ response: status ? { status } : undefined, etag: 'etag-1' } as never);

describe('Common components :: SyncCoreStatus :: CoreSyncEntityStatus', () => {
  beforeEach(() => {
    vi.mocked(getCoreSyncStatus).mockReset();
  });

  test('Should show the badge once the status is fetched', async () => {
    mockStatus(EntitySyncStatus.FULLY_SYNCED);

    render(<CoreSyncEntityStatus view={ApplicationRoute.Models} name="gpt" />);

    expect(await screen.findByText(CoreSyncI18nKey.Synced)).toBeInTheDocument();
  });

  test('Should reserve its slot and show no badge while the status is loading', () => {
    vi.mocked(getCoreSyncStatus).mockReturnValue(new Promise(() => undefined));

    const { container } = render(<CoreSyncEntityStatus view={ApplicationRoute.Models} name="gpt" />);

    expect(container.firstElementChild).toHaveClass('invisible', 'h-6');
    expect(screen.queryByText(CoreSyncI18nKey.Synced)).toBeNull();
  });

  test('Should show no badge when the status is missing', async () => {
    mockStatus(undefined);

    await act(async () => {
      render(<CoreSyncEntityStatus view={ApplicationRoute.Models} name="gpt" />);
    });

    expect(screen.queryByText(CoreSyncI18nKey.Synced)).toBeNull();
  });

  test('Should open the diff modal from the diff button of an out-of-sync entity', async () => {
    mockStatus(EntitySyncStatus.IN_PROGRESS_TOO_LONG);

    render(<CoreSyncEntityStatus view={ApplicationRoute.Models} name="gpt" />);
    await userEvent.click(await screen.findByRole('button', { name: CoreSyncI18nKey.SyncWithCore }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('diff-modal');
  });
});
