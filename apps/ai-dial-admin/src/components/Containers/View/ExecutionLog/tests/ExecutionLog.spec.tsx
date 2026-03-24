import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ContainersI18nKey, EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import type { Pod } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import ExecutionLog from '../ExecutionLog';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialCollapsibleSidebar: ({ title, children }: any) => (
    <aside role="complementary" aria-label="pods-sidebar">
      <h2>{title}</h2>
      {children}
    </aside>
  ),
  DialNoDataContent: ({ title }: any) => <div role="status">{title}</div>,
  DialTabs: ({ tabs, activeTab, onClick }: any) => (
    <nav aria-label="pods-tabs">
      {tabs.map((tab: any) => (
        <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} onClick={() => onClick(tab.id)}>
          {tab.label}
        </button>
      ))}
    </nav>
  ),
  TabOrientation: { Vertical: 'vertical' },
}));

vi.mock('@/src/components/Containers/View/ExecutionLog/PodView', () => ({
  default: ({ pod, containerId, route }: any) => (
    <section role="region" aria-label="pod-view">
      <div>Pod: {pod?.name || 'empty-name'}</div>
      <div>ContainerId: {containerId || 'none'}</div>
      <div>Route: {route}</div>
    </section>
  ),
}));

vi.mock('../../../../utils/deployments/entity', () => ({
  getTranslatedDeploymentType: () => 'container',
}));

const makePod = (name: string, overrides?: Partial<Pod>): Pod => ({
  name,
  createdAt: Date.now(),
  ...overrides,
});

describe('ExecutionLog', () => {
  test('renders empty state when no pods are provided', () => {
    render(<ExecutionLog containerId="c1" route={ApplicationRoute.McpContainers} pods={[]} />);

    expect(screen.getByRole('status')).toHaveTextContent(EntitiesI18nKey.NoContainerLogs);
    expect(screen.queryByRole('region', { name: 'pod-view' })).not.toBeInTheDocument();
  });

  test('renders PodView for single pod without sidebar tabs', () => {
    render(
      <ExecutionLog
        containerId="c1"
        route={ApplicationRoute.McpContainers}
        pods={[makePod('pod-1', { restartCount: 2 })]}
      />,
    );

    expect(screen.getByRole('region', { name: 'pod-view' })).toBeInTheDocument();
    expect(screen.getByText('Pod: pod-1')).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'pods-sidebar' })).not.toBeInTheDocument();
  });

  test('renders sidebar and pod tabs when there are multiple pods', () => {
    render(
      <ExecutionLog
        containerId="c1"
        route={ApplicationRoute.McpContainers}
        pods={[makePod('pod-1'), makePod('pod-2', { restartCount: 3 })]}
      />,
    );

    expect(screen.getByRole('complementary', { name: 'pods-sidebar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(ContainersI18nKey.Pods);
    expect(screen.getByRole('button', { name: /Containers.Pod 1/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Containers.Pod 2/i })).toBeInTheDocument();
    expect(screen.getByText(`${EntityFieldsI18nKey.Restarts}:`)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('switches active pod when a different tab is clicked', () => {
    render(
      <ExecutionLog
        containerId="c1"
        route={ApplicationRoute.McpContainers}
        pods={[makePod('pod-1'), makePod('pod-2')]}
      />,
    );

    expect(screen.getByText('Pod: pod-1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Containers.Pod 2/i }));

    expect(screen.getByText('Pod: pod-2')).toBeInTheDocument();
  });

  test('falls back to first pod when active tab id does not match pod name', () => {
    render(
      <ExecutionLog containerId="c1" route={ApplicationRoute.McpContainers} pods={[makePod(''), makePod('pod-2')]} />,
    );

    expect(screen.getByText('Pod: empty-name')).toBeInTheDocument();
  });
});
