import { DialRoute } from '@/src/models/dial/route';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { fireEvent } from '@testing-library/dom';
import RouteProperties from './RouteProperties';
import RoutesList from './RoutesList';

describe('Routes :: RoutesList', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(<RoutesList data={[{ name: 'route' }, {}]} />);

    expect(baseElement).toBeTruthy();
  });
});

describe('Routes :: RouteProperties', () => {
  it('Should render successfully with response', () => {
    const route = { description: 'description', name: 'name', response: { status: 200, body: 'str' } };

    const { baseElement } = renderWithContext(<RouteProperties route={route} updateRoute={jest.fn()} />);

    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully', () => {
    let route = { description: 'description', name: 'name' } as DialRoute;

    const updateRoute = (r: DialRoute) => {
      route = r;
    };
    const { baseElement, getByTestId } = renderWithContext(<RouteProperties route={route} updateRoute={updateRoute} />);

    expect(baseElement).toBeTruthy();

    const descriptionControl = getByTestId('description');
    expect(route.description).toBe('description');
    fireEvent.change(descriptionControl, { target: { value: 'New description' } });
    expect(route.description).toBe('New description');
  });
});
