import { NotificationType } from '@/src/models/notification';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import DynamicNotification from '../DynamicNotification';

const baseProps = {
  id: '1',
  type: NotificationType.dynamic,
  title: 'Dynamic Title',
  onClose: vi.fn(),
};

describe('DynamicNotification', () => {
  test('renders title', () => {
    render(<DynamicNotification {...baseProps} />);
    expect(screen.getByText('Dynamic Title')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(<DynamicNotification {...baseProps} />);
    const closeBtn = screen.getAllByRole('button')[1];
    fireEvent.click(closeBtn);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  test('shows file details when details button is clicked', () => {
    const downloadDetails = [{ id: '1', name: 'file1', progress: 50, failed: false, complete: false }];
    render(<DynamicNotification {...baseProps} downloadDetails={downloadDetails} />);
    const detailsBtn = screen.getAllByRole('button')[0];
    fireEvent.click(detailsBtn);
    expect(screen.getByText('file1')).toBeInTheDocument();
  });
});
