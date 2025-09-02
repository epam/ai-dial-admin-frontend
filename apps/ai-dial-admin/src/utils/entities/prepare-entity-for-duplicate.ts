import { ApplicationRoute } from '@/src/types/routes';
import { DialInterceptor } from '@/src/models/dial/interceptor';
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
      ...(entity as DialInterceptor),
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
