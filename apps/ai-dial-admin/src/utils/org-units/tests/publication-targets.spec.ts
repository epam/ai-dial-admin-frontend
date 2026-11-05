import { describe, expect, test } from 'vitest';

import { ActionType, Publication } from '@/src/models/dial/publications';
import { getPublicationTargetPaths } from '@/src/utils/org-units/publication-targets';

const publication = (overrides: Record<string, unknown> = {}): Publication =>
  ({
    path: 'publications/public/1',
    requestName: 'req',
    author: 'a',
    createdAt: '',
    status: 'PENDING',
    action: ActionType.ADD,
    folderId: 'public/Acme/Risk/',
    ...overrides,
  }) as Publication;

const entity = (targetUrl: string) => ({ sourceUrl: '', targetUrl, reviewUrl: '', action: ActionType.ADD });

describe('getPublicationTargetPaths', () => {
  test('returns the target folder alone when there are no resources', () => {
    expect(getPublicationTargetPaths(publication())).toEqual(['public/Acme/Risk/']);
  });

  test('adds each resource target with the type segment removed', () => {
    const result = getPublicationTargetPaths(
      publication({
        applicationResources: [entity('applications/public/Acme/Risk/app/1.0')],
        files: [entity('files/public/Other/doc.txt')],
        skillResources: [entity('skills/public/Acme/skill')],
      }),
    );

    expect(result).toEqual([
      'public/Acme/Risk/',
      'public/Other/doc.txt',
      'public/Acme/Risk/app/1.0',
      'public/Acme/skill',
    ]);
  });

  test('skips an empty folder id', () => {
    expect(getPublicationTargetPaths(publication({ folderId: '' }))).toEqual([]);
  });
});
