import { NotificationType } from '@/src/models/notification';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import NotificationPortal from '../NotificationPortal';

describe('NotificationPortal', () => {
  test('renders Notification for non-dynamic notifications', () => {
    render(
      <NotificationPortal
        notifications={[{ id: '1', type: NotificationType.success, title: 'Success', onClose: vi.fn() }]}
      />,
    );
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  test('renders DynamicNotification for dynamic notifications', () => {
    render(
      <NotificationPortal
        notifications={[{ id: '2', type: NotificationType.dynamic, title: 'Dynamic', onClose: vi.fn() }]}
      />,
    );
    expect(screen.getByText('Dynamic')).toBeInTheDocument();
  });

  test('renders multiple notifications', () => {
    render(
      <NotificationPortal
        notifications={[
          { id: '1', type: NotificationType.success, title: 'Success', onClose: vi.fn() },
          { id: '2', type: NotificationType.dynamic, title: 'Dynamic', onClose: vi.fn() },
        ]}
      />,
    );
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Dynamic')).toBeInTheDocument();
  });
});

describe('NotificationPortal :: announcing', () => {
  test('is a polite live region', () => {
    render(<NotificationPortal notifications={[]} />);

    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });
});
