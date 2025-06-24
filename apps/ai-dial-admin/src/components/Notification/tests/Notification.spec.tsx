import Notification from '@/src/components/Notification/Notification';
import { NOTIFICATION } from '@/src/utils/tests/mock/notifications.mock';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

describe('Components - Notification', () => {
  test('Should correctly render notification', () => {
    const { getByTestId } = render(<Notification {...NOTIFICATION} />);
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
