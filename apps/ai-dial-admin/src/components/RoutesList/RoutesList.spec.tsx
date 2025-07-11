import { DialRoute } from '@/src/models/dial/route';
import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import RouteProperties from './RouteProperties';
import RoutesList from './RoutesList';
import { describe, expect, test, vi } from 'vitest';

describe('Routes :: RoutesList', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<RoutesList data={[{ name: 'route' }, {}]} />);

    expect(baseElement).toBeTruthy();
  });
});

describe('Routes :: RouteProperties', () => {
  test('Should render successfully with response', () => {
    const route = { description: 'description', name: 'name', response: { status: 200, body: 'str' } };

    const { baseElement } = render(<RouteProperties route={route} updateRoute={vi.fn()} />);

    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully', () => {
    let route = { description: 'description', name: 'name' } as DialRoute;

    const updateRoute = (r: DialRoute) => {
      route = r;
    };
    const { baseElement, getByTestId } = render(<RouteProperties route={route} updateRoute={updateRoute} />);

    expect(baseElement).toBeTruthy();

    const descriptionControl = getByTestId('description');
    expect(route.description).toBe('description');
    fireEvent.change(descriptionControl, { target: { value: 'New description' } });
    expect(route.description).toBe('New description');
  });
});
