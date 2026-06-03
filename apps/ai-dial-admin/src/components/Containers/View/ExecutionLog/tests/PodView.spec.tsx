import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

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

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialNoDataContent: ({ title }: any) => <div data-testid="no-data">{title}</div>,
}));

vi.mock('@/src/components/Common/LogViewer/LogViewer', () => ({
  __esModule: true,
  default: ({ logs }: any) => (
    <div role="log" aria-label="pod-logs">
      {logs}
    </div>
  ),
}));

vi.mock('@/src/components/Common/LabelledText/LabelledText', () => ({
  __esModule: true,
  default: ({ label, text }: any) => <div data-testid={`label-${label}`}>{text}</div>,
}));

import PodView from '../PodView';
import { DeploymentsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import type { Pod } from '@/src/models/deployments/containers';

const makePod = (name: string, overrides?: Partial<Pod>): Pod => ({
  name,
  createdAt: Date.now(),
  ...overrides,
});

describe('PodView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockEventSource.instances = [];
  });

  test('shows no-data placeholder when there are no logs', () => {
    render(<PodView pod={makePod('pod-1')} containerId="c1" route={ApplicationRoute.McpContainers} />);
    expect(screen.getByTestId('no-data')).toBeInTheDocument();
  });

  test('opens EventSource with correct URL', () => {
    render(<PodView pod={makePod('pod-1')} containerId="c1" route={ApplicationRoute.McpContainers} />);
    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.instances[0].url).toBe('/api/sse?entity=container&id=c1&podName=pod-1');
  });

  test('does not open EventSource when containerId is missing', () => {
    render(<PodView pod={makePod('pod-1')} route={ApplicationRoute.McpContainers} />);
    expect(MockEventSource.instances).toHaveLength(0);
  });

  test('displays restart info when pod has restarts', () => {
    render(
      <PodView
        pod={makePod('pod-1', { restartCount: 5, lastFinishedAt: 1700000000000, lastTerminationReason: 'OOMKilled' })}
        containerId="c1"
        route={ApplicationRoute.McpContainers}
      />,
    );
    expect(screen.getByTestId(`label-${EntityFieldsI18nKey.Restarts}`)).toHaveTextContent('5');
    expect(screen.getByTestId(`label-${EntityFieldsI18nKey.LastRestartedAt}`)).toBeInTheDocument();
    expect(screen.getByTestId(`label-${EntityFieldsI18nKey.LastReason}`)).toBeInTheDocument();
  });

  test('hides restart info when restartCount is absent', () => {
    render(<PodView pod={makePod('pod-1')} containerId="c1" route={ApplicationRoute.McpContainers} />);
    expect(screen.queryByTestId(`label-${EntityFieldsI18nKey.Restarts}`)).not.toBeInTheDocument();
  });

  test('shows termination message when present', () => {
    render(
      <PodView
        pod={makePod('pod-1', { restartCount: 2, lastTerminationMessage: 'container failed: invalid --foo argument' })}
        containerId="c1"
        route={ApplicationRoute.McpContainers}
      />,
    );
    expect(screen.getByTestId(`label-${EntityFieldsI18nKey.TerminationMessage}`)).toHaveTextContent(
      'container failed: invalid --foo argument',
    );
  });

  test('hides termination message when absent even with restarts', () => {
    render(
      <PodView
        pod={makePod('pod-1', { restartCount: 2 })}
        containerId="c1"
        route={ApplicationRoute.McpContainers}
      />,
    );
    expect(screen.queryByTestId(`label-${EntityFieldsI18nKey.TerminationMessage}`)).not.toBeInTheDocument();
  });

  test('shows termination message even when restartCount is 0 (fail-to-start)', () => {
    render(
      <PodView
        pod={makePod('pod-1', {
          restartCount: 0,
          lastTerminationReason: 'StartError',
          lastTerminationMessage: 'exec: "--model": bad argument',
          lastFinishedAt: 1700000000000,
        })}
        containerId="c1"
        route={ApplicationRoute.McpContainers}
      />,
    );
    // The restart row stays gated on restartCount, so it is hidden at 0...
    expect(screen.queryByTestId(`label-${EntityFieldsI18nKey.Restarts}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`label-${EntityFieldsI18nKey.LastReason}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`label-${EntityFieldsI18nKey.LastRestartedAt}`)).not.toBeInTheDocument();
    // ...but the termination message is shown on its own.
    expect(screen.getByTestId(`label-${EntityFieldsI18nKey.TerminationMessage}`)).toHaveTextContent(
      'exec: "--model": bad argument',
    );
  });

  test('appends incoming log lines to the rendered buffer', () => {
    render(<PodView pod={makePod('pod-1')} containerId="c1" route={ApplicationRoute.McpContainers} />);
    const source = MockEventSource.instances[0];
    act(() => {
      source.dispatch('logs', 'first line');
      source.dispatch('logs', 'second line');
    });
    const log = screen.getByRole('log');
    expect(log.textContent).toContain('first line');
    expect(log.textContent).toContain('second line');
  });

  test('native error in CONNECTING state stays silent and does not close', () => {
    render(<PodView pod={makePod('pod-1')} containerId="c1" route={ApplicationRoute.McpContainers} />);
    const source = MockEventSource.instances[0];
    expect(source.readyState).toBe(MockEventSource.CONNECTING);

    act(() => {
      source.dispatch('error');
    });
    expect(showNotificationSpy).not.toHaveBeenCalled();
    expect(source.close).not.toHaveBeenCalled();
  });

  test('native error in CLOSED state shows generic LogsError notification', () => {
    render(<PodView pod={makePod('pod-1')} containerId="c1" route={ApplicationRoute.McpContainers} />);
    const source = MockEventSource.instances[0];

    act(() => {
      source.readyState = MockEventSource.CLOSED;
      source.dispatch('error');
    });
    expect(showNotificationSpy).toHaveBeenCalledTimes(1);
    const notification = showNotificationSpy.mock.calls[0][0];
    expect(notification.description).toBe(DeploymentsI18nKey.LogsError);
  });

  test('server-sent named error event surfaces backend message and closes', () => {
    render(<PodView pod={makePod('pod-1')} containerId="c1" route={ApplicationRoute.McpContainers} />);
    const source = MockEventSource.instances[0];

    act(() => {
      source.dispatch('error', JSON.stringify({ message: 'pod gone' }));
    });
    expect(source.close).toHaveBeenCalledTimes(1);
    expect(showNotificationSpy).toHaveBeenCalledTimes(1);
    const notification = showNotificationSpy.mock.calls[0][0];
    expect(notification.description).toBe('pod gone');
  });

  test('reconnect open clears the buffer because the backend re-streams the full log', () => {
    render(<PodView pod={makePod('pod-1')} containerId="c1" route={ApplicationRoute.McpContainers} />);
    const source = MockEventSource.instances[0];

    act(() => {
      source.dispatch('open');
      source.dispatch('logs', 'first line');
      source.dispatch('logs', 'second line');
    });
    expect(screen.getByRole('log').textContent).toContain('first line');

    act(() => {
      source.dispatch('open');
    });
    // Buffer cleared on reconnect; LogViewer unmounts and the no-data placeholder renders.
    expect(screen.queryByRole('log')).not.toBeInTheDocument();
    expect(screen.getByTestId('no-data')).toBeInTheDocument();

    act(() => {
      source.dispatch('logs', 'first line');
      source.dispatch('logs', 'second line');
      source.dispatch('logs', 'third line');
    });
    const log = screen.getByRole('log');
    expect(log.textContent).toContain('first line');
    expect(log.textContent).toContain('third line');
    // No duplication of previous-session lines.
    expect(log.textContent?.match(/first line/g)).toHaveLength(1);
  });

  test('unmount closes EventSource and removes every listener it added', () => {
    const { unmount } = render(
      <PodView pod={makePod('pod-1')} containerId="c1" route={ApplicationRoute.McpContainers} />,
    );
    const source = MockEventSource.instances[0];
    const addedListenerCount = source.addEventListener.mock.calls.length;
    unmount();
    expect(source.close).toHaveBeenCalledTimes(1);
    expect(source.removeEventListener).toHaveBeenCalledTimes(addedListenerCount);
  });
});
