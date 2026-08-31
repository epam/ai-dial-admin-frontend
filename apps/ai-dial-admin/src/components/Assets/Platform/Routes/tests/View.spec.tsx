import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateRoute } from '@/src/app/[lang]/platform-routes/actions';
import { DialRouteResource } from '@/src/models/dial/resource';
import RouteAssetView from '../View';

vi.mock('@/src/app/[lang]/platform-routes/actions', () => ({
  updateRoute: vi.fn().mockResolvedValue({ success: true }),
  removeRoute: vi.fn(),
  getRoutes: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ onSave }: any) => (
    <button type="button" onClick={onSave}>
      save
    </button>
  ),
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const route = (overrides: Partial<DialRouteResource> = {}): DialRouteResource =>
  ({
    name: 'my-route',
    path: 'my-route',
    folderId: '',
    paths: ['/api'],
    ...overrides,
  }) as DialRouteResource;

const clickSave = async (entity: DialRouteResource) => {
  const user = userEvent.setup();
  render(<RouteAssetView etag="etag" originalRoute={entity} roles={[]} />);
  await user.click(screen.getByRole('button', { name: 'save' }));
};

describe('RouteAssetView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Should send the route to Core with its etag on save', async () => {
    await clickSave(route());

    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ name: 'my-route' }), 'etag');
  });

  test('Should render the tabs content', () => {
    render(<RouteAssetView etag="etag" originalRoute={route()} roles={[]} />);

    expect(screen.getByText('tabs-content')).toBeInTheDocument();
  });
});
