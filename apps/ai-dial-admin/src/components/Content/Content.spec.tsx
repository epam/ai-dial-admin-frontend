import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { getAppProcessStatus, getBeVersion, getCoreVersions } from '@/src/app/actions';
import Content from './Content';

vi.mock('@/src/app/actions', () => ({
  getAppProcessStatus: vi.fn().mockResolvedValue({ response: { success: true, errors: [] } }),
  getCoreVersions: vi.fn().mockResolvedValue({ response: undefined }),
  getBeVersion: vi.fn().mockResolvedValue('1.0.0'),
  setCoreVersion: vi.fn(),
}));

const adminApiEnabled = { value: true };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: { show: false, position: 'right' },
    featureFlags: { adminApiEnabled: adminApiEnabled.value },
  }),
}));

describe('Content', () => {
  beforeEach(() => {
    adminApiEnabled.value = true;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders children', () => {
    render(
      <Content isEnableAuth={true}>
        <div>Test Content</div>
      </Content>,
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('renders the Footer and polls status/core-version/BE-version when the admin API is enabled', async () => {
    render(
      <Content isEnableAuth={false}>
        <div>Test Content</div>
      </Content>,
    );

    expect(screen.getByText(/Admin: \[FE\]/)).toBeInTheDocument();
    await waitFor(() => expect(getAppProcessStatus).toHaveBeenCalledOnce());
    await waitFor(() => expect(getCoreVersions).toHaveBeenCalledOnce());
    await waitFor(() => expect(getBeVersion).toHaveBeenCalledOnce());
  });

  test('shows only FE and Core versions in the Footer and polls Core version when the admin API is disabled', async () => {
    adminApiEnabled.value = false;
    (getCoreVersions as any).mockResolvedValue({ response: { autoDetectedVersion: '1.2.3' } });
    render(
      <Content isEnableAuth={false}>
        <div>Test Content</div>
      </Content>,
    );

    expect(screen.queryByText(/Admin: \[FE\]/)).toBeInTheDocument();
    await waitFor(() => expect(getCoreVersions).toHaveBeenCalledOnce());
    expect(getAppProcessStatus).not.toHaveBeenCalled();
    expect(getBeVersion).not.toHaveBeenCalled();
  });

  test('refreshes Core version on the configured interval when the admin API is disabled', async () => {
    vi.useFakeTimers();
    adminApiEnabled.value = false;
    render(
      <Content isEnableAuth={false}>
        <div>Test Content</div>
      </Content>,
    );

    expect(getCoreVersions).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(60 * 1000);
    expect(getCoreVersions).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
