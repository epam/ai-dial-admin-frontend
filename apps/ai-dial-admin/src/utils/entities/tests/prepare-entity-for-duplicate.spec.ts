import { prepareEntityForDuplicate } from '../prepare-entity-for-duplicate';
import { ApplicationRoute } from '@/src/types/routes';

describe('Utils :: prepareEntityForDuplicate', () => {
  const entity = {
    name: 'n',
    description: 'd',
    version: 'v',
    entities: ['entities'],
    roles: ['roles'],
  };
  it('Should return filtered role', () => {
    const result = prepareEntityForDuplicate(ApplicationRoute.Roles, entity);
    expect(result).toEqual({
      name: 'n',
      description: 'd',
    });
  });

  it('Should return filtered interceptor', () => {
    const result = prepareEntityForDuplicate(ApplicationRoute.Interceptors, entity);
    expect(result).toEqual({
      name: 'n',
      description: 'd',
      version: 'v',
      entities: [],
      roles: ['roles'],
    });
  });

  it('Should return filtered keys', () => {
    const result = prepareEntityForDuplicate(ApplicationRoute.Keys, entity);
    expect(result).toEqual({
      name: 'n',
      description: 'd',
      version: 'v',
      entities: ['entities'],
      roles: [],
    });
  });

  it('Should return same entity', () => {
    const result = prepareEntityForDuplicate(ApplicationRoute.Addon, entity);
    expect(result).toEqual({
      name: 'n',
      description: 'd',
      version: 'v',
      entities: ['entities'],
      roles: ['roles'],
    });
  });
});
