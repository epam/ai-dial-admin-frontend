import { DialBaseEntity, DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { isValidRoute } from '@/src/utils/validation/is-valid-route';
import { getErrorForName } from '@/src/utils/validation/name-error';

export const isValidEntity = (
  view: ApplicationRoute,
  entity: DialBaseEntity | DialBaseNamedEntity,
  withVersion?: boolean,
  names?: string[],
) => {
  // TODO: remove after clear all entity validation
  if (
    view === ApplicationRoute.Keys ||
    view === ApplicationRoute.Roles ||
    view === ApplicationRoute.InterceptorTemplates ||
    view === ApplicationRoute.Interceptors ||
    view === ApplicationRoute.ApplicationRunners ||
    view === ApplicationRoute.Adapters
  ) {
    return true;
  }

  const isValidSimpleEntity = getIsValidSimpleEntity(entity, withVersion, names);

  if (view === ApplicationRoute.Routes) {
    return isValidRoute(entity as DialRoute, isValidSimpleEntity);
  }

  return isValidSimpleEntity;
};

const getIsValidSimpleEntity = (entity: DialBaseNamedEntity, withVersion?: boolean, names?: string[]) => {
  return (
    !!entity.name &&
    !!(withVersion ? entity.version : true) &&
    !getErrorForName(entity.name, names) &&
    !getErrorForDescription(entity.description)
  );
};
