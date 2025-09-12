import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DynamicNotification from '../DynamicNotification';
import { NotificationType } from '@/src/models/notification';

const baseProps = {
  id: '1',
  type: NotificationType.dynamic,
  title: 'Dynamic Title',
  onClose: vi.fn(),
};

describe('DynamicNotification', () => {
  it('renders title', () => {
    render(<DynamicNotification {...baseProps} />);
    expect(screen.getByText('Dynamic Title')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<DynamicNotification {...baseProps} />);
    const closeBtn = screen.getAllByRole('button')[1];
    fireEvent.click(closeBtn);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('shows file details when details button is clicked', () => {
    const downloadDetails = [{ id: '1', name: 'file1', progress: 50, failed: false, complete: false }];
    render(<DynamicNotification {...baseProps} downloadDetails={downloadDetails} />);
    const detailsBtn = screen.getAllByRole('button')[0];
    fireEvent.click(detailsBtn);
    expect(screen.getByText('file1')).toBeInTheDocument();
  });
});
