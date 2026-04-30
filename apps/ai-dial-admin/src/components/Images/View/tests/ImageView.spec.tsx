import { TabModel } from '@epam/ai-dial-ui-kit';
import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { Image, ImageVersion } from '@/src/models/deployments/images';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TYPE } from '@/src/types/deployments/images';
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

vi.mock('@/src/components/Images/View/TabsContent', () => ({
  __esModule: true,
  default: (props: { setHasBlockedDomains: (value: boolean) => void }) => {
    tabsContentProps.push(props);
    return <div data-role="tabs-content" />;
  },
}));

vi.mock('@/src/components/EntityHeaderControls/ImagesHeader', () => ({
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
  getImage: vi.fn(),
  updateImage: vi.fn(),
}));

import ImageView from '@/src/components/Images/View/ImageView';

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

const makeVersion = (id: string, version: string): ImageVersion => ({
  id,
  version,
  name: 'My image',
  status: IMAGE_STATUS.BUILT,
});

const findTab = (tabs: TabModel[], id: EntityViewTab) => tabs.find((tab) => tab.id === id);
const lastTabs = () => headerProps[headerProps.length - 1].tabs;
const lastSetter = () => tabsContentProps[tabsContentProps.length - 1].setHasBlockedDomains;

describe('ImageView — installation log tab error indicator', () => {
  beforeEach(() => {
    tabsContentProps.length = 0;
    headerProps.length = 0;
  });

  test('does not mark InstallationLog invalid initially', () => {
    render(<ImageView image={makeImage()} versions={[makeVersion('img-1', '1.0.0')]} />);
    expect(findTab(lastTabs(), EntityViewTab.InstallationLog)?.invalid).toBe(false);
  });

  test('flips InstallationLog invalid when setHasBlockedDomains(true) is called', () => {
    render(<ImageView image={makeImage()} versions={[]} />);
    act(() => lastSetter()(true));
    expect(findTab(lastTabs(), EntityViewTab.InstallationLog)?.invalid).toBe(true);
  });

  test('clears InstallationLog invalid when setHasBlockedDomains(false) is called', () => {
    render(<ImageView image={makeImage()} versions={[]} />);
    act(() => lastSetter()(true));
    expect(findTab(lastTabs(), EntityViewTab.InstallationLog)?.invalid).toBe(true);
    act(() => lastSetter()(false));
    expect(findTab(lastTabs(), EntityViewTab.InstallationLog)?.invalid).toBe(false);
  });
});
