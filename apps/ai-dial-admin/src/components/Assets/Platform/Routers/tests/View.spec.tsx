import { appContextMock } from '@/test-mocks/app-context';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateRouter } from '@/src/app/[lang]/platform-routers/actions';
import { DialRouterResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import RouterView from '../View';

vi.mock('@/src/app/[lang]/platform-routers/actions', () => ({
  updateRouter: vi.fn(),
  removeRouter: vi.fn(),
}));

let capturedTabs: any;
vi.mock('../TabsContent', () => ({
  default: (props: any) => {
    capturedTabs = props;
    return <div>tabs-content</div>;
  },
}));

let capturedHeader: any;
vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: (props: any) => {
    capturedHeader = props;
    return <div>header</div>;
  },
}));

const setEntityReadOnly = vi.fn();
let isReadOnlyAdmin = false;
beforeEach(() => {
  appContextMock.use(() => ({
    featureFlags: { dashboardEnabled: true, adminApiEnabled: true },
    isReadOnlyAdmin,
    visualizerConnector: undefined,
    setEntityReadOnly,
  }));
});

const router = { name: 'cost-aware' } as DialRouterResource;
const tabIds = () => capturedHeader.tabs.map((tab: { id: string }) => tab.id);

describe('RouterView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isReadOnlyAdmin = false;
  });

  test('renders the header and the tab content', () => {
    render(<RouterView etag="etag" originalRouter={router} roles={[]} />);

    expect(screen.getByText('header')).toBeTruthy();
    expect(screen.getByText('tabs-content')).toBeTruthy();
  });

  test('marks the entity read-only on mount when config-file-sourced, and clears it on unmount', () => {
    const { unmount } = render(<RouterView etag="etag" originalRouter={router} roles={[]} isConfigFileSource />);

    expect(setEntityReadOnly).toHaveBeenCalledWith(true);

    unmount();

    expect(setEntityReadOnly).toHaveBeenLastCalledWith(false);
  });

  test('hides the ADMIN|CORE format selector only for a config-file-sourced router', () => {
    const { unmount } = render(<RouterView etag="etag" originalRouter={router} roles={[]} isConfigFileSource />);
    expect(capturedHeader.jsonConfiguration.onHideFormatSelector()).toBe(true);
    unmount();

    render(<RouterView etag="etag" originalRouter={router} roles={[]} />);
    expect(capturedHeader.jsonConfiguration.onHideFormatSelector()).toBe(false);
  });

  test('offers no Parameters, Interceptors or Audit tab for a router without a schema', () => {
    render(<RouterView etag="etag" originalRouter={router} roles={[]} />);

    expect(tabIds()).toEqual([
      EntityViewTab.Properties,
      EntityViewTab.Features,
      EntityViewTab.Catalog,
      EntityViewTab.Roles,
    ]);
  });

  test('offers the Parameters tab after Features when the router has a schema', () => {
    render(
      <RouterView
        etag="etag"
        originalRouter={{ ...router, applicationTypeSchemaId: 'https://dial.test/router-type' }}
        roles={[]}
      />,
    );

    expect(tabIds()).toEqual([
      EntityViewTab.Properties,
      EntityViewTab.Features,
      EntityViewTab.Parameters,
      EntityViewTab.Catalog,
      EntityViewTab.Roles,
    ]);
  });

  const parametersTabs = [
    EntityViewTab.Properties,
    EntityViewTab.Features,
    EntityViewTab.Parameters,
    EntityViewTab.Catalog,
    EntityViewTab.Roles,
  ];
  const editorRouter = { ...router, editorUrl: 'http://router-ui.test' };

  test('offers the Parameters tab when the router has an editor URL and no schema', () => {
    render(<RouterView etag="etag" originalRouter={editorRouter} roles={[]} />);

    expect(tabIds()).toEqual(parametersTabs);
  });

  test('offers the Parameters tab once for a router with both a schema and an editor URL', () => {
    render(
      <RouterView
        etag="etag"
        originalRouter={{ ...editorRouter, applicationTypeSchemaId: 'https://dial.test/router-type' }}
        roles={[]}
      />,
    );

    expect(tabIds()).toEqual(parametersTabs);
  });

  test('offers no Parameters tab to a read-only admin for a router with only an editor URL', () => {
    isReadOnlyAdmin = true;
    render(<RouterView etag="etag" originalRouter={editorRouter} roles={[]} />);

    expect(tabIds()).not.toContain(EntityViewTab.Parameters);
  });

  test('clearing the editor URL removes the Parameters tab and returns to Properties', () => {
    render(<RouterView etag="etag" originalRouter={editorRouter} roles={[]} />);
    act(() => capturedHeader.onChangeActiveTab(EntityViewTab.Parameters));
    expect(capturedHeader.activeTab).toBe(EntityViewTab.Parameters);

    act(() => capturedTabs.onChange({ ...editorRouter, editorUrl: undefined }));

    expect(tabIds()).not.toContain(EntityViewTab.Parameters);
    expect(capturedHeader.activeTab).toBe(EntityViewTab.Properties);
  });

  test('routes the header save to the iframe while it reports unsaved changes', () => {
    const triggerSave = vi.fn();
    render(<RouterView etag="etag" originalRouter={editorRouter} roles={[]} />);
    capturedTabs.frameRef.current = { triggerSave, reset: vi.fn() };

    act(() => capturedTabs.frameCallbacks.onDirtyChange(true));
    expect(capturedHeader.isChanged).toBe(true);

    act(() => capturedHeader.onSave());

    expect(triggerSave).toHaveBeenCalledOnce();
    expect(updateRouter).not.toHaveBeenCalled();
  });
});
