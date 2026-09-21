import { DialFileNodeType } from '@/src/models/dial/file';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { generateFolderListFromBulkPaths, getResourceTypeByView } from '../utils';

describe('generateFolderListFromBulkPaths', () => {
  test('should return an empty array when given no paths', () => {
    const result = generateFolderListFromBulkPaths([]);
    expect(result).toEqual([]);
  });

  test('should generate a single-level folder structure', () => {
    const paths = ['public/'];
    const result = generateFolderListFromBulkPaths(paths);

    expect(result).toEqual([
      {
        name: 'public',
        path: 'public/',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
      },
    ]);
  });

  test('should generate a nested folder structure for deep paths', () => {
    const paths = ['public/child/grand/'];
    const result = generateFolderListFromBulkPaths(paths);

    expect(result).toEqual([
      {
        name: 'public',
        path: 'public/',
        nodeType: DialFileNodeType.FOLDER,
        items: [
          {
            name: 'child',
            path: 'public/child/',
            nodeType: DialFileNodeType.FOLDER,
            items: [
              {
                name: 'grand',
                path: 'public/child/grand/',
                nodeType: DialFileNodeType.FOLDER,
                items: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  test('should merge overlapping paths into shared folders', () => {
    const paths = ['public/child/grand/', 'public/child/other/'];
    const result = generateFolderListFromBulkPaths(paths);

    expect(result).toEqual([
      {
        name: 'public',
        path: 'public/',
        nodeType: DialFileNodeType.FOLDER,
        items: [
          {
            name: 'child',
            path: 'public/child/',
            nodeType: DialFileNodeType.FOLDER,
            items: [
              {
                name: 'grand',
                path: 'public/child/grand/',
                nodeType: DialFileNodeType.FOLDER,
                items: [],
              },
              {
                name: 'other',
                path: 'public/child/other/',
                nodeType: DialFileNodeType.FOLDER,
                items: [],
              },
            ],
          },
        ],
      },
    ]);
  });

  test('should handle sibling root folders correctly', () => {
    const paths = ['public/', 'assets/', 'content/posts/'];
    const result = generateFolderListFromBulkPaths(paths);

    expect(result).toEqual([
      {
        name: 'public',
        path: 'public/',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
      },
      {
        name: 'assets',
        path: 'assets/',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
      },
      {
        name: 'content',
        path: 'content/',
        nodeType: DialFileNodeType.FOLDER,
        items: [
          {
            name: 'posts',
            path: 'content/posts/',
            nodeType: DialFileNodeType.FOLDER,
            items: [],
          },
        ],
      },
    ]);
  });
});

describe('getResourceTypeByView', () => {
  test('should return ResourceType.PROMPT when route is Prompts', () => {
    const result = getResourceTypeByView(ApplicationRoute.Prompts);
    expect(result).toBe(ResourceType.PROMPT);
  });

  test('should return ResourceType.FILE when route is Files', () => {
    const result = getResourceTypeByView(ApplicationRoute.Files);
    expect(result).toBe(ResourceType.FILE);
  });

  test('should return ResourceType.APPLICATION when route is AssetsApplications', () => {
    const result = getResourceTypeByView(ApplicationRoute.AssetsApplications);
    expect(result).toBe(ResourceType.APPLICATION);
  });

  test('should return ResourceType.APPLICATION when route is AssetsToolsets', () => {
    const result = getResourceTypeByView(ApplicationRoute.AssetsToolsets);
    expect(result).toBe(ResourceType.TOOLSET);
  });

  test('should return an empty string when route is undefined or not matching any of the routes', () => {
    const resultWithUndefinedRoute = getResourceTypeByView();
    const resultWithUnknownRoute = getResourceTypeByView('SomeOtherRoute' as ApplicationRoute);

    expect(resultWithUndefinedRoute).toBe('');
    expect(resultWithUnknownRoute).toBe('');
  });
});
