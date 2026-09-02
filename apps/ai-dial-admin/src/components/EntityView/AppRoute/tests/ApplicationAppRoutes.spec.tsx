import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ApplicationAppRoutes from '@/src/components/EntityView/AppRoute/ApplicationAppRoutes';
import { buildAppRunnerOptions } from '@/src/components/SourceField/Application/utils';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialAppRunnerResource, DialApplicationResource } from '@/src/models/dial/resource';
import { DialAppRoute } from '@/src/models/dial/route';
import { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getRunner: vi.fn(),
}));

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialLoader: () => <div role="progressbar" />,
    DialNoDataContent: ({ title, description }: { title?: string; description?: string }) => (
      <div role="status">
        {title}
        {description}
      </div>
    ),
  };
});

let capturedRoutesProps: { routes?: DialAppRoute[]; disabled?: boolean } | null = null;

vi.mock('@/src/components/EntityView/AppRoute/AppRoute', () => ({
  default: (props: { routes?: DialAppRoute[]; disabled?: boolean }) => {
    capturedRoutesProps = props;
    return (
      <ul aria-label="routes">
        {props.routes?.map((route) => (
          <li key={route.name}>{route.name}</li>
        ))}
      </ul>
    );
  },
}));

import { getRunner } from '@/src/app/[lang]/platform-app-runners/actions';

// The App Runner picker stores the selected runner's raw `$id` on `application_type_schema_id`
// (`AppRunners.tsx`'s dropdown value is `r.$id`) — not the encoded `toRunnerReference` form.
const ASSET_REFERENCE = 'http://asdqwe';
const ASSET_PATH = 'http%3A%2F%2Fasdqwe';

const OTHER_ASSET_REFERENCE = 'http://other';
const OTHER_ASSET_PATH = 'http%3A%2F%2Fother';

const entityRunner = {
  $id: 'urn:runner:entity',
  'dial:applicationTypeRoutes': [{ name: 'entity-route' }],
} as unknown as DialApplicationScheme;

const assetRunner = { name: 'http://asdqwe', path: ASSET_PATH, folderId: '' } as ResourceInfo;
const otherAssetRunner = { name: 'http://other', path: OTHER_ASSET_PATH, folderId: '' } as ResourceInfo;

const runners = buildAppRunnerOptions([entityRunner], [assetRunner, otherAssetRunner]);

const appWithRunner = (reference: string) =>
  ({ name: 'app', application_type_schema_id: reference }) as unknown as DialApplication;

const runnerResponse = (routeName: string) => ({
  success: true,
  response: { 'dial:applicationTypeRoutes': [{ name: routeName }] } as DialAppRunnerResource,
});

const renderRoutes = (entity: DialApplication) =>
  render(
    <ApplicationAppRoutes
      view={ApplicationRoute.AssetsApplications}
      applicationRunners={runners}
      selectedEntity={entity}
      onChangeEntity={vi.fn()}
    />,
  );

describe('ApplicationAppRoutes :: routes inherited from an app runner', () => {
  beforeEach(() => {
    capturedRoutesProps = null;
    vi.mocked(getRunner).mockReset();
  });

  test('reads an asset runner’s content and renders its routes', async () => {
    vi.mocked(getRunner).mockResolvedValue(runnerResponse('asset-route'));

    renderRoutes(appWithRunner(ASSET_REFERENCE));

    await waitFor(() => expect(screen.getByText('asset-route')).toBeDefined());
    expect(getRunner).toHaveBeenCalledWith(ASSET_PATH, '*');
    expect(capturedRoutesProps?.disabled).toBe(true);
  });

  test('shows a loader instead of the empty state while the runner is being read', async () => {
    let resolveRunner: (value: unknown) => void = () => void 0;
    vi.mocked(getRunner).mockReturnValue(new Promise((resolve) => (resolveRunner = resolve)) as never);

    renderRoutes(appWithRunner(ASSET_REFERENCE));

    expect(screen.getByRole('progressbar')).toBeDefined();
    expect(screen.queryByRole('list', { name: 'routes' })).toBeNull();

    resolveRunner(runnerResponse('asset-route'));

    await waitFor(() => expect(screen.getByText('asset-route')).toBeDefined());
  });

  test('reports a failed runner read instead of claiming there are no routes', async () => {
    vi.mocked(getRunner).mockResolvedValue({ success: false, errorMessage: 'boom' });

    renderRoutes(appWithRunner(ASSET_REFERENCE));

    await waitFor(() => expect(screen.getByRole('status')).toBeDefined());
    expect(screen.getByRole('status').textContent).toContain('Entities.ResolvedSchemaFailed');
    expect(screen.getByRole('status').textContent).toContain('boom');
    expect(screen.queryByRole('list', { name: 'routes' })).toBeNull();
  });

  test('ignores a stale read once the runner has changed', async () => {
    const deferred: ((value: unknown) => void)[] = [];
    vi.mocked(getRunner).mockImplementation(() => new Promise((resolve) => deferred.push(resolve)) as never);

    const { rerender } = renderRoutes(appWithRunner(ASSET_REFERENCE));
    rerender(
      <ApplicationAppRoutes
        view={ApplicationRoute.AssetsApplications}
        applicationRunners={runners}
        selectedEntity={appWithRunner(OTHER_ASSET_REFERENCE)}
        onChangeEntity={vi.fn()}
      />,
    );

    deferred[1](runnerResponse('other-route'));
    deferred[0](runnerResponse('asset-route'));

    await waitFor(() => expect(screen.getByText('other-route')).toBeDefined());
    expect(screen.queryByText('asset-route')).toBeNull();
  });

  test('uses the embedded routes of an admin-BE runner without reading any resource', async () => {
    renderRoutes(appWithRunner('urn:runner:entity'));

    await waitFor(() => expect(screen.getByText('entity-route')).toBeDefined());
    expect(getRunner).not.toHaveBeenCalled();
  });

  test('keeps rendering an endpoints-based asset app’s own routes', async () => {
    const app = {
      name: 'app',
      routes: { 'own-route': { name: 'own-route' } },
    } as unknown as DialApplicationResource;

    renderRoutes(app as unknown as DialApplication);

    await waitFor(() => expect(screen.getByText('own-route')).toBeDefined());
    expect(getRunner).not.toHaveBeenCalled();
    expect(capturedRoutesProps?.disabled).toBe(false);
  });
});
