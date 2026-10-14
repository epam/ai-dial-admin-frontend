import { render, screen } from '@testing-library/react';
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

describe('RouteMethods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loads the selected route and renders its methods', async () => {
    getRouteMock.mockResolvedValue({ name: 'search-route', methods: ['GET'], paths: ['/search'] });

    render(<RouteMethods routeName="search-route" testSuite={{}} onChange={vi.fn()} />);

    expect(await screen.findByRole('region', { name: 'route-methods' })).toHaveTextContent('search-route');
    expect(getRouteMock).toHaveBeenCalledWith('search-route');
  });

  test('renders the empty state when Core does not return the route', async () => {
    getRouteMock.mockResolvedValue(null);

    render(<RouteMethods routeName="missing-route" testSuite={{}} onChange={vi.fn()} />);

    expect(await screen.findByText('Entities.NoRoutes')).toBeInTheDocument();
  });
});
