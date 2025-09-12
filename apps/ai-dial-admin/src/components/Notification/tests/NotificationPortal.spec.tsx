import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NotificationPortal from '../NotificationPortal';
import { NotificationType } from '@/src/models/notification';

describe('NotificationPortal', () => {
  it('renders Notification for non-dynamic notifications', () => {
    render(
      <NotificationPortal
        notifications={[{ id: '1', type: NotificationType.success, title: 'Success', onClose: vi.fn() }]}
      />,
    );
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders DynamicNotification for dynamic notifications', () => {
    render(
      <NotificationPortal
        notifications={[{ id: '2', type: NotificationType.dynamic, title: 'Dynamic', onClose: vi.fn() }]}
      />,
    );
    expect(screen.getByText('Dynamic')).toBeInTheDocument();
  });

  it('renders multiple notifications', () => {
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
