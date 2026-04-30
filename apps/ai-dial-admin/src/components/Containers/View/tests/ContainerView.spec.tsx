import { TabModel } from '@epam/ai-dial-ui-kit';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';

const { stableT } = vi.hoisted(() => ({
  stableT: (key: string) => key,
}));

vi.mock('@/src/locales/client', () => ({
  useI18n: () => stableT,
  useCurrentLocale: () => 'en',
}));

const tabsContentProps: Array<{ setHasBlockedDomains: (value: boolean) => void }> = [];
const headerProps: Array<{ tabs: TabModel[]; isChanged: boolean }> = [];

class MockEventSource {
  constructor(public url: string) {}
  static instances: MockEventSource[] = [];
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  close = vi.fn();
}

vi.stubGlobal('EventSource', MockEventSource);

vi.mock('@/src/components/Containers/View/TabsContent', () => ({
  __esModule: true,
  default: (props: { setHasBlockedDomains: (value: boolean) => void }) => {
    tabsContentProps.push(props);
    return <div data-role="tabs-content" />;
  },
}));

vi.mock('@/src/components/EntityHeaderControls/ContainersHeader', () => ({
  __esModule: true,
  default: (props: { tabs: TabModel[]; isChanged: boolean }) => {
    headerProps.push(props);
    return <div data-role="header" />;
  },
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  __esModule: true,
  default: () => <div />,
}));

vi.mock('@/src/app/actions/deployments', () => ({
  getContainer: vi.fn(),
  getContainerPods: vi.fn().mockResolvedValue([]),
  updateContainer: vi.fn(),
}));

import ContainerView from '@/src/components/Containers/View/ContainerView';

const makeContainer = (overrides: Partial<Container> = {}): Container => ({
  $type: CONTAINER_TYPE.MCP,
  name: 'my-container',
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE },
  status: CONTAINER_STATUS.STOPPED,
  metadata: {},
  allowedDomains: [],
  ...overrides,
});

const findTab = (tabs: TabModel[], id: EntityViewTab) => tabs.find((tab) => tab.id === id);
const lastTabs = () => headerProps[headerProps.length - 1].tabs;
const lastSetter = () => tabsContentProps[tabsContentProps.length - 1].setHasBlockedDomains;

describe('ContainerView — execution log tab error indicator', () => {
  beforeEach(() => {
    tabsContentProps.length = 0;
    headerProps.length = 0;
    MockEventSource.instances = [];
  });

  test('does not mark ExecutionLog invalid initially', () => {
    render(<ContainerView container={makeContainer()} route={ApplicationRoute.ModelServings} names={[]} />);
    expect(findTab(lastTabs(), EntityViewTab.ExecutionLog)?.invalid).toBe(false);
  });

  test('flips ExecutionLog invalid when setHasBlockedDomains(true) is called for regular containers', () => {
    render(<ContainerView container={makeContainer()} route={ApplicationRoute.ModelServings} names={[]} />);
    act(() => lastSetter()(true));
    expect(findTab(lastTabs(), EntityViewTab.ExecutionLog)?.invalid).toBe(true);
  });

  test('flips ExecutionLog invalid when setHasBlockedDomains(true) is called for MCP containers', () => {
    render(<ContainerView container={makeContainer()} route={ApplicationRoute.McpContainers} names={[]} />);
    act(() => lastSetter()(true));
    expect(findTab(lastTabs(), EntityViewTab.ExecutionLog)?.invalid).toBe(true);
  });

  test('clears ExecutionLog invalid when setHasBlockedDomains(false) is called', () => {
    render(<ContainerView container={makeContainer()} route={ApplicationRoute.ModelServings} names={[]} />);
    act(() => lastSetter()(true));
    expect(findTab(lastTabs(), EntityViewTab.ExecutionLog)?.invalid).toBe(true);
    act(() => lastSetter()(false));
    expect(findTab(lastTabs(), EntityViewTab.ExecutionLog)?.invalid).toBe(false);
  });

  test('does not affect Events tab when only ExecutionLog flag changes', () => {
    render(<ContainerView container={makeContainer()} route={ApplicationRoute.ModelServings} names={[]} />);
    act(() => lastSetter()(true));
    expect(findTab(lastTabs(), EntityViewTab.Events)?.invalid).toBe(false);
  });
});
