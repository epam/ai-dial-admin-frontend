import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { Image } from '@/src/models/deployments/images';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TYPE } from '@/src/types/deployments/images';

const { showNotificationSpy, stableT } = vi.hoisted(() => ({
  showNotificationSpy: vi.fn(),
  stableT: (key: string, params?: Record<string, string>) => {
    if (params?.domain) return `Domain ${params.domain} blocked`;
    return key;
  },
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

vi.mock('@/src/components/Deployments/Common/BlockedDomainBanner/BlockedDomainBanner', () => ({
  __esModule: true,
  default: ({
    message,
    buttonLabel,
    onAddToAllowed,
  }: {
    message: React.ReactNode;
    buttonLabel: string;
    onAddToAllowed: () => void;
  }) => (
    <div role="alert">
      <span>{message}</span>
      <button onClick={onAddToAllowed}>{buttonLabel}</button>
    </div>
  ),
}));

import InstallationLog from '@/src/components/Images/View/InstallationLog/InstallationLog';

const makeImage = (overrides: Partial<Image> = {}): Image => ({
  $type: IMAGE_TYPE.MCP,
  id: 'img-1',
  name: 'My image',
  buildStatus: IMAGE_STATUS.BUILD_FAILED,
  version: '1.0.0',
  source: { $type: IMAGE_SOURCE_TYPE.DOCKER },
  allowedDomains: [],
  ...overrides,
});

describe('InstallationLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
  });

  test('opens EventSource with the image id in the URL', () => {
    render(
      <InstallationLog selectedImage={makeImage({ id: 'img-1' })} onChange={vi.fn()} setHasBlockedDomains={vi.fn()} />,
    );
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe('/api/sse?entity=image&id=img-1');
  });

  test('does not open EventSource when image id is empty', () => {
    render(<InstallationLog selectedImage={makeImage({ id: '' })} onChange={vi.fn()} setHasBlockedDomains={vi.fn()} />);
    expect(MockEventSource.instances).toHaveLength(0);
  });

  test('appends incoming log lines to the rendered buffer', () => {
    render(<InstallationLog selectedImage={makeImage()} onChange={vi.fn()} setHasBlockedDomains={vi.fn()} />);
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('logs', 'first line');
      source.dispatch('logs', 'second line');
    });
    const log = screen.getByRole('log');
    expect(log.textContent).toContain('first line');
    expect(log.textContent).toContain('second line');
  });

  test('error event closes the stream and shows a notification (JSON payload)', () => {
    render(<InstallationLog selectedImage={makeImage()} onChange={vi.fn()} setHasBlockedDomains={vi.fn()} />);
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('error', JSON.stringify({ message: 'boom' }));
    });
    expect(source.close).toHaveBeenCalledTimes(1);
    expect(showNotificationSpy).toHaveBeenCalledTimes(1);
  });

  test('error event with non-JSON payload still closes the stream and shows a notification', () => {
    render(<InstallationLog selectedImage={makeImage()} onChange={vi.fn()} setHasBlockedDomains={vi.fn()} />);
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('error', 'not-json');
    });
    expect(source.close).toHaveBeenCalledTimes(1);
    expect(showNotificationSpy).toHaveBeenCalledTimes(1);
  });

  test('unmount closes EventSource and removes every listener it added', () => {
    const { unmount } = render(
      <InstallationLog selectedImage={makeImage()} onChange={vi.fn()} setHasBlockedDomains={vi.fn()} />,
    );
    const source = MockEventSource.instances[0];
    const addedListenerCount = source.addEventListener.mock.calls.length;
    unmount();
    expect(source.close).toHaveBeenCalledTimes(1);
    expect(source.removeEventListener).toHaveBeenCalledTimes(addedListenerCount);
  });

  test('BLOCKED domain event shows the banner and reports hasBlockedDomains=true', () => {
    const setHasBlockedDomains = vi.fn();
    render(
      <InstallationLog selectedImage={makeImage()} onChange={vi.fn()} setHasBlockedDomains={setHasBlockedDomains} />,
    );
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('domain', JSON.stringify({ domain: 'blocked.example.com', verdict: 'BLOCKED' }));
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(setHasBlockedDomains).toHaveBeenCalledWith(true);
  });

  test('ALLOWED domain event is ignored', () => {
    const setHasBlockedDomains = vi.fn();
    render(
      <InstallationLog selectedImage={makeImage()} onChange={vi.fn()} setHasBlockedDomains={setHasBlockedDomains} />,
    );
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('domain', JSON.stringify({ domain: 'allowed.example.com', verdict: 'ALLOWED' }));
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(setHasBlockedDomains).not.toHaveBeenCalled();
  });

  test('BLOCKED domain already in allowedDomains is filtered out', () => {
    const setHasBlockedDomains = vi.fn();
    render(
      <InstallationLog
        selectedImage={makeImage({ allowedDomains: ['x.example.com'] })}
        onChange={vi.fn()}
        setHasBlockedDomains={setHasBlockedDomains}
      />,
    );
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('domain', JSON.stringify({ domain: 'x.example.com', verdict: 'BLOCKED' }));
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(setHasBlockedDomains).not.toHaveBeenCalled();
  });

  test('clicking the banner button merges into allowedDomains, clears state, reports false', () => {
    const onChange = vi.fn();
    const setHasBlockedDomains = vi.fn();
    render(
      <InstallationLog
        selectedImage={makeImage({ allowedDomains: ['existing.example.com'] })}
        onChange={onChange}
        setHasBlockedDomains={setHasBlockedDomains}
      />,
    );
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('domain', JSON.stringify({ domain: 'a.example.com', verdict: 'BLOCKED' }));
    });
    setHasBlockedDomains.mockClear();

    fireEvent.click(screen.getByRole('button'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedDomains: ['existing.example.com', 'a.example.com'],
      }),
    );
    expect(setHasBlockedDomains).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
