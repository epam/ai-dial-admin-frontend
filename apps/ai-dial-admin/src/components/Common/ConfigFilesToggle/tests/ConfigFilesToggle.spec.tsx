import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ConfigFilesToggle from '../ConfigFilesToggle';

const mockContext = {
  adminApiEnabled: false,
  showConfigFiles: false,
  toggleShowConfigFiles: vi.fn(),
};

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    featureFlags: { deploymentsEnabled: true, adminApiEnabled: mockContext.adminApiEnabled },
    showConfigFiles: mockContext.showConfigFiles,
    toggleShowConfigFiles: mockContext.toggleShowConfigFiles,
  }),
}));

describe('ConfigFilesToggle', () => {
  test('renders when the admin API is disabled', () => {
    mockContext.adminApiEnabled = false;

    render(<ConfigFilesToggle />);

    expect(screen.getByRole('switch')).toBeTruthy();
  });

  test('is absent when the admin API is enabled', () => {
    mockContext.adminApiEnabled = true;

    render(<ConfigFilesToggle />);

    expect(screen.queryByRole('switch')).toBeNull();
  });

  test('clicking it calls toggleShowConfigFiles', async () => {
    mockContext.adminApiEnabled = false;
    mockContext.toggleShowConfigFiles = vi.fn();
    const user = userEvent.setup();

    render(<ConfigFilesToggle />);
    await user.click(screen.getByRole('switch'));

    expect(mockContext.toggleShowConfigFiles).toHaveBeenCalledOnce();
  });
});
