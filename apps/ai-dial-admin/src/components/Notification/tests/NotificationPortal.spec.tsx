import { NotificationType } from '@/src/models/notification';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import NotificationPortal from '../NotificationPortal';

describe('NotificationPortal', () => {
  test('renders every notification as its own live region', () => {
    render(
      <NotificationPortal
        notifications={[
          { id: '1', type: NotificationType.success, title: 'Saved', onClose: vi.fn() },
          { id: '2', type: NotificationType.error, title: 'Failed', description: 'Why', onClose: vi.fn() },
        ]}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
  });

  test('renders nothing announceable without notifications', () => {
    render(<NotificationPortal notifications={[]} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
