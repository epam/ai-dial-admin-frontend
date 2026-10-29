import { describe, expect, test, vi } from 'vitest';

import { ResourceIssue, PublicationStatus } from '@/src/models/dial/publications';
import { EnrichmentClients } from '@/src/server/publications/resolver/types';
import { CorePublicationResource, CoreResourceAction } from '@/src/server/publications/models';
import { enrichProjectResource } from '../project-resource';

const resource = (overrides: Partial<CorePublicationResource> = {}): CorePublicationResource => ({
  action: CoreResourceAction.ADD,
  sourceUrl: 'projects/src/my-project',
  reviewUrl: 'projects/review/my-project',
  targetUrl: 'projects/public/my-project',
  ...overrides,
});

const makeClients = (getProjectMetadata: EnrichmentClients['getProjectMetadata']): EnrichmentClients => ({
  getAsset: vi.fn(),
  updateAsset: vi.fn(),
  getBucket: vi.fn(),
  getFileMetadata: vi.fn(),
  uploadFile: vi.fn(),
  getSkillMetadata: vi.fn(),
  getProjectMetadata,
});

describe('Server :: Publications :: enrichProjectResource', () => {
  test('enriches a pending project resource from its review-url metadata', async () => {
    // target (public/...) does not exist; the review copy resolves to the project's metadata
    const getProjectMetadata = vi.fn().mockImplementation((_t, path: string) =>
      path.startsWith('public')
        ? Promise.resolve(null)
        : Promise.resolve({
            name: 'My Project',
            description: 'Does a thing',
            version: '1',
            path: 'review/my-project',
            etag: 'abc',
            files: [{ name: 'PROJECT.md', size: 42 }],
          }),
    );
    const clients = makeClients(getProjectMetadata);
    const issues: never[] = [];

    const result = await enrichProjectResource(resource(), PublicationStatus.PENDING, {} as never, clients, issues);

    expect(result?.projectResource.name).toBe('My Project');
    expect(result?.projectResource.files).toEqual([{ name: 'PROJECT.md', size: 42 }]);
    expect(issues).toEqual([]);
  });

  test('records a not-found issue when the project metadata lookup returns null', async () => {
    const clients = makeClients(vi.fn().mockResolvedValue(null));
    const issues: ResourceIssue[] = [];

    const result = await enrichProjectResource(resource(), PublicationStatus.PENDING, {} as never, clients, issues);

    expect(result).toBeNull();
    expect(issues).toEqual([{ resourceType: 'PROJECT', path: 'review/my-project', message: 'Project not found' }]);
  });

  test('records an already-exists issue when a pending, non-DELETE target already has a project', async () => {
    const clients = makeClients(vi.fn().mockResolvedValue({ name: 'Existing' }));
    const issues: ResourceIssue[] = [];

    const result = await enrichProjectResource(resource(), PublicationStatus.PENDING, {} as never, clients, issues);

    expect(result).toBeNull();
    expect(issues).toEqual([
      { resourceType: 'PROJECT', path: 'projects/public/my-project', message: 'Target project already exists' },
    ]);
  });

  test('skips the already-exists check for a DELETE action (only one lookup call)', async () => {
    const getProjectMetadata = vi.fn().mockResolvedValue({ name: 'My Project', files: [] });
    const clients = makeClients(getProjectMetadata);
    const issues: never[] = [];

    const result = await enrichProjectResource(
      resource({ action: CoreResourceAction.DELETE }),
      PublicationStatus.PENDING,
      {} as never,
      clients,
      issues,
    );

    expect(result?.projectResource.name).toBe('My Project');
    expect(getProjectMetadata).toHaveBeenCalledOnce();
  });
});
