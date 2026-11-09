import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DialRouterResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import RouterView from '../View';

vi.mock('@/src/app/[lang]/platform-routers/actions', () => ({
  updateRouter: vi.fn(),
  removeRouter: vi.fn(),
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

let capturedHeader: any;
vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: (props: any) => {
    capturedHeader = props;
    return <div>header</div>;
  },
}));

const setEntityReadOnly = vi.fn();
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    featureFlags: { dashboardEnabled: true, adminApiEnabled: true },
    setEntityReadOnly,
  }),
}));

const router = { name: 'cost-aware' } as DialRouterResource;
const tabIds = () => capturedHeader.tabs.map((tab: { id: string }) => tab.id);

describe('RouterView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
