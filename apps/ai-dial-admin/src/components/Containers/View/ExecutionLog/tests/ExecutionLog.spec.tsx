import { describe, expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ApplicationRoute } from '@/src/types/routes';

import ExecutionLog from '../ExecutionLog';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialCollapsibleSidebar: ({ children, title }: any) => (
    <div role="complementary" aria-label={title}>
      {children}
    </div>
  ),
  DialTabs: ({ tabs, activeTab, onClick }: any) => (
    <div role="tablist">
      {tabs.map((tab: any) => (
        <button key={tab.id} role="tab" aria-selected={tab.id === activeTab} onClick={() => onClick(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  ),
  TabOrientation: { Vertical: 'vertical' },
}));

vi.mock('@/src/components/Containers/View/ExecutionLog/PodView', () => ({
  __esModule: true,
  default: ({ pod, containerId }: any) => (
    <div data-testid="pod-view" data-pod-name={pod?.name} data-container-id={containerId} />
  ),
}));

describe('ExecutionLog', () => {
  test('renders nothing when pods list is empty', () => {
    const { container } = render(<ExecutionLog containerId="c1" pods={[]} route={ApplicationRoute.McpContainers} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
