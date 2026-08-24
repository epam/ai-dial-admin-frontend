import { describe, expect, test, vi } from 'vitest';

import { PublicationStatus } from '@/src/models/dial/publications';
import { EnrichmentClients } from '@/src/server/publications/resolver/types';
import { CorePublicationResource, CoreResourceAction } from '@/src/server/publications/models';
import { enrichSkillResource } from '../skill-resource';

const resource = (overrides: Partial<CorePublicationResource> = {}): CorePublicationResource => ({
  action: CoreResourceAction.ADD,
  sourceUrl: 'skills/src/my-skill',
  reviewUrl: 'skills/review/my-skill',
  targetUrl: 'skills/public/my-skill',
  ...overrides,
});

const makeClients = (getSkillMetadata: EnrichmentClients['getSkillMetadata']): EnrichmentClients => ({
  getAsset: vi.fn(),
  updateAsset: vi.fn(),
  getBucket: vi.fn(),
  getFileMetadata: vi.fn(),
  uploadFile: vi.fn(),
  getSkillMetadata,
});

describe('Server :: Publications :: enrichSkillResource', () => {
  test('enriches a pending skill resource from its review-url metadata', async () => {
    // target (public/...) does not exist; the review copy resolves to the skill's metadata
    const getSkillMetadata = vi.fn().mockImplementation((_t, path: string) =>
      path.startsWith('public')
        ? Promise.resolve(null)
        : Promise.resolve({
            name: 'My Skill',
            description: 'Does a thing',
            version: '1',
            path: 'review/my-skill',
            etag: 'abc',
            files: [{ name: 'SKILL.md', size: 42 }],
          }),
    );
    const clients = makeClients(getSkillMetadata);
    const issues: never[] = [];

    const result = await enrichSkillResource(resource(), PublicationStatus.PENDING, {} as never, clients, issues);

    expect(result?.skillResource.name).toBe('My Skill');
    expect(result?.skillResource.files).toEqual([{ name: 'SKILL.md', size: 42 }]);
    expect(issues).toEqual([]);
  });

  test('records a not-found issue when the skill metadata lookup returns null', async () => {
    const clients = makeClients(vi.fn().mockResolvedValue(null));
    const issues: { message: string }[] = [];

    const result = await enrichSkillResource(resource(), PublicationStatus.PENDING, {} as never, clients, issues);

    expect(result).toBeNull();
    expect(issues).toEqual([{ resourceType: 'SKILL', path: 'review/my-skill', message: 'Skill not found' }]);
  });

  test('records an already-exists issue when a pending, non-DELETE target already has a skill', async () => {
    const clients = makeClients(vi.fn().mockResolvedValue({ name: 'Existing' }));
    const issues: { message: string }[] = [];

    const result = await enrichSkillResource(resource(), PublicationStatus.PENDING, {} as never, clients, issues);

    expect(result).toBeNull();
    expect(issues).toEqual([
      { resourceType: 'SKILL', path: 'skills/public/my-skill', message: 'Target skill already exists' },
    ]);
  });

  test('skips the already-exists check for a DELETE action (only one lookup call)', async () => {
    const getSkillMetadata = vi.fn().mockResolvedValue({ name: 'My Skill', files: [] });
    const clients = makeClients(getSkillMetadata);
    const issues: never[] = [];

    const result = await enrichSkillResource(
      resource({ action: CoreResourceAction.DELETE }),
      PublicationStatus.PENDING,
      {} as never,
      clients,
      issues,
    );

    expect(result?.skillResource.name).toBe('My Skill');
    expect(getSkillMetadata).toHaveBeenCalledOnce();
  });
});
