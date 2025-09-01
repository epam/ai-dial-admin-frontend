import { ApplicationRoute } from '@/src/types/routes';
import { BaseEntity } from '@/src/models/dial/base-entity';

export const prepareEntityForDuplicate = (route: ApplicationRoute, entity: BaseEntity) => {
  if (route === ApplicationRoute.Roles) {
    return {
      name: entity.name,
      description: entity.description,
    };
  }

  if (route === ApplicationRoute.Interceptors) {
    return {
      ...entity,
      entities: [],
    };
  }

  if (route === ApplicationRoute.Keys) {
    return {
      ...entity,
      roles: [],
    };
  }

  return entity;
};
