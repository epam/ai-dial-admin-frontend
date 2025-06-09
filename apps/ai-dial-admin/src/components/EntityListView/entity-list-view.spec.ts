import { getEntityPath, formatAttachment } from './entity-list-view';
import { ApplicationRoute } from '@/src/types/routes';

describe('Entity list view :: getEntityPath', () => {
  const data = {
    key: 'key',
    name: 'name',
    $id: '$id',
    path: 'path',
    activityId: 'id',
  };

  it('Should return id field for ApplicationRunners', () => {
    const result = getEntityPath(ApplicationRoute.ApplicationRunners, data);
    expect(result).toEqual('%24id');
  });

  it('Should return name and path field for Prompts', () => {
    const result = getEntityPath(ApplicationRoute.Prompts, data);
    expect(result).toEqual('name?path=path');
  });

  it('Should return path field for Prompts when remove passed', () => {
    const result = getEntityPath(ApplicationRoute.Prompts, data, true);
    expect(result).toEqual('path');
  });

  it('Should return name field for other entities', () => {
    const result = getEntityPath(ApplicationRoute.Addon, data, true);
    expect(result).toEqual('name');
  });

  it('Should return name field for prompt publication', () => {
    const result = getEntityPath(ApplicationRoute.PromptPublications, { ...data, requestName: 'requestName' }, true);
    expect(result).toEqual('requestName?path=path');
  });

  it('Should return name field for file publication', () => {
    const result = getEntityPath(ApplicationRoute.FilePublications, { ...data, requestName: 'requestName' }, true);
    expect(result).toEqual('requestName?path=path');
  });

  it('Should return id field for activity audit', () => {
    const result = getEntityPath(ApplicationRoute.ActivityAudit, data);
    expect(result).toEqual('id');
  });
});

describe('Entity list view :: formatAttachment ', () => {
  it('Should return custom', () => {
    const result = formatAttachment('custom', (v: string) => v);
    expect(result).toEqual('custom');
  });

  it('Should return custom', () => {
    const result = formatAttachment(['*/*'] as any, (v: string) => v);
    expect(result).toEqual('Attachments.AllAttachments');
  });
});
