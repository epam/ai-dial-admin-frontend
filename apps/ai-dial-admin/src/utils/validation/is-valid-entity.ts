import { DialBaseEntity, DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialModel } from '@/src/models/dial/model';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { isValidModel } from '@/src/utils/validation/is-valid-model';
import { isValidRoute } from '@/src/utils/validation/is-valid-route';
import { getErrorForName, isWrongLengthWithView } from '@/src/utils/validation/name-error';
import { isValidApplication } from './is-valid-application';

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

  if (isSimpleEntity(view)) {
    const isValidSimpleEntity = getIsValidSimpleEntity(entity, withVersion, names);

    if (view === ApplicationRoute.Routes) {
      return isValidRoute(entity as DialRoute, isValidSimpleEntity);
    }

    return isValidSimpleEntity;
  }

  const baseEntity = entity as DialBaseEntity;
  const isValidNames = !!baseEntity.displayName && !!baseEntity.name && !getErrorForName(baseEntity.name, names);
  const isWrongLength = isWrongLengthWithView(view, baseEntity.displayName);
  const baseEntityValidation = isValidNames && !getErrorForDescription(entity.description) && !isWrongLength;

  if (view === ApplicationRoute.Applications) {
    return baseEntityValidation && isValidApplication(entity);
  }

  if (view === ApplicationRoute.Models) {
    return (
      (baseEntityValidation && isValidModel(entity as DialModel)) ||
      (!!(entity as DialModel).displayVersion && isWrongLengthWithView(view, (entity as DialModel).displayVersion))
    );
  }

  return baseEntityValidation && !!baseEntity.endpoint;
};

const getIsValidSimpleEntity = (entity: DialBaseNamedEntity, withVersion?: boolean, names?: string[]) => {
  return (
    !!entity.name &&
    !!(withVersion ? entity.version : true) &&
    !getErrorForName(entity.name, names) &&
    !getErrorForDescription(entity.description)
  );
};
