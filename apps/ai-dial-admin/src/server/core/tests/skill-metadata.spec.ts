import { describe, expect, test } from 'vitest';

import { toSkillList } from '../skill-metadata';

describe('Server :: Core :: toSkillList', () => {
  test('returns an empty list when the node has no items', () => {
    expect(toSkillList(null)).toEqual([]);
    expect(toSkillList({ name: 'public', nodeType: 'FOLDER' } as any)).toEqual([]);
  });

  test('splits a nested skill path into folderId and name without touching a version suffix', () => {
    const result = toSkillList({
      name: 'public',
      nodeType: 'FOLDER',
      items: [
        {
          name: 'my-skill__extra',
          url: 'skills/public/nested/my-skill__extra',
          nodeType: 'ITEM',
          author: 'author-1',
          createdAt: 1000,
          updatedAt: 2000,
          etag: 'etag-1',
        },
      ],
    } as any);

    expect(result).toEqual([
      {
        name: 'my-skill__extra',
        folderId: 'public/nested/',
        path: 'public/nested/my-skill__extra',
        author: 'author-1',
        createdAt: '1000',
        updatedAt: '2000',
        nodeType: 'item',
        etag: 'etag-1',
      },
    ]);
  });

  test('a grouping folder child is mapped with nodeType FOLDER lowercased', () => {
    const result = toSkillList({
      name: 'public',
      nodeType: 'FOLDER',
      items: [{ name: 'sub-folder', url: 'skills/public/sub-folder', nodeType: 'FOLDER' }],
    } as any);

    expect(result[0].nodeType).toBe('folder');
  });
});
