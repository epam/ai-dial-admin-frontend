import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { Container, Pod } from '@/src/models/deployments/containers';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

const { stableT } = vi.hoisted(() => ({
  stableT: (key: string, params?: Record<string, string>) => {
    if (params?.domains) return `Domain ${params.domains} blocked`;
    if (params?.domain) return `Domain ${params.domain} blocked`;
    return key;
  },
}));

vi.mock('@/src/locales/client', () => ({
  useI18n: () => stableT,
  useCurrentLocale: () => 'en',
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialCollapsibleSidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialTabs: () => <div />,
  DialNoDataContent: ({ title }: { title: string }) => <div>{title}</div>,
  TabOrientation: { Vertical: 'vertical' },
}));

const podViewProps: Array<{ onBlockedDomain: (domain: string) => void }> = [];

vi.mock('@/src/components/Containers/View/ExecutionLog/PodView', () => ({
  __esModule: true,
  default: (props: { onBlockedDomain: (domain: string) => void }) => {
    podViewProps.push(props);
    return <div data-role="pod-view" />;
  },
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

import ExecutionLog from '@/src/components/Containers/View/ExecutionLog/ExecutionLog';

const makeContainer = (overrides: Partial<Container> = {}): Container => ({
  $type: CONTAINER_TYPE.MCP,
  name: 'my-container',
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE },
  status: CONTAINER_STATUS.STOPPED,
  metadata: {},
  allowedDomains: [],
  ...overrides,
});

const makePod = (name: string): Pod => ({ name, createdAt: Date.now() });

const lastOnBlocked = () => podViewProps[podViewProps.length - 1].onBlockedDomain;

describe('ExecutionLog', () => {
  beforeEach(() => {
    podViewProps.length = 0;
  });

  test('does not render banner initially', () => {
    render(
      <ExecutionLog
        route={ApplicationRoute.McpContainers}
        pods={[makePod('pod-1')]}
        selectedContainer={makeContainer()}
        onChange={vi.fn()}
        setHasBlockedDomains={vi.fn()}
      />,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('renders banner and reports hasBlockedDomains=true on a BLOCKED domain', () => {
    const setHasBlockedDomains = vi.fn();
    render(
      <ExecutionLog
        route={ApplicationRoute.McpContainers}
        pods={[makePod('pod-1')]}
        selectedContainer={makeContainer()}
        onChange={vi.fn()}
        setHasBlockedDomains={setHasBlockedDomains}
      />,
    );
    act(() => lastOnBlocked()('a.example.com'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(setHasBlockedDomains).toHaveBeenCalledWith(true);
  });

  test('joins multiple BLOCKED domains with a comma in the banner message', () => {
    render(
      <ExecutionLog
        route={ApplicationRoute.McpContainers}
        pods={[makePod('pod-1')]}
        selectedContainer={makeContainer()}
        onChange={vi.fn()}
        setHasBlockedDomains={vi.fn()}
      />,
    );
    act(() => {
      lastOnBlocked()('a.example.com');
      lastOnBlocked()('b.example.com');
    });
    expect(screen.getByRole('alert').textContent).toContain('a.example.com, b.example.com');
  });

  test('deduplicates repeated BLOCKED domains', () => {
    render(
      <ExecutionLog
        route={ApplicationRoute.McpContainers}
        pods={[makePod('pod-1')]}
        selectedContainer={makeContainer()}
        onChange={vi.fn()}
        setHasBlockedDomains={vi.fn()}
      />,
    );
    act(() => {
      lastOnBlocked()('a.example.com');
      lastOnBlocked()('a.example.com');
    });
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('a.example.com');
    expect(alert.textContent).not.toContain('a.example.com, a.example.com');
  });

  test('ignores a BLOCKED domain already in selectedContainer.allowedDomains', () => {
    const setHasBlockedDomains = vi.fn();
    render(
      <ExecutionLog
        route={ApplicationRoute.McpContainers}
        pods={[makePod('pod-1')]}
        selectedContainer={makeContainer({ allowedDomains: ['x.example.com'] })}
        onChange={vi.fn()}
        setHasBlockedDomains={setHasBlockedDomains}
      />,
    );
    act(() => lastOnBlocked()('x.example.com'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(setHasBlockedDomains).not.toHaveBeenCalled();
  });

  test('clicking the banner merges into allowedDomains, clears state, reports false', () => {
    const onChange = vi.fn();
    const setHasBlockedDomains = vi.fn();
    render(
      <ExecutionLog
        route={ApplicationRoute.McpContainers}
        pods={[makePod('pod-1')]}
        selectedContainer={makeContainer({ allowedDomains: ['existing.example.com'] })}
        onChange={onChange}
        setHasBlockedDomains={setHasBlockedDomains}
      />,
    );
    act(() => {
      lastOnBlocked()('a.example.com');
      lastOnBlocked()('b.example.com');
    });
    setHasBlockedDomains.mockClear();

    fireEvent.click(screen.getByRole('button'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedDomains: ['existing.example.com', 'a.example.com', 'b.example.com'],
      }),
    );
    expect(setHasBlockedDomains).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
