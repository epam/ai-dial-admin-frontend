import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateRunner } from '@/src/app/[lang]/assets-app-runners/actions';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import AppRunnerAssetView from '../View';

vi.mock('@/src/app/[lang]/assets-app-runners/actions', () => ({
  updateRunner: vi.fn().mockResolvedValue({ success: true }),
  removeRunner: vi.fn(),
  getResolvedRunnerSchema: vi.fn().mockResolvedValue({ success: false }),
  getRunners: vi.fn().mockResolvedValue([]),
}));

// Always-enabled save so validation is the only thing that can stop the request — the real header
// also disables on `isChanged`, which would otherwise mask whether validation ran at all.
vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ onSave }: any) => (
    <button type="button" onClick={onSave}>
      save
    </button>
  ),
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const runner = (overrides: Partial<DialAppRunnerResource> = {}): DialAppRunnerResource =>
  ({
    $id: 'https://host/runner',
    'dial:applicationTypeDisplayName': 'Runner',
    name: 'https%3A%2F%2Fhost%2Frunner',
    path: 'https%3A%2F%2Fhost%2Frunner',
    folderId: '',
    ...overrides,
  }) as DialAppRunnerResource;

const clickSave = async (entity: DialAppRunnerResource) => {
  const user = userEvent.setup();
  render(<AppRunnerAssetView etag="etag" originalRunner={entity} roles={[]} interceptors={[]} />);
  await user.click(screen.getByRole('button', { name: 'save' }));
};

describe('AppRunnerAssetView :: save validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Should send a valid runner to Core with its etag', async () => {
    await clickSave(runner());

    expect(updateRunner).toHaveBeenCalledWith(expect.objectContaining({ $id: 'https://host/runner' }), 'etag');
  });

  test('Should send a runner whose routes are valid', async () => {
    await clickSave(
      runner({
        'dial:applicationTypeRoutes': [
          { name: 'my_route', paths: ['/a'], methods: ['GET'], upstreams: [{ endpoint: 'http://svc' }] },
        ],
      }),
    );

    expect(updateRunner).toHaveBeenCalled();
  });

  test('Should block save when the display name is missing', async () => {
    await clickSave(runner({ 'dial:applicationTypeDisplayName': '' }));

    expect(updateRunner).not.toHaveBeenCalled();
  });

  test('Should block save when the id contains a character Core cannot store', async () => {
    await clickSave(runner({ $id: "https://host/it's" }));

    expect(updateRunner).not.toHaveBeenCalled();
  });

  test.each([
    ['an invalid route name', { name: 'bad-route', paths: ['/a'], methods: ['GET'], upstreams: [{ endpoint: 'u' }] }],
    ['no methods', { name: 'my_route', paths: ['/a'], methods: [], upstreams: [{ endpoint: 'u' }] }],
    ['no paths', { name: 'my_route', paths: [], methods: ['GET'], upstreams: [{ endpoint: 'u' }] }],
    ['an unsupported method', { name: 'my_route', paths: ['/a'], methods: ['TRACE'], upstreams: [{ endpoint: 'u' }] }],
    ['an upstream without an endpoint', { name: 'my_route', paths: ['/a'], methods: ['GET'], upstreams: [{}] }],
  ])('Should block save when a route has %s', async (_label, route) => {
    await clickSave(runner({ 'dial:applicationTypeRoutes': [route as never] }));

    expect(updateRunner).not.toHaveBeenCalled();
  });

  test('Should block save on duplicate route names', async () => {
    const route = { name: 'my_route', paths: ['/a'], methods: ['GET'], upstreams: [{ endpoint: 'u' }] };
    await clickSave(runner({ 'dial:applicationTypeRoutes': [route, { ...route }] as never }));

    expect(updateRunner).not.toHaveBeenCalled();
  });
});
