import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { Run } from '@/src/models/evaluation/run';
import RunCancelModal from '../RunCancelModal';

const showNotification = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

describe('RunCancelModal', () => {
  const run: Run = { id: 'run-1' } as Run;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const confirmCancel = () => fireEvent.click(screen.getByRole('button', { name: 'Buttons.Stop' }));

  test('renders the confirmation copy before any request is sent', () => {
    const onCancelRun = vi.fn();

    render(<RunCancelModal run={run} onClose={vi.fn()} onCancelRun={onCancelRun} />);

    expect(screen.getByText('Runs.CancelRunModalDescription')).toBeInTheDocument();
    expect(onCancelRun).not.toHaveBeenCalled();
  });

  test('calls onCancelRun, shows a success notification, closes, and calls onSuccess', async () => {
    const onCancelRun = vi.fn().mockResolvedValue({ success: true });
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(<RunCancelModal run={run} onClose={onClose} onCancelRun={onCancelRun} onSuccess={onSuccess} />);
    confirmCancel();

    await waitFor(() => expect(onCancelRun).toHaveBeenCalledWith('run-1'));
    expect(onClose).toHaveBeenCalledOnce();
    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());
    expect(showNotification.mock.calls[0][0]).toEqual(
      expect.objectContaining({ title: 'Runs.CancelRunSuccess', description: 'Runs.CancelRunSuccessDescription' }),
    );
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  test('does not throw when onSuccess is omitted on a successful cancel', async () => {
    const onCancelRun = vi.fn().mockResolvedValue({ success: true });

    render(<RunCancelModal run={run} onClose={vi.fn()} onCancelRun={onCancelRun} />);
    confirmCancel();

    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());
  });

  test('shows an error notification and does not call onSuccess when cancellation fails', async () => {
    const onCancelRun = vi.fn().mockResolvedValue({
      success: false,
      errorHeader: 'Error',
      errorMessage: 'Run already completed',
    });
    const onSuccess = vi.fn();

    render(<RunCancelModal run={run} onClose={vi.fn()} onCancelRun={onCancelRun} onSuccess={onSuccess} />);
    confirmCancel();

    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());
    expect(showNotification.mock.calls[0][0]).toEqual(
      expect.objectContaining({ title: 'Error', description: 'Run already completed' }),
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
