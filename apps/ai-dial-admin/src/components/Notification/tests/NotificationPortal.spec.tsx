import NotificationPortal from '@/src/components/Notification/NotificationPortal';
import { NOTIFICATIONS } from '@/src/utils/tests/mock/notifications.mock';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

describe('Components - NotificationPortal', () => {
  test('Should correctly render notification portal', () => {
    const { getByTestId } = render(<NotificationPortal notifications={NOTIFICATIONS} />);

    const notification = getByTestId('notification');
    const dynamicNotification = getByTestId('notification-dynamic');

    expect(notification).toBeTruthy();
    expect(dynamicNotification).toBeTruthy();
  });
});
