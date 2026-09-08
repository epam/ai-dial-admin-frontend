import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { TabModel } from '@epam/ai-dial-ui-kit';

import { AppContextType } from '@/src/context/AppContext';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { FeatureFlags } from '@/src/models/feature-flags';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ModelView from '../View';

interface SimpleHeaderMockProps {
  tabs?: TabModel[];
}

const { useAppContextMock, simpleHeaderSpy } = vi.hoisted(() => ({
  useAppContextMock: vi.fn<() => Pick<AppContextType, 'featureFlags'>>(),
  simpleHeaderSpy: vi.fn<(props: SimpleHeaderMockProps) => void>(),
}));

vi.mock('@/src/context/AppContext', () => ({ useAppContext: useAppContextMock }));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: (props: SimpleHeaderMockProps) => {
    simpleHeaderSpy(props);
    return null;
  },
}));

vi.mock('@/src/context/assets/ModelsFolderContext', () => ({
  useModelsFolder: () => ({ fetchFiles: vi.fn() }),
}));

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  updateModel: vi.fn(),
  removeModel: vi.fn(),
}));

vi.mock('../TabsContent', () => ({ default: () => null }));

const model = { name: 'gpt-4', path: 'gpt-4', folderId: '' } as AssetModel;

const MODEL_TABS = [EntityViewTab.Properties, EntityViewTab.Features, EntityViewTab.Roles, EntityViewTab.Interceptors];

describe('ModelView — Audit tab wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderTabIds = (isDashboardEnabled: boolean): EntityViewTab[] => {
    useAppContextMock.mockReturnValue({ featureFlags: { dashboardEnabled: isDashboardEnabled } as FeatureFlags });
    render(<ModelView etag="etag" originalModel={model} roles={[]} interceptors={[]} />);

    expect(simpleHeaderSpy).toHaveBeenCalled();

    const { tabs } = simpleHeaderSpy.mock.lastCall?.[0] as SimpleHeaderMockProps;
    return (tabs ?? []).map((tab) => tab.id as EntityViewTab);
  };

  test('Should pass the Audit tab to the header, last, when the dashboard feature is enabled', () => {
    expect(renderTabIds(true)).toEqual([...MODEL_TABS, EntityViewTab.Audit]);
  });

  test('Should pass the header the model tabs without Audit when the dashboard feature is disabled', () => {
    expect(renderTabIds(false)).toEqual(MODEL_TABS);
  });
});
