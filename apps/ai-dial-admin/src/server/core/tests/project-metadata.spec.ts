import { describe, expect, test } from 'vitest';

import { toProjectList } from '../project-metadata';

describe('Server :: Core :: toProjectList', () => {
  test('returns an empty list when the node has no items', () => {
    expect(toProjectList(null)).toEqual([]);
    expect(toProjectList({ name: 'public', nodeType: 'FOLDER' } as any)).toEqual([]);
  });

  test('splits a nested project path into folderId and name without touching a version suffix', () => {
    const result = toProjectList({
      name: 'public',
      nodeType: 'FOLDER',
      items: [
        {
          name: 'my-project__extra',
          url: 'projects/public/nested/my-project__extra',
          nodeType: 'ITEM',
          author: 'author-1',
          createdAt: 1000,
          updatedAt: 2000,
          etag: 'etag-1',
          bucket: 'public',
        },
      ],
    } as any);

    expect(result).toEqual([
      {
        name: 'my-project__extra',
        folderId: 'public/nested/',
        path: 'public/nested/my-project__extra',
        author: 'author-1',
        createdAt: '1000',
        updatedAt: '2000',
        nodeType: 'item',
        etag: 'etag-1',
        bucket: 'public',
      },
    ]);
  });

  test('a grouping folder child is mapped with nodeType FOLDER lowercased', () => {
    const result = toProjectList({
      name: 'public',
      nodeType: 'FOLDER',
      items: [{ name: 'sub-folder', url: 'projects/public/sub-folder/', nodeType: 'FOLDER' }],
    } as any);

    expect(result[0].nodeType).toBe('folder');
  });

  test('a grouping folder keeps its trailing slash, matching every other asset type’s folder rows', () => {
    // `parsePath` strips a trailing slash unconditionally — correct for a project item (whose marker is
    // stored as a folder-shaped resource and so carries one despite being an `ITEM`), but a genuine
    // folder needs it back: downstream path-matching (e.g. `mergeFiles`, per-path folder fetches)
    // expects a folder's own path to end in `/`, exactly like Prompts'/Toolsets' folder rows do.
    const result = toProjectList({
      name: 'public',
      nodeType: 'FOLDER',
      items: [{ name: 'New folder 1', url: 'projects/public/New%20folder%201/', nodeType: 'FOLDER' }],
    } as any);

    expect(result[0].path).toBe('public/New folder 1/');
  });

  test('a project item has no trailing slash, despite its own marker carrying one', () => {
    const result = toProjectList({
      name: 'public',
      nodeType: 'FOLDER',
      items: [{ name: 'my-project', url: 'projects/public/my-project/', nodeType: 'ITEM' }],
    } as any);

    expect(result[0].path).toBe('public/my-project');
  });
});
