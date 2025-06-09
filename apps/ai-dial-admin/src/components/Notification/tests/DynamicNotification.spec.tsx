import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import DynamicNotification from '@/src/components/Notification/DynamicNotification';
import { fireEvent } from '@testing-library/react';
import {
  DYNAMIC_NOTIFICATION,
  DYNAMIC_NOTIFICATION_COMPLETED,
  DYNAMIC_NOTIFICATION_EMPTY,
} from '@/src/utils/tests/mock/notifications.mock';

describe('Components - DynamicNotification', () => {
  it('Should correctly render notification', () => {
    const { baseElement, getByTestId } = renderWithContext(<DynamicNotification {...DYNAMIC_NOTIFICATION} />);
    const title = baseElement.getElementsByTagName('p')[0];
    const progress = getByTestId('progress');

    expect(baseElement).toBeTruthy();
    expect(title.innerHTML).toBe(DYNAMIC_NOTIFICATION.title);
    expect(progress).toBeTruthy();
  });

  it('Should correctly render notification details', () => {
    const { getByTestId, queryAllByTestId } = renderWithContext(<DynamicNotification {...DYNAMIC_NOTIFICATION} />);
    const showDetailsButton = getByTestId('show-details');

    fireEvent.click(showDetailsButton);

    const files = queryAllByTestId('file');

    expect(files?.length).toBe(3);
  });

  it('Should correctly render all completed notification details', () => {
    const { getByTestId, queryAllByTestId } = renderWithContext(
      <DynamicNotification {...DYNAMIC_NOTIFICATION_COMPLETED} />,
    );
    const showDetailsButton = getByTestId('show-details');
    const progress = queryAllByTestId('progress');

    expect(progress.length).toBeFalsy();

    fireEvent.click(showDetailsButton);

    const files = queryAllByTestId('file');

    expect(files?.length).toBe(1);
  });

  it('Should correctly render notification without file details', () => {
    const { getByTestId, queryAllByTestId } = renderWithContext(
      <DynamicNotification {...DYNAMIC_NOTIFICATION_EMPTY} />,
    );
    const showDetailsButton = getByTestId('show-details');

    fireEvent.click(showDetailsButton);

    const files = queryAllByTestId('file');

    expect(files?.length).toBe(0);
  });
});
