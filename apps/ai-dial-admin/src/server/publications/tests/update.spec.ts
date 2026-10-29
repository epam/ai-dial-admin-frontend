import { describe, expect, test } from 'vitest';

import { ActionType } from '@/src/models/dial/publications';
import { buildUpdatePlan } from '../update';

describe('Server :: Publications :: buildUpdatePlan — skill resources', () => {
  test('recalculates a skill resource target URL without queuing an asset PUT', () => {
    const publication = {
      path: 'public/req',
      requestName: 'My skill request',
      folderId: 'public/folder',
      rules: [],
      skillResources: [
        {
          action: ActionType.ADD,
          sourceUrl: 'skills/src/my-skill',
          targetUrl: 'skills/old/my-skill',
          reviewUrl: 'skills/review/my-skill',
          skillResource: { name: 'my-skill', path: 'review/my-skill' },
        },
      ],
    };

    const { dto, resourcePuts } = buildUpdatePlan(publication as never);

    expect(dto.resourceTypes).toEqual(['SKILL']);
    expect(dto.resources[0].targetUrl).toBe('skills/public/folder/my-skill');
    expect(resourcePuts).toEqual([]);
  });
});

describe('Server :: Publications :: buildUpdatePlan — project resources', () => {
  test('recalculates a project resource target URL without queuing an asset PUT', () => {
    const publication = {
      path: 'public/req',
      requestName: 'My project request',
      folderId: 'public/folder',
      rules: [],
      projectResources: [
        {
          action: ActionType.ADD,
          sourceUrl: 'projects/src/my-project',
          targetUrl: 'projects/old/my-project',
          reviewUrl: 'projects/review/my-project',
          projectResource: { name: 'my-project', path: 'review/my-project' },
        },
      ],
    };

    const { dto, resourcePuts } = buildUpdatePlan(publication as never);

    expect(dto.resourceTypes).toEqual(['PROJECT']);
    expect(dto.resources[0].targetUrl).toBe('projects/public/folder/my-project');
    expect(resourcePuts).toEqual([]);
  });
});

describe('Server :: Publications :: buildUpdatePlan — versioned resources', () => {
  const buildPublication = (applicationResource: object) => ({
    path: 'public/req',
    requestName: 'My app request',
    folderId: 'public/folder',
    rules: [],
    applicationResources: [
      {
        action: ActionType.ADD,
        sourceUrl: 'applications/src/my-app__1.0.0',
        targetUrl: 'applications/public/folder/my-app__1.0.0',
        reviewUrl: 'applications/review/my-app__1.0.0',
        applicationResource,
      },
    ],
  });

  test('builds the target URL from the edited _metadata.version', () => {
    const publication = buildPublication({
      name: 'my-app',
      _metadata: { version: '2.0.0', path: 'review/my-app__1.0.0' },
    });

    const { dto } = buildUpdatePlan(publication as never);

    expect(dto.resources[0].targetUrl).toBe('applications/public/folder/my-app__2.0.0');
  });

  test('falls back to the flat version when _metadata carries none', () => {
    const publication = buildPublication({ name: 'my-app', version: '3.0.0' });

    const { dto } = buildUpdatePlan(publication as never);

    expect(dto.resources[0].targetUrl).toBe('applications/public/folder/my-app__3.0.0');
  });

  test('queues the content PUT at the moved review path', () => {
    const publication = buildPublication({
      name: 'my-app',
      _metadata: { version: '2.0.0', path: 'review/my-app__1.0.0', folderId: 'review/' },
    });

    const { resourcePuts } = buildUpdatePlan(publication as never);

    expect(resourcePuts[0].asset).toEqual({
      name: 'my-app',
      display_version: '2.0.0',
      _metadata: { version: '2.0.0', path: 'review/my-app__2.0.0', folderId: 'review/' },
    });
  });

  test('synchronizes display version even when there is no review path', () => {
    const asset = { name: 'my-app', version: '3.0.0' };

    const { resourcePuts } = buildUpdatePlan(buildPublication(asset) as never);

    expect(resourcePuts[0].asset).toEqual({ ...asset, display_version: '3.0.0' });
    expect(asset).toEqual({ name: 'my-app', version: '3.0.0' });
  });

  test.each([
    ['applicationResources', 'applicationResource', 'applications'],
    ['toolSetResources', 'toolSetResource', 'toolsets'],
  ])('synchronizes unchanged text versions for %s and relocates review content', (resourceKey, assetKey, prefix) => {
    const asset = {
      name: 'my-asset',
      display_version: 'Spring release',
      _metadata: { version: 'release candidate', path: 'review/my-asset__stable' },
    };
    const publication = {
      path: 'public/req',
      requestName: 'req',
      folderId: 'public/folder',
      rules: [],
      [resourceKey]: [{ action: ActionType.ADD, sourceUrl: `${prefix}/source/my-asset__stable`, [assetKey]: asset }],
    };
    const { dto, resourcePuts } = buildUpdatePlan(publication as never);
    expect(dto.resources[0].targetUrl).toBe(`${prefix}/public/folder/my-asset__release%20candidate`);
    expect(resourcePuts[0].asset).toEqual({
      ...asset,
      display_version: 'release candidate',
      _metadata: { ...asset._metadata, path: 'review/my-asset__release candidate' },
    });
    expect(asset.display_version).toBe('Spring release');
  });

  test('keeps versionless prompt assets untouched and without a version suffix', () => {
    const asset = { name: 'my-prompt', path: 'review/my-prompt', _metadata: { version: '9.9.9', path: 'x/y' } };
    const publication = {
      path: 'public/req',
      requestName: 'req',
      folderId: 'public/folder',
      rules: [],
      prompts: [{ action: ActionType.ADD, sourceUrl: 'prompts/src/my-prompt', prompt: asset }],
    };

    const { dto, resourcePuts } = buildUpdatePlan(publication as never);

    expect(dto.resources[0].targetUrl).toBe('prompts/public/folder/my-prompt');
    expect(resourcePuts[0].asset).toBe(asset);
  });
});
