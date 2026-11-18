import { NotificationType } from '@/src/models/notification';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Notification from '../Notification';

describe('Notification', () => {
  test('renders the title above the description', () => {
    render(
      <Notification
        id="id"
        type={NotificationType.success}
        title="Saved"
        description="Everything went well."
        onClose={vi.fn()}
      />,
    );

    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent('Saved');
    expect(toast).toHaveTextContent('Everything went well.');
  });

  test('renders a title-only notification as its message', () => {
    render(<Notification id="id" type={NotificationType.success} title="Copied" onClose={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Copied');
  });

  test('announces an error assertively', () => {
    render(<Notification id="id" type={NotificationType.error} title="Failed" description="Why" onClose={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  test('shows the request id under the description', () => {
    render(
      <Notification
        id="id"
        type={NotificationType.error}
        title="Failed"
        description="Why"
        requestId="trace-1"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Request ID: trace-1')).toBeInTheDocument();
  });

  test('shows the request id when there is no description', () => {
    render(<Notification id="id" type={NotificationType.error} title="Failed" requestId="trace-1" onClose={vi.fn()} />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveTextContent('Failed');
    expect(toast).toHaveTextContent('Request ID: trace-1');
  });

  test('runs the action and closes the notification when its button is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onClose = vi.fn();
    render(
      <Notification
        id="id"
        type={NotificationType.success}
        title="Query created"
        description="Saved as a new query"
        action={{ label: 'Open query', onClick }}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Open query' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<Notification id="id" type={NotificationType.prepare} title="Preparing" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Close' }));

    expect(onClose).toHaveBeenCalled();
  });
});
