import { ApplicationRoute } from '@/src/types/routes';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getEntityPath, getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { DEPLOYMENT_ENTITY } from '@/src/models/deployments/deployments';

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

  test('returns correct URN for ModelDeployments with entityType', () => {
    const entity = { id: 'modelId' };
    const urn = getUrnForEntity(ApplicationRoute.ModelDeployments, entity, DEPLOYMENT_ENTITY.images);
    const originalRoute = ApplicationRoute.ModelDeployments.split('/')?.[1];
    expect(urn).toBe(`/${originalRoute}/${encodeURIComponent('modelId')}?entityType=${DEPLOYMENT_ENTITY.images}`);
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

  test('Should return name field for file publication', () => {
    const result = getEntityPath(ApplicationRoute.FilePublications, { ...data, requestName: 'requestName' }, true);
    expect(result).toEqual('requestName?path=path');
  });

  test('Should return id field for activity audit', () => {
    const result = getEntityPath(ApplicationRoute.ActivityAudit, data);
    expect(result).toEqual('id');
  });

  test('Should return id field for InterceptorDeployments', () => {
    const res1 = getEntityPath(
      ApplicationRoute.InterceptorDeployments,
      { data, id: 'id' },
      void 0,
      DEPLOYMENT_ENTITY.images,
    );
    expect(res1).toEqual('id?entityType=images');
    const res2 = getEntityPath(ApplicationRoute.InterceptorDeployments, { data, id: 'id' }, void 0);
    expect(res2).toEqual('id?entityType=');
  });
  test('Should return id field for McpDeploymentsF', () => {
    const res1 = getEntityPath(ApplicationRoute.McpDeployments, { data, id: 'id' }, void 0, DEPLOYMENT_ENTITY.images);
    expect(res1).toEqual('id?entityType=images');
    const res2 = getEntityPath(ApplicationRoute.McpDeployments, { data, id: 'id' }, void 0);
    expect(res2).toEqual('id?entityType=');
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
});
