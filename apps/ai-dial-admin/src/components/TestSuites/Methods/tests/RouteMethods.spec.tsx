import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import RouteMethods from '@/src/components/TestSuites/Methods/RouteMethods';

const getRouteMock = vi.fn();

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getRoute: (...args: unknown[]) => getRouteMock(...args),
}));

vi.mock('@/src/components/TestSuites/Methods/Methods', () => ({
  default: ({ selectedRoute }: { selectedRoute: { name: string } }) => (
    <div role="region" aria-label="route-methods">
      {selectedRoute.name}
    </div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialLoader: () => <div role="status">loading</div>,
    DialNoDataContent: ({ title }: { title: string }) => <div>{title}</div>,
  };
});

describe('RouteMethods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loads the selected route and renders its methods', async () => {
    getRouteMock.mockResolvedValue({ name: 'search-route', methods: ['GET'], paths: ['/search'] });

    render(<RouteMethods routeName="search-route" testSuite={{}} onChange={vi.fn()} />);

    expect((await screen.findByRole('region', { name: 'route-methods' })).textContent).toContain('search-route');
    expect(getRouteMock).toHaveBeenCalledWith('search-route');
  });

  test('renders the empty state when Core does not return the route', async () => {
    getRouteMock.mockResolvedValue(null);

    render(<RouteMethods routeName="missing-route" testSuite={{}} onChange={vi.fn()} />);

    expect(await screen.findByText('Entities.NoRoutes')).toBeTruthy();
  });

  test('shows a loader while the selected route is being loaded', async () => {
    let resolveRoute: (route: { name: string; methods: string[]; paths: string[] }) => void = () => undefined;
    getRouteMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRoute = resolve;
      }),
    );

    render(<RouteMethods routeName="search-route" testSuite={{}} onChange={vi.fn()} />);

    expect(screen.getByRole('status')).toBeTruthy();

    await act(async () => resolveRoute({ name: 'search-route', methods: ['GET'], paths: ['/search'] }));

    expect(await screen.findByRole('region', { name: 'route-methods' })).toBeTruthy();
  });

  test('renders the empty state when loading the selected route fails', async () => {
    getRouteMock.mockRejectedValue(new Error('route read failed'));

    render(<RouteMethods routeName="search-route" testSuite={{}} onChange={vi.fn()} />);

    expect(await screen.findByText('Entities.NoRoutes')).toBeTruthy();
  });
});
