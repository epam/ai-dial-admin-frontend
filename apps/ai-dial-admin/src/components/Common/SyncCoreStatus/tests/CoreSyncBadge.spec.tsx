import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { CoreSyncI18nKey } from '@/src/constants/i18n';
import { EntitySyncStatus } from '@/src/types/entity-sync-status';
import CoreSyncBadge from '../CoreSyncBadge';

describe('Common components :: SyncCoreStatus :: CoreSyncBadge', () => {
  test('Should render nothing without a status', () => {
    const { container } = render(<CoreSyncBadge />);

    expect(container).toBeEmptyDOMElement();
  });

  test.each([
    [EntitySyncStatus.IN_PROGRESS, CoreSyncI18nKey.InProgress, ['bg-info', 'text-info']],
    [EntitySyncStatus.FULLY_SYNCED, CoreSyncI18nKey.Synced, ['bg-success', 'text-success']],
    [EntitySyncStatus.UNKNOWN, CoreSyncI18nKey.Unknown, ['bg-layer-4', 'text-secondary']],
    [EntitySyncStatus.IN_PROGRESS_TOO_LONG, CoreSyncI18nKey.Partially, ['bg-error', 'text-error']],
  ])('Should render %s with its label and tone, not upper-cased', (status, label, classes) => {
    render(<CoreSyncBadge status={status} />);

    const pill = screen.getByText(label).parentElement;
    expect(pill).toHaveClass(...classes);
    expect(pill?.className).not.toContain('uppercase');
  });

  test('Should show a spinner only while the sync is in progress', () => {
    const { rerender } = render(<CoreSyncBadge status={EntitySyncStatus.IN_PROGRESS} />);
    expect(screen.getByRole('img', { name: 'Loading', hidden: true })).toBeInTheDocument();

    rerender(<CoreSyncBadge status={EntitySyncStatus.FULLY_SYNCED} />);
    expect(screen.queryByRole('img', { name: 'Loading', hidden: true })).toBeNull();
    expect(screen.getByText(CoreSyncI18nKey.Synced).parentElement?.querySelector('[aria-hidden]')).toBeNull();
  });

  test.each([EntitySyncStatus.IN_PROGRESS, EntitySyncStatus.IN_PROGRESS_TOO_LONG])(
    'Should render a named diff button for %s that calls onDiffClick',
    async (status) => {
      const onDiffClick = vi.fn();
      render(<CoreSyncBadge status={status} onDiffClick={onDiffClick} />);

      await userEvent.click(screen.getByRole('button', { name: CoreSyncI18nKey.SyncWithCore }));

      expect(onDiffClick).toHaveBeenCalledTimes(1);
    },
  );

  test.each([EntitySyncStatus.FULLY_SYNCED, EntitySyncStatus.UNKNOWN])(
    'Should render no diff button for %s',
    (status) => {
      render(<CoreSyncBadge status={status} onDiffClick={vi.fn()} />);

      expect(screen.queryByRole('button')).toBeNull();
    },
  );

  test('Should render no diff button without onDiffClick', () => {
    render(<CoreSyncBadge status={EntitySyncStatus.IN_PROGRESS_TOO_LONG} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  test('Should render a decorative info glyph with no tooltip for an unknown status', async () => {
    const { container } = render(<CoreSyncBadge status={EntitySyncStatus.UNKNOWN} />);

    const glyph = container.querySelector('svg[aria-hidden="true"]');
    expect(glyph).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();

    await userEvent.hover(glyph as Element);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
