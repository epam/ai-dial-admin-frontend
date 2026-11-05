import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import FailureDetailMessage from '@/src/components/Analytics/Common/Failures/FailureDetailMessage';
import FailuresOutcomeStatus from '@/src/components/Analytics/Common/Failures/FailuresOutcomeStatus';
import FailuresReadFailed from '@/src/components/Analytics/Common/Failures/FailuresReadFailed';
import FailuresRunFilter from '@/src/components/Analytics/Common/Failures/FailuresRunFilter';
import FailuresSummaryHeader from '@/src/components/Analytics/Common/Failures/FailuresSummaryHeader';
import FailuresTiles from '@/src/components/Analytics/Common/Failures/FailuresTiles';
import RetryConfirmPopup from '@/src/components/Analytics/Common/Failures/RetryConfirmPopup';

describe('FailuresSummaryHeader', () => {
  test('states the total, its unit and the age of the newest failure', () => {
    render(<FailuresSummaryHeader total={12} unitLabel="failures" lastFailureLabel="Last 5 min ago" />);

    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('failures')).toBeTruthy();
    expect(screen.getByText('Last 5 min ago')).toBeTruthy();
  });

  test('omits the age when there is none', () => {
    render(<FailuresSummaryHeader total={1} unitLabel="failure" />);

    expect(screen.queryByText(/Last/)).toBeNull();
  });
});

describe('FailuresTiles', () => {
  const renderTiles = (canRetryAll: boolean, onRetryAll = vi.fn()) =>
    render(
      <FailuresTiles
        action={{
          label: 'Needs retry',
          hint: 'Fix first',
          retryAllLabel: 'Retry all',
          canRetryAll,
          isBusy: false,
          onRetryAll,
        }}
        passive={{ label: 'Retrying automatically', hint: 'With backoff' }}
      />,
    );

  test('offers Retry all on the action tile and calls it', async () => {
    const user = userEvent.setup();
    const onRetryAll = vi.fn();
    renderTiles(true, onRetryAll);

    await user.click(screen.getByRole('button', { name: 'Retry all' }));

    expect(onRetryAll).toHaveBeenCalledOnce();
    expect(screen.getByText('Retrying automatically')).toBeTruthy();
  });

  test('offers no Retry all when there is nothing to retry', () => {
    renderTiles(false);

    expect(screen.queryByRole('button', { name: 'Retry all' })).toBeNull();
  });
});

describe('FailureDetailMessage', () => {
  test('states every line and a copy control', () => {
    render(<FailureDetailMessage label="Message" lines={['a', 'b']} copyValue="a; b" noMessageLabel="None" />);

    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.getByText('b')).toBeTruthy();
    expect(screen.getByRole('button')).toBeTruthy();
  });

  test('says no message was recorded when there are no lines', () => {
    render(<FailureDetailMessage label="Message" lines={[]} copyValue="" noMessageLabel="None" />);

    expect(screen.getByText('None')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('RetryConfirmPopup', () => {
  test('states the body and caveats and confirms', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <RetryConfirmPopup
        title="Retry 3?"
        body="Queued for the next pass"
        caveats={['Fix the cause first']}
        confirmLabel="Retry"
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Fix the cause first')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  test('disables confirm when asked to', () => {
    render(
      <RetryConfirmPopup
        title="Retry?"
        body="body"
        caveats={[]}
        confirmLabel="Retry"
        isConfirmDisabled
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
  });
});

describe('FailuresRunFilter', () => {
  test('clears the run when its remove control is activated', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<FailuresRunFilter label="Run r-1" removeLabel="Clear run" onClear={onClear} />);

    expect(screen.getByText('Run r-1')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear run' }));

    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe('FailuresOutcomeStatus', () => {
  test('announces the message in a polite live region', () => {
    render(<FailuresOutcomeStatus message="Queued 2" />);

    expect(screen.getByRole('status').textContent).toBe('Queued 2');
  });
});

describe('FailuresReadFailed', () => {
  test('states the failure and reads again on request', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<FailuresReadFailed message="Could not read" retryLabel="Read again" onRetry={onRetry} />);

    expect(screen.getByText('Could not read')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Read again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
