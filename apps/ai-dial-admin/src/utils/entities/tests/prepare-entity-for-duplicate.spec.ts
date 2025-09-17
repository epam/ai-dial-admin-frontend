import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { prepareEntityForDuplicate } from '../prepare-entity-for-duplicate';

describe('Utils :: prepareEntityForDuplicate', () => {
  const entity = {
    name: 'n',
    description: 'd',
    version: 'v',
    entities: ['entities'],
    roles: ['roles'],
  };

  test('Should return filtered role', () => {
    const result = prepareEntityForDuplicate(ApplicationRoute.Roles, entity);
    expect(result).toEqual({
      name: 'n',
      description: 'd',
    });
  });

  test('Should return filtered interceptor', () => {
    const result = prepareEntityForDuplicate(ApplicationRoute.Interceptors, entity);
    expect(result).toEqual({
      name: 'n',
      description: 'd',
      version: 'v',
      entities: [],
      roles: ['roles'],
    });
  });

  test('Should return filtered keys', () => {
    const result = prepareEntityForDuplicate(ApplicationRoute.Keys, entity);
    expect(result).toEqual({
      name: 'n',
      description: 'd',
      version: 'v',
      entities: ['entities'],
      roles: [],
    });
  });

  test('Should return original entity', () => {
    const result = prepareEntityForDuplicate(ApplicationRoute.Models, entity);
    expect(result).toEqual(entity);
  });

  test('Should return original entity', () => {
    const result1 = prepareEntityForDuplicate(ApplicationRoute.Prompts, entity);
    expect(result1).toEqual({ ...entity, description: void 0, content: void 0 });

    const result2 = prepareEntityForDuplicate(ApplicationRoute.Prompts, entity, {
      description: 'description',
      content: 'content',
    } as any);
    expect(result2).toEqual({ ...entity, description: 'description', content: 'content' });
  });
});
