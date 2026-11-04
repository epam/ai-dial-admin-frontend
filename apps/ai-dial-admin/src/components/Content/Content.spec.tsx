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
const sidebarState = { value: { show: false, position: 'right' } };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: sidebarState.value,
    featureFlags: { adminApiEnabled: adminApiEnabled.value },
  }),
}));

describe('Content', () => {
  beforeEach(() => {
    adminApiEnabled.value = true;
    sidebarState.value = { show: false, position: 'right' };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders children', () => {
    render(
      <Content>
        <div>Test Content</div>
      </Content>,
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('clips the shell without making it scrollable', () => {
    render(
      <Content>
        <div>Test Content</div>
      </Content>,
    );

    const shell = screen.getByText('Test Content').closest('.overflow-clip');
    expect(shell).toBeInTheDocument();
    expect(shell).toHaveClass('relative', 'min-h-0');
    expect(document.querySelector('.overflow-hidden')).toBeNull();
  });

  test('pads the page slot with a single gutter: 16px on mobile, 24px from tablet up', () => {
    render(
      <Content>
        <div>Test Content</div>
      </Content>,
    );

    expect(screen.getByText('Test Content').parentElement).toHaveClass(
      'px-4',
      'pt-4',
      'pb-4',
      'md:px-6',
      'md:pt-6',
      'md:pb-6',
    );
  });

  test('drops the bottom gutter while the bottom sidebar is open', () => {
    sidebarState.value = { show: true, position: 'bottom' };
    render(
      <Content>
        <div>Test Content</div>
      </Content>,
    );

    const slot = screen.getByText('Test Content').parentElement;
    expect(slot).toHaveClass('pb-0');
    expect(slot).not.toHaveClass('pb-4');
  });

  test('renders the Footer and polls status/core-version/BE-version when the admin API is enabled', async () => {
    render(
      <Content>
        <div>Test Content</div>
      </Content>,
    );

    expect(screen.getByText(/Admin: \[FE\]/)).toBeInTheDocument();
    await vi.waitFor(() => expect(getAppProcessStatus).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(getCoreVersions).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(getBeVersion).toHaveBeenCalledOnce());
  });

  test('shows only FE and Core versions in the Footer and polls Core version when the admin API is disabled', async () => {
    adminApiEnabled.value = false;
    (getCoreVersions as any).mockResolvedValue({ response: { autoDetectedVersion: '1.2.3' } });
    render(
      <Content>
        <div>Test Content</div>
      </Content>,
    );

    expect(screen.queryByText(/Admin: \[FE\]/)).toBeInTheDocument();
    await vi.waitFor(() => expect(getCoreVersions).toHaveBeenCalledOnce());
    expect(getAppProcessStatus).not.toHaveBeenCalled();
    expect(getBeVersion).not.toHaveBeenCalled();
  });

  test('refreshes Core version on the configured interval when the admin API is disabled', async () => {
    vi.useFakeTimers();
    adminApiEnabled.value = false;
    render(
      <Content>
        <div>Test Content</div>
      </Content>,
    );

    expect(getCoreVersions).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(60 * 1000);
    expect(getCoreVersions).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
