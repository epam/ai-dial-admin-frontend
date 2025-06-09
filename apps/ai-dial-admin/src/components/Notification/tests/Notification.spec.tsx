import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import Notification from '@/src/components/Notification/Notification';
import { NOTIFICATION } from '@/src/utils/tests/mock/notifications.mock';

describe('Components - Notification', () => {
  it('Should correctly render notification', () => {
    const { getByTestId } = renderWithContext(<Notification {...NOTIFICATION} />);
    const title = getByTestId('notification-title');
    const description = getByTestId('notification-description');
    const icon = getByTestId('notification-icon');
    const close = getByTestId('notification-close');

    expect(title.innerHTML).toBe(NOTIFICATION.title);
    expect(description.innerHTML).toBe(NOTIFICATION.description);
    expect(icon).toBeTruthy();
    expect(close).toBeTruthy();
  });
});
