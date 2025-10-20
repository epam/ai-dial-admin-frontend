import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { prepareEntityForDuplicate } from '../utils';

describe('Utils :: prepareEntityForDuplicate', () => {
  const entity = {
    name: 'n',
    description: 'd',
    version: 'v',
    entities: ['entities'],
    roles: ['roles'],
  };

  test('Should return filtered role', async () => {
    const result = await prepareEntityForDuplicate(
      ApplicationRoute.Roles,
      {
        name: 'n',
        description: 'd',
        grantedKeys: ['key'],
        share: { a: {} },
        limits: { a: {} },
      },
      {} as any,
    );
    expect(result).toEqual({
      name: 'n',
      description: 'd',
      grantedKeys: [],
      limits: {},
      share: {},
    });
  });

  test('Should return filtered interceptor', async () => {
    const result = await prepareEntityForDuplicate(ApplicationRoute.Interceptors, entity, {} as any);
    expect(result).toEqual({
      name: 'n',
      description: 'd',
      version: 'v',
      entities: [],
      roles: ['roles'],
    });
  });

  test('Should return filtered keys', async () => {
    const result = await prepareEntityForDuplicate(ApplicationRoute.Keys, entity, {} as any);
    expect(result).toEqual({
      name: 'n',
      description: 'd',
      version: 'v',
      entities: ['entities'],
      roles: [],
    });
  });

  test('Should return original entity', async () => {
    const result = await prepareEntityForDuplicate(ApplicationRoute.Models, entity, {} as any);
    expect(result).toEqual(entity);
  });

  test('Should return original entity for Prompts', async () => {
    const result1 = await prepareEntityForDuplicate(ApplicationRoute.Prompts, entity, {
      current: {
        folderId: 'aaa',
        name: 'prompt',
        version: '1.0.0',
      },
    } as any);
    expect(result1).toEqual({ ...entity, description: void 0, content: void 0 });
  });
});
