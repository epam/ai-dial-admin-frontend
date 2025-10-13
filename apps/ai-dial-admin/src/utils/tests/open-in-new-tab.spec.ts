import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { Container, DEPLOYMENT_ENTITY } from '@/src/models/deployments';

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
    const result = getEntityPath(ApplicationRoute.Prompts, data, true);
    expect(result).toEqual('path');
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
});
