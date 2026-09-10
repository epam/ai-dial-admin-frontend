import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

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

  test('hides the Footer and never polls status/core-version/BE-version when the admin API is disabled', async () => {
    adminApiEnabled.value = false;
    render(
      <Content isEnableAuth={false}>
        <div>Test Content</div>
      </Content>,
    );

    expect(screen.queryByText(/Admin: \[FE\]/)).not.toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getAppProcessStatus).not.toHaveBeenCalled();
    expect(getCoreVersions).not.toHaveBeenCalled();
    expect(getBeVersion).not.toHaveBeenCalled();
  });
});
