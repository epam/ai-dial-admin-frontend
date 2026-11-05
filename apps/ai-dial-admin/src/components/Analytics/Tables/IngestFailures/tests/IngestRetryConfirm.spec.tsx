import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import IngestRetryConfirm from '@/src/components/Analytics/Tables/IngestFailures/IngestRetryConfirm';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';

describe('IngestRetryConfirm', () => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();

  const renderConfirm = (props: Partial<Parameters<typeof IngestRetryConfirm>[0]> = {}) =>
    render(<IngestRetryConfirm isDeterministic={false} onConfirm={onConfirm} onClose={onClose} {...props} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('keeps the confirmation disabled while the group count loads', () => {
    renderConfirm({ count: undefined });

    expect(screen.getByText(IngestFailuresI18nKey.ConfirmTitleUnknown)).toBeTruthy();
    expect(screen.getByRole('button', { name: IngestFailuresI18nKey.Retry }).hasAttribute('disabled')).toBe(true);
  });

  test('states the reach and stays confirmable when the count read fails', async () => {
    const user = userEvent.setup();
    renderConfirm({ count: null });

    expect(screen.getByText(IngestFailuresI18nKey.ConfirmReach)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: IngestFailuresI18nKey.Retry }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  test('states the exact count, the run and the deterministic caveat', () => {
    renderConfirm({ count: 12, runId: 'run-1', isDeterministic: true });

    expect(screen.getByText(IngestFailuresI18nKey.ConfirmTitle)).toBeTruthy();
    expect(screen.getByText(IngestFailuresI18nKey.ConfirmRun)).toBeTruthy();
    expect(screen.getByText(IngestFailuresI18nKey.DeterministicCaveat)).toBeTruthy();
    expect(screen.queryByText(IngestFailuresI18nKey.ConfirmReach)).toBeNull();
  });
});
