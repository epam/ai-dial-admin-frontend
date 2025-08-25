import { MAX_RUNNER_ID_SYMBOLS } from '@/src/constants/validation';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity, DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialModel } from '@/src/models/dial/model';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { isValidAdapter } from '@/src/utils/validation/is-valid-adapter';
import { isValidModel } from '@/src/utils/validation/is-valid-model';
import { isValidRoute } from '@/src/utils/validation/is-valid-route';
import { isWrongLengthWithView } from '@/src/utils/validation/name-error';
import { isValidApplication } from './is-valid-application';

export const isValidEntity = (
  view: ApplicationRoute,
  entity: DialBaseEntity | DialBaseNamedEntity,
  withVersion?: boolean,
  names?: string[],
) => {
  if (isSimpleEntity(view)) {
    if (view === ApplicationRoute.Adapters) {
      return isValidAdapter(entity as DialAdapter, names);
    }

    const isValidSimpleEntity = getIsValidSimpleEntity(entity, withVersion);

    if (view === ApplicationRoute.Routes) {
      return isValidRoute(entity as DialRoute, isValidSimpleEntity);
    }

    return isValidSimpleEntity;
  }

  const baseEntity = entity as DialBaseEntity;
  const isValidNames = !!baseEntity.displayName && !!baseEntity.name;
  const isWrongLength = isWrongLengthWithView(view, baseEntity.displayName);
  const baseEntityValidation = isValidNames && !isWrongLength;

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

const getIsValidSimpleEntity = (entity: DialBaseNamedEntity, withVersion?: boolean) => {
  return !!entity.name && !!(withVersion ? entity.version : true);
};
