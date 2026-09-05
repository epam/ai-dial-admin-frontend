import { ApplicationRoute } from '@/src/types/routes';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  escapePercentSign,
  getEntityAuditFilterId,
  getEntityPath,
  getUrnForEntity,
  onOpenInNewTab,
} from '@/src/utils/open-in-new-tab';

describe('escapePercentSign', () => {
  test('escapes single percent sign', () => {
    expect(escapePercentSign('file%name')).toBe('file%25name');
  });

  test('escapes multiple percent signs', () => {
    expect(escapePercentSign('%file%name%')).toBe('%25file%25name%25');
  });

  test('does nothing when no percent sign is present', () => {
    expect(escapePercentSign('filename')).toBe('filename');
  });
});

describe('getUrnForEntity', () => {
  test('returns correct URN for Prompts', () => {
    const entity = { path: 'folder/PromptName__v1', name: 'PromptName', folderId: 'folder', version: 'v1' };
    const urn = getUrnForEntity(ApplicationRoute.Prompts, entity);
    const originalRoute = ApplicationRoute.Prompts.split('/')?.[1];
    expect(urn).toContain(`/${originalRoute}/`);
    expect(urn).toContain(encodeURIComponent('PromptName'));
  });

  test('returns the bare-name URN, with no ?path=, for a platform-bucket application', () => {
    const entity = { name: 'my-app', path: 'platform/my-app' };
    const urn = getUrnForEntity(ApplicationRoute.AssetsApplications, entity);

    expect(urn).toBe('/assets-applications/my-app');
    expect(urn).not.toContain('?path=');
  });

  test('returns the versioned ?path= URN, unchanged, for a public-bucket application', () => {
    const entity = { name: 'MyApp', path: 'public/MyApp__1.0', folderId: 'public/', version: '1.0' };
    const urn = getUrnForEntity(ApplicationRoute.AssetsApplications, entity);

    expect(urn).toBe(
      `/assets-applications/${encodeURIComponent('MyApp')}?path=${encodeURIComponent('public/MyApp__1.0')}`,
    );
  });

  test('returns the bare-name URN, with no ?path=, for a platform-bucket toolset', () => {
    const entity = { name: 'my-toolset', path: 'platform/my-toolset' };
    const urn = getUrnForEntity(ApplicationRoute.AssetsToolsets, entity);

    expect(urn).toBe('/assets-toolsets/my-toolset');
    expect(urn).not.toContain('?path=');
  });

  test('returns the versioned ?path= URN, unchanged, for a public-bucket toolset', () => {
    const entity = { name: 'MyToolset', path: 'public/MyToolset__1.0', folderId: 'public/', version: '1.0' };
    const urn = getUrnForEntity(ApplicationRoute.AssetsToolsets, entity);

    expect(urn).toBe(
      `/assets-toolsets/${encodeURIComponent('MyToolset')}?path=${encodeURIComponent('public/MyToolset__1.0')}`,
    );
  });

  test('returns correct URN for ActivityAudit', () => {
    const entity = { activityId: 'act123' };
    const urn = getUrnForEntity(ApplicationRoute.ActivityAudit, entity);
    const originalRoute = ApplicationRoute.ActivityAudit.split('/')?.[1];
    expect(urn).toBe(`/${originalRoute}/act123`);
  });

  test('returns correct URN for Images', () => {
    const entity = { id: 'modelId' };
    const urn = getUrnForEntity(ApplicationRoute.Images, entity);
    const originalRoute = ApplicationRoute.Images.split('/')?.[1];
    expect(urn).toBe(`/${originalRoute}/${encodeURIComponent('modelId')}`);
  });

  test('returns correct URN for TestSuites', () => {
    const entity = { id: 'test' };
    const urn = getUrnForEntity(ApplicationRoute.TestSuites, entity);
    const originalRoute = ApplicationRoute.TestSuites.split('/')?.[1];
    expect(urn).toBe(`/${originalRoute}/${encodeURIComponent('test')}`);
  });

  test('returns compare url for RunsCompare route', () => {
    const urn = getUrnForEntity(ApplicationRoute.RunsCompare, { id: 'run-123', compareWithId: 'run-456' });
    expect(urn).toBe('/runs/compare?runs=run-123,run-456');
  });

  test('returns correct URN for default case', () => {
    const entity = { name: 'DefaultName' };
    const urn = getUrnForEntity('OtherRoute' as any, entity);
    const originalRoute = 'OtherRoute'.split('/')?.[1];
    expect(urn).toBe(`/${originalRoute}/${encodeURIComponent('DefaultName')}`);
  });
});

describe('Entity list view :: getEntityPath', () => {
  const data = {
    key: 'key',
    name: 'name',
    $id: '$id',
    path: 'path',
    activityId: 'id',
  };

  test('Should return id field for ApplicationRunners', () => {
    const res1 = getEntityPath(ApplicationRoute.Models, data);
    expect(res1).toEqual('name');

    const res2 = getEntityPath(ApplicationRoute.Models, { data, name: undefined });
    expect(res2).toBe('');
  });

  test('Should return id field for ApplicationRunners', () => {
    const result = getEntityPath(ApplicationRoute.ApplicationRunners, data);
    expect(result).toEqual('%24id');
  });

  test('Should return name and path field for Prompts', () => {
    const result = getEntityPath(ApplicationRoute.Prompts, data);
    expect(result).toEqual('name?path=path');
  });

  test('Should return path field for Prompts when remove passed', () => {
    expect(getEntityPath(ApplicationRoute.Prompts, data, true)).toEqual('path');
    expect(
      getEntityPath(ApplicationRoute.Prompts, { ...data, name: 'name', folderId: 'folder' }, true, '1.0.0'),
    ).toEqual('foldername__1.0.0');
    expect(getEntityPath(ApplicationRoute.Prompts, { ...data, path: void 0 }, true)).toBeUndefined;
  });

  test('Should return name field for prompt publication', () => {
    const result = getEntityPath(ApplicationRoute.PromptPublications, { ...data, requestName: 'requestName' }, true);
    expect(result).toEqual('requestName?path=path');
  });

  test('Should return name field for toolset publication', () => {
    const result = getEntityPath(ApplicationRoute.ToolsetPublications, { ...data, requestName: 'requestName' }, true);
    expect(result).toEqual('requestName?path=path');
  });

  test('Should return name field for McpContainers', () => {
    const result = getEntityPath(ApplicationRoute.McpContainers, { ...data, name: 'test-id' });
    expect(result).toEqual('test-id');
  });

  test('Should return name field for file publication', () => {
    const result = getEntityPath(ApplicationRoute.FilePublications, { ...data, requestName: 'requestName' }, true);
    expect(result).toEqual('requestName?path=path');
  });

  test('Should return id field for activity audit', () => {
    const result = getEntityPath(ApplicationRoute.ActivityAudit, data);
    expect(result).toEqual('id');
  });

  test('Should return id field for InterceptorContainers', () => {
    const res1 = getEntityPath(ApplicationRoute.InterceptorContainers, { data, name: 'id' }, void 0);
    expect(res1).toEqual('id');
  });
  test('Should return id field for Images', () => {
    const res1 = getEntityPath(ApplicationRoute.Images, { data, id: 'id' }, void 0);
    expect(res1).toEqual('id');
  });

  test('Should return name with id query param for Runs', () => {
    const res1 = getEntityPath(ApplicationRoute.Runs, { data, id: 'id', testRunName: 'run-name' }, void 0);
    expect(res1).toEqual('run-name?id=id');
  });

  test('Should return id only for Runs when forRemove is true', () => {
    const res = getEntityPath(ApplicationRoute.Runs, { data, id: 'id', testRunName: 'run-name' }, true);
    expect(res).toEqual('id');
  });

  test('Should fall back to id as name when testRunName is missing for Runs', () => {
    const res1 = getEntityPath(ApplicationRoute.Runs, { data, id: 'id' }, void 0);
    expect(res1).toEqual('id?id=id');
  });

  test('Should return compare query path for RunsCompare', () => {
    const res = getEntityPath(ApplicationRoute.RunsCompare, { id: 'run-123', compareWithId: 'run-456' }, void 0);
    expect(res).toEqual('compare?runs=run-123,run-456');
  });

  test('Should return encoded name for PlatformModels (no ?path= appended)', () => {
    const result = getEntityPath(ApplicationRoute.PlatformModels, { name: 'example-from-admin' });
    expect(result).toEqual('example-from-admin');
  });

  test('Should return encoded name for PlatformModels and ignore any path field', () => {
    const result = getEntityPath(ApplicationRoute.PlatformModels, {
      name: 'example-from-admin',
      path: 'platform/example-from-admin',
    });
    expect(result).toEqual('example-from-admin');
  });

  test('Should return decoded name for PlatformModels when forRemove is true', () => {
    const result = getEntityPath(
      ApplicationRoute.PlatformModels,
      { name: 'example-from-admin', path: 'platform/example-from-admin' },
      true,
    );
    expect(result).toEqual('example-from-admin');
  });

  test('Should return decoded name for PlatformModels when forRemove is true and no path is present', () => {
    const result = getEntityPath(ApplicationRoute.PlatformModels, { name: 'example-from-admin' }, true);
    expect(result).toEqual('example-from-admin');
  });

  test('Should return double-encoded name for PlatformAppRunners when name is a URL-encoded $id', () => {
    // name = encodeURIComponent($id); getEntityPath encodes once more so the URL segment is safe.
    // page.tsx uses params.id directly (Next's one automatic decode restores the singly-encoded name).
    const result = getEntityPath(ApplicationRoute.PlatformAppRunners, { name: 'http%3A%2F%2Frunner' });
    expect(result).toEqual('http%253A%252F%252Frunner');
  });

  test('Should singly-encode $id fallback for PlatformAppRunners when no name is present', () => {
    // No pre-encoding: this goes through the same single final encodeURIComponent as the `name`
    // branch, so it matches the URL row-click navigation would produce for the same runner.
    const result = getEntityPath(ApplicationRoute.PlatformAppRunners, { $id: 'http://runner' });
    expect(result).toEqual('http%3A%2F%2Frunner');
  });

  test('Should produce the same URL segment from $id as row-click navigation does from name', () => {
    const fromId = getEntityPath(ApplicationRoute.PlatformAppRunners, { $id: 'http://runner' });
    const fromRowClickName = getEntityPath(ApplicationRoute.PlatformAppRunners, { name: 'http://runner' });
    expect(fromId).toEqual(fromRowClickName);
  });

  test('Should return singly-encoded Core path for PlatformAppRunners when forRemove is true', () => {
    const result = getEntityPath(ApplicationRoute.PlatformAppRunners, { name: 'http%3A%2F%2Frunner' }, true);
    expect(result).toEqual('http%3A%2F%2Frunner');
  });

  test('Should return encoded name for PlatformRoutes (no ?path= appended)', () => {
    const result = getEntityPath(ApplicationRoute.PlatformRoutes, { name: 'my-route' });
    expect(result).toEqual('my-route');
  });

  test('Should return encoded name for PlatformRoutes and ignore any path field', () => {
    const result = getEntityPath(ApplicationRoute.PlatformRoutes, {
      name: 'my-route',
      path: 'platform/my-route',
    });
    expect(result).toEqual('my-route');
  });

  // Regression: forRemove must still resolve to the resource's full storage path for a
  // platform-bucket application/toolset — Core has no route for the bare name alone, unlike the
  // URL-segment case (no forRemove) where the bucket prefix is deliberately dropped.
  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'Should return the platform-prefixed path for %s when forRemove is true',
    (route) => {
      const result = getEntityPath(route, { name: 'my-item', path: 'platform/my-item' }, true);
      expect(result).toEqual('platform/my-item');
    },
  );

  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'Should fall back to a built platform path for %s when forRemove is true and no path field is present',
    (route) => {
      const result = getEntityPath(route, { name: 'my-item', folderId: 'platform/' }, true);
      expect(result).toEqual('platform/my-item');
    },
  );

  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'Should return the bare encoded name for %s (no ?path=) when forRemove is false',
    (route) => {
      const result = getEntityPath(route, { name: 'my-item', path: 'platform/my-item' });
      expect(result).toEqual('my-item');
    },
  );

  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'Should keep the versioned ?path= for %s when forRemove is true on a public-bucket entity',
    (route) => {
      const entity = { name: 'MyEntity', path: 'public/MyEntity__1.0', folderId: 'public/', version: '1.0' };
      const result = getEntityPath(route, entity, true);
      expect(result).toEqual('public/MyEntity__1.0');
    },
  );
});

describe('onOpenInNewTab', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('calls window.open with correct url and _blank', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const route = 'route';
    const entity = { name: 'entity' };
    onOpenInNewTab(route as any, entity);
    expect(windowOpenSpy).toHaveBeenCalledWith(expect.stringContaining('/entity'), '_blank');
  });

  test('calls window.open with correct url for undefined route', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    onOpenInNewTab(undefined, { name: 'entity' });
    expect(windowOpenSpy).toHaveBeenCalledWith(expect.stringContaining('/entity'), '_blank');
  });

  test('calls window.open with compare url for RunsCompare route', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    onOpenInNewTab(ApplicationRoute.RunsCompare, { id: 'run-123', compareWithId: 'run-456' });
    expect(windowOpenSpy).toHaveBeenCalledWith('/runs/compare?runs=run-123,run-456', '_blank');
  });
});

describe('getEntityAuditFilterId', () => {
  test('prefers $id (DialApplicationScheme) over id and name', () => {
    expect(getEntityAuditFilterId({ $id: 'scheme-id', id: 'plain-id', name: 'fallback' } as never)).toBe('scheme-id');
  });

  test('falls back to id when $id is absent (Image-style entities)', () => {
    expect(getEntityAuditFilterId({ id: 'image-id', name: 'image-name' } as never)).toBe('image-id');
  });

  test('falls back to name when neither $id nor id is present (Container / BaseEntity)', () => {
    expect(getEntityAuditFilterId({ name: 'container-name' } as never)).toBe('container-name');
  });

  test('returns undefined when entity is undefined', () => {
    expect(getEntityAuditFilterId(undefined)).toBeUndefined();
  });

  test('returns undefined when entity is empty', () => {
    expect(getEntityAuditFilterId({})).toBeUndefined();
  });
});
