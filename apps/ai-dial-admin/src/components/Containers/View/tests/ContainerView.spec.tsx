import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';

const { showNotificationSpy } = vi.hoisted(() => ({
  showNotificationSpy: vi.fn(),
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationSpy }),
}));

type Listener = (event: { data?: unknown }) => void;

class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static instances: MockEventSource[] = [];

  url: string;
  readyState: number = MockEventSource.CONNECTING;
  listeners: Record<string, Listener[]> = {};

  addEventListener = vi.fn((name: string, fn: Listener) => {
    (this.listeners[name] ||= []).push(fn);
  });
  removeEventListener = vi.fn((name: string, fn: Listener) => {
    this.listeners[name] = (this.listeners[name] || []).filter((listener) => listener !== fn);
  });
  close = vi.fn(() => {
    this.readyState = MockEventSource.CLOSED;
  });

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  dispatch(name: string, data?: unknown) {
    (this.listeners[name] || []).forEach((fn) => fn({ data }));
  }
}

vi.stubGlobal('EventSource', MockEventSource);

vi.mock('@/src/app/actions/deployments', () => ({
  getContainer: vi.fn().mockResolvedValue({ success: true, response: undefined }),
  getContainerPods: vi.fn().mockResolvedValue([]),
  updateContainer: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/src/components/EntityHeaderControls/ContainersHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="containers-header" />,
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  __esModule: true,
  default: () => <div data-testid="json-editor" />,
}));

vi.mock('../TabsContent', () => ({
  __esModule: true,
  default: () => <div data-testid="tabs-content" />,
}));

import ContainerView from '../ContainerView';
import { CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { DeploymentsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import type { Container } from '@/src/models/deployments/containers';

const baseContainer: Container = {
  name: 'container-1',
  $type: CONTAINER_TYPE.APPLICATION,
  source: { $type: 'image' } as never,
  status: CONTAINER_STATUS.RUNNING,
  metadata: {},
};

const renderView = () =>
  render(<ContainerView container={baseContainer} route={ApplicationRoute.McpContainers} names={[]} />);

describe('ContainerView events SSE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
  });

  test('opens EventSource with the container name in the URL', () => {
    renderView();
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe('/api/events?id=container-1');
  });

  test('native error in CONNECTING state stays silent and does not close', () => {
    renderView();
    const source = MockEventSource.instances[0];
    expect(source.readyState).toBe(MockEventSource.CONNECTING);

    act(() => {
      source.dispatch('error');
    });
    expect(showNotificationSpy).not.toHaveBeenCalled();
    expect(source.close).not.toHaveBeenCalled();
  });

  test('native error in CLOSED state shows generic EventsError notification', () => {
    renderView();
    const source = MockEventSource.instances[0];

    act(() => {
      source.readyState = MockEventSource.CLOSED;
      source.dispatch('error');
    });
    expect(showNotificationSpy).toHaveBeenCalledTimes(1);
    const notification = showNotificationSpy.mock.calls[0][0];
    expect(notification.description).toBe(DeploymentsI18nKey.EventsError);
  });

  test('server-sent named error event surfaces backend message and closes', () => {
    renderView();
    const source = MockEventSource.instances[0];

    act(() => {
      source.dispatch('error', JSON.stringify({ message: 'deployment removed' }));
    });
    expect(source.close).toHaveBeenCalledTimes(1);
    expect(showNotificationSpy).toHaveBeenCalledTimes(1);
    const notification = showNotificationSpy.mock.calls[0][0];
    expect(notification.description).toBe('deployment removed');
  });

  test('does not subscribe to open events (events buffer is preserved across reconnects)', () => {
    renderView();
    const source = MockEventSource.instances[0];
    const subscribedEvents = source.addEventListener.mock.calls.map(([name]) => name);
    expect(subscribedEvents).not.toContain('open');
    // The backend's k8s watch does not replay history on reconnect, so the
    // accumulated events must remain in state across browser auto-reconnects.
    // No `open` handler == no reset path.
  });

  test('unmount closes EventSource and removes listeners', () => {
    const { unmount } = renderView();
    const source = MockEventSource.instances[0];
    const addedListenerCount = source.addEventListener.mock.calls.length;
    unmount();
    expect(source.close).toHaveBeenCalledTimes(1);
    expect(source.removeEventListener).toHaveBeenCalledTimes(addedListenerCount);
  });
});
