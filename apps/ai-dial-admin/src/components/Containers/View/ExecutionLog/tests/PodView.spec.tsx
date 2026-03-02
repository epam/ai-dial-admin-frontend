import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockClose = vi.fn();

class MockEventSource {
  constructor(public url: string) {
    MockEventSource.instances.push(this);
  }
  static instances: MockEventSource[] = [];
  addEventListener = mockAddEventListener;
  removeEventListener = mockRemoveEventListener;
  close = mockClose;
}

vi.stubGlobal('EventSource', MockEventSource);

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialNoDataContent: ({ title }: any) => <div data-testid="no-data">{title}</div>,
}));

vi.mock('@/src/components/Common/LogViewer/LogViewer', () => ({
  __esModule: true,
  default: ({ logs }: any) => <div data-testid="log-viewer">{logs}</div>,
}));

vi.mock('@/src/components/Common/LabelledText/LabelledText', () => ({
  __esModule: true,
  default: ({ label, text }: any) => <div data-testid={`label-${label}`}>{text}</div>,
}));

import PodView from '../PodView';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
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
});
