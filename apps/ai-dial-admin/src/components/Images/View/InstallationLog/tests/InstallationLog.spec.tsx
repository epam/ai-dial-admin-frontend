import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

const { showNotificationSpy, stableT } = vi.hoisted(() => ({
  showNotificationSpy: vi.fn(),
  stableT: (key: string) => key,
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationSpy }),
}));

vi.mock('@/src/locales/client', () => ({
  useI18n: () => stableT,
  useCurrentLocale: () => 'en',
}));

type Listener = (event: { data?: unknown }) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  listeners: Record<string, Listener[]> = {};
  addEventListener = vi.fn((name: string, fn: Listener) => {
    (this.listeners[name] ||= []).push(fn);
  });
  removeEventListener = vi.fn((name: string, fn: Listener) => {
    this.listeners[name] = (this.listeners[name] || []).filter((listener) => listener !== fn);
  });
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  dispatch(name: string, data?: unknown) {
    (this.listeners[name] || []).forEach((fn) => fn({ data }));
  }
}

vi.stubGlobal('EventSource', MockEventSource);

vi.mock('@/src/components/Common/LogViewer/LogViewer', () => ({
  __esModule: true,
  default: ({ logs }: { logs: string }) => (
    <div role="log" aria-label="installation-logs">
      {logs}
    </div>
  ),
}));

import InstallationLog from '../InstallationLog';

describe('InstallationLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
  });

  test('opens EventSource with the build id in the URL', () => {
    render(<InstallationLog imageBuildId="build-1" />);
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe('/api/sse?entity=image&id=build-1');
  });

  test('does not open EventSource when imageBuildId is missing', () => {
    render(<InstallationLog />);
    expect(MockEventSource.instances).toHaveLength(0);
  });

  test('appends incoming log lines to the rendered buffer', () => {
    render(<InstallationLog imageBuildId="build-1" />);
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('logs', 'first line');
      source.dispatch('logs', 'second line');
    });
    const log = screen.getByRole('log');
    expect(log.textContent).toContain('first line');
    expect(log.textContent).toContain('second line');
  });

  test('status events do not close the stream and subsequent logs are still appended', () => {
    render(<InstallationLog imageBuildId="build-1" />);
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('logs', 'before status');
      source.dispatch('status', 'InProgress');
      source.dispatch('logs', 'after status');
    });
    expect(source.close).not.toHaveBeenCalled();
    const log = screen.getByRole('log');
    expect(log.textContent).toContain('before status');
    expect(log.textContent).toContain('after status');
  });

  test('error event closes the stream and shows a notification', () => {
    render(<InstallationLog imageBuildId="build-1" />);
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('error', JSON.stringify({ message: 'boom' }));
    });
    expect(source.close).toHaveBeenCalledTimes(1);
    expect(showNotificationSpy).toHaveBeenCalledTimes(1);
  });

  test('error event with non-JSON payload still closes the stream and shows a notification', () => {
    render(<InstallationLog imageBuildId="build-1" />);
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('error', 'not-json');
    });
    expect(source.close).toHaveBeenCalledTimes(1);
    expect(showNotificationSpy).toHaveBeenCalledTimes(1);
  });

  test('unmount closes EventSource and removes every listener it added', () => {
    const { unmount } = render(<InstallationLog imageBuildId="build-1" />);
    const source = MockEventSource.instances[0];
    const addedListenerCount = source.addEventListener.mock.calls.length;
    unmount();
    expect(source.close).toHaveBeenCalledTimes(1);
    expect(source.removeEventListener).toHaveBeenCalledTimes(addedListenerCount);
  });
});
