import { NotificationType } from '@/src/models/notification';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Notification from '../Notification';

describe('Notification', () => {
  test('renders title and description', () => {
    render(
      <Notification
        id="id"
        type={NotificationType.success}
        title="Success!"
        description="Everything went well."
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Everything went well.')).toBeInTheDocument();
  });

  test('renders all notification types', () => {
    Object.values(NotificationType).forEach((type) => {
      render(<Notification id="id" type={type} title={type} onClose={vi.fn()} />);
      expect(screen.getByText(type)).toBeInTheDocument();
    });
  });

  test('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Notification id="id" type={NotificationType.error} title="Error!" onClose={onClose} />);
    const closeBtn = screen.getByLabelText('close');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  test('does not render description if not provided', () => {
    render(<Notification id="id" type={NotificationType.prepare} title="Prepare" onClose={vi.fn()} />);
    expect(screen.queryByText('tiny text-secondary break-words whitespace-pre-wrap mt-2')).not.toBeInTheDocument();
  });
});
