import { describe, test, expect } from 'vitest';
import { generateMethodPathCombinations } from '../method';
import { DialRoute } from '@/src/models/dial/route';

describe('generateMethodPathCombinations', () => {
  test('should generate all combinations of methods and paths from a single route', () => {
    const input: Record<string, DialRoute> = {
      route1: {
        methods: ['HEAD', 'POST', 'GET'],
        paths: ['/e', '/r'],
      },
    };

    const result = generateMethodPathCombinations(input);

    expect(generateMethodPathCombinations()).toEqual([]);
    expect(result).toEqual([
      { method: 'HEAD', relativeUrl: '/e' },
      { method: 'POST', relativeUrl: '/e' },
      { method: 'GET', relativeUrl: '/e' },
      { method: 'HEAD', relativeUrl: '/r' },
      { method: 'POST', relativeUrl: '/r' },
      { method: 'GET', relativeUrl: '/r' },
    ]);
  });

  test('should handle multiple routes and combine all combinations', () => {
    const input: Record<string, DialRoute> = {
      route1: {
        methods: ['GET'],
        paths: ['/api'],
      },
      route2: {
        methods: ['POST'],
        paths: ['/data'],
      },
    };

    const result = generateMethodPathCombinations(input);

    expect(result).toEqual([
      { method: 'GET', relativeUrl: '/api' },
      { method: 'POST', relativeUrl: '/data' },
    ]);
  });

  test('should skip routes with empty methods', () => {
    const input: Record<string, DialRoute> = {
      route1: {
        methods: [],
        paths: ['/e', '/r'],
      },
      route2: {
        methods: ['GET'],
        paths: ['/api'],
      },
    };

    const result = generateMethodPathCombinations(input);

    expect(result).toEqual([{ method: 'GET', relativeUrl: '/api' }]);
  });

  test('should skip routes with empty paths', () => {
    const input: Record<string, DialRoute> = {
      route1: {
        methods: ['GET', 'POST'],
        paths: [],
      },
      route2: {
        methods: ['DELETE'],
        paths: ['/user'],
      },
    };

    const result = generateMethodPathCombinations(input);

    expect(result).toEqual([{ method: 'DELETE', relativeUrl: '/user' }]);
  });

  test('should return empty array when all routes have empty methods or paths', () => {
    const input: Record<string, DialRoute> = {
      route1: {
        methods: [],
        paths: ['/e'],
      },
      route2: {
        methods: ['GET'],
        paths: [],
      },
    };

    const result = generateMethodPathCombinations(input);

    expect(result).toEqual([]);
  });

  test('should return empty array for empty input object', () => {
    const input: Record<string, DialRoute> = {};

    const result = generateMethodPathCombinations(input);

    expect(result).toEqual([]);
  });

  test('should handle multiple routes with multiple methods and paths', () => {
    const input: Record<string, DialRoute> = {
      users: {
        methods: ['GET', 'POST'],
        paths: ['/users', '/profiles'],
      },
      posts: {
        methods: ['PUT', 'DELETE'],
        paths: ['/posts'],
      },
    };

    const result = generateMethodPathCombinations(input);

    expect(result).toHaveLength(6); // (2 methods * 2 paths) + (2 methods * 1 path)
    expect(result).toContainEqual({ method: 'GET', relativeUrl: '/users' });
    expect(result).toContainEqual({ method: 'POST', relativeUrl: '/profiles' });
    expect(result).toContainEqual({ method: 'PUT', relativeUrl: '/posts' });
    expect(result).toContainEqual({ method: 'DELETE', relativeUrl: '/posts' });
  });

  test('should handle routes with missing methods property', () => {
    const input: Record<string, DialRoute> = {
      route1: {
        paths: ['/e'],
      } as DialRoute,
    };

    const result = generateMethodPathCombinations(input);

    expect(result).toEqual([]);
  });

  test('should handle routes with missing paths property', () => {
    const input: Record<string, DialRoute> = {
      route1: {
        methods: ['GET'],
      } as DialRoute,
    };

    const result = generateMethodPathCombinations(input);

    expect(result).toEqual([]);
  });
});
