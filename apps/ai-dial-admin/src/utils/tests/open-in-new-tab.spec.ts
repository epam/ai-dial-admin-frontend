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
    const urn = getUrnForEntity(ApplicationRoute.RunsCompare, { id: 'run-123' });
    expect(urn).toBe('/runs/compare?runs=run-123');
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

  test('Should return id field for Images', () => {
    const res1 = getEntityPath(ApplicationRoute.Runs, { data, id: 'id' }, void 0);
    expect(res1).toEqual('id');
  });

  test('Should return compare query path for RunsCompare', () => {
    const res = getEntityPath(ApplicationRoute.RunsCompare, { id: 'run-123' }, void 0);
    expect(res).toEqual('compare?runs=run-123');
  });
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
    onOpenInNewTab(ApplicationRoute.RunsCompare, { id: 'run-123' });
    expect(windowOpenSpy).toHaveBeenCalledWith('/runs/compare?runs=run-123', '_blank');
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
