import { handleRouteOutputChange, removeEmptyValues } from './routes';
import { RouteOutput } from '@/src/models/dial/route';

describe('Routes :: removeEmptyValues', () => {
  it('Should return same route', () => {
    const route = {
      paths: ['path1', 'path2'],
    };
    const newRoute = removeEmptyValues(route);
    expect(newRoute).toEqual({
      paths: ['path1', 'path2'],
    });
  });

  it('Should return route without empty path', () => {
    const route = {
      paths: ['path1', ''],
    };
    const newRoute = removeEmptyValues(route);
    expect(newRoute).toEqual({
      paths: ['path1'],
    });
  });

  it('Should return same route', () => {
    const route = {
      upstreams: [{ endpoint: 'path1' }, { endpoint: 'path2' }],
    };
    const newRoute = removeEmptyValues(route);
    expect(newRoute).toEqual({
      upstreams: [{ endpoint: 'path1' }, { endpoint: 'path2' }],
    });
  });

  it('Should return route without empty endpoint', () => {
    const route = {
      upstreams: [{ endpoint: 'path1' }, { endpoint: '' }],
    };
    const newRoute = removeEmptyValues(route);
    expect(newRoute).toEqual({
      upstreams: [{ endpoint: 'path1' }],
    });
  });
});

describe('Routes :: handleRouteOutputChange', () => {
  it('Should return route without response', () => {
    const route = {
      upstreams: [{ endpoint: 'path1' }, { endpoint: '' }],
      response: { body: 'body', key: 'key' },
    };
    const newRoute = handleRouteOutputChange(route, RouteOutput.RESPONSE);
    expect(newRoute).toEqual({
      upstreams: void 0,
      response: { body: '', key: void 0 },
    });
  });

  it('Should return route without upstreams', () => {
    const route = {
      upstreams: [{ endpoint: 'path1' }, { endpoint: '' }],
      response: { body: 'body', key: 'key' },
    };
    const newRoute = handleRouteOutputChange(route, RouteOutput.UPSTREAMS);
    expect(newRoute).toEqual({
      upstreams: [
        {
          endpoint: '',
          key: void 0,
        },
      ],
      response: void 0,
    });
  });
});
