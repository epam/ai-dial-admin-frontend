import DynamicNotification from '@/src/components/Notification/DynamicNotification';
import {
  DYNAMIC_NOTIFICATION,
  DYNAMIC_NOTIFICATION_COMPLETED,
  DYNAMIC_NOTIFICATION_EMPTY,
} from '@/src/utils/tests/mock/notifications.mock';
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

describe('Components - DynamicNotification', () => {
  test('Should correctly render notification', () => {
    const { baseElement, getByTestId } = render(<DynamicNotification {...DYNAMIC_NOTIFICATION} />);
    const title = baseElement.getElementsByTagName('p')[0];
    const progress = getByTestId('progress');

    expect(baseElement).toBeTruthy();
    expect(title.innerHTML).toBe(DYNAMIC_NOTIFICATION.title);
    expect(progress).toBeTruthy();
  });

  test('Should correctly render notification details', () => {
    const { getByTestId, queryAllByTestId } = render(<DynamicNotification {...DYNAMIC_NOTIFICATION} />);
    const showDetailsButton = getByTestId('show-details');

    fireEvent.click(showDetailsButton);

    const files = queryAllByTestId('file');

    expect(files?.length).toBe(3);
  });

  test('Should correctly render all completed notification details', () => {
    const { getByTestId, queryAllByTestId } = render(
      <DynamicNotification {...DYNAMIC_NOTIFICATION_COMPLETED} />,
    );
    const showDetailsButton = getByTestId('show-details');
    const progress = queryAllByTestId('progress');

    expect(progress.length).toBeFalsy();

    fireEvent.click(showDetailsButton);

    const files = queryAllByTestId('file');

    expect(files?.length).toBe(1);
  });

  test('Should correctly render notification without file details', () => {
    const { getByTestId, queryAllByTestId } = render(
      <DynamicNotification {...DYNAMIC_NOTIFICATION_EMPTY} />,
    );
    const showDetailsButton = getByTestId('show-details');

    fireEvent.click(showDetailsButton);

    const files = queryAllByTestId('file');

    expect(files?.length).toBe(0);
  });
});
