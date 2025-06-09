import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import NotificationPortal from '@/src/components/Notification/NotificationPortal';
import { NOTIFICATIONS } from '@/src/utils/tests/mock/notifications.mock';

describe('Components - NotificationPortal', () => {
  it('Should correctly render notification portal', () => {
    const { getByTestId } = renderWithContext(<NotificationPortal notifications={NOTIFICATIONS} />);

    const notification = getByTestId('notification');
    const dynamicNotification = getByTestId('notification-dynamic');

    expect(notification).toBeTruthy();
    expect(dynamicNotification).toBeTruthy();
  });
});
