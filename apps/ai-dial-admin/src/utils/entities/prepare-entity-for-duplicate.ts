import { ApplicationRoute } from '@/src/types/routes';
import { DialRole } from '@/src/models/dial/role';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialKey } from '@/src/models/dial/key';

export const prepareEntityForDuplicate = (route: ApplicationRoute, entity: unknown) => {
  if (route === ApplicationRoute.Roles) {
    return {
      name: (entity as DialRole).name,
      description: (entity as DialRole).description,
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
      ...(entity as DialKey),
      roles: [],
    };
  }

  return entity;
};
