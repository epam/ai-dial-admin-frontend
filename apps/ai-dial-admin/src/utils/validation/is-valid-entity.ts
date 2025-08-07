import { MAX_RUNNER_ID_SYMBOLS } from '@/src/constants/validation';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity, DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialKey } from '@/src/models/dial/key';
import { DialModel } from '@/src/models/dial/model';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { isValidAdapter } from '@/src/utils/validation/is-valid-adapter';
import { isValidKey } from '@/src/utils/validation/is-valid-key';
import { isValidModel } from '@/src/utils/validation/is-valid-model';
import { getErrorForName, isWrongLengthWithView } from '@/src/utils/validation/name-error';
import { isValidRoute } from '@/src/utils/validation/is-valid-route';

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

    if (view === ApplicationRoute.Keys) {
      return isValidKey(entity as DialKey, names);
    }

    if (view === ApplicationRoute.ApplicationRunners) {
      const id = (entity as DialApplicationScheme).$id;
      return !!id && id.length <= MAX_RUNNER_ID_SYMBOLS && !getErrorForDescription(entity.description);
    }

    const isValidSimpleEntity = getIsValidSimpleEntity(entity, withVersion, names);

    if (view === ApplicationRoute.Routes) {
      return isValidRoute(entity as DialRoute, isValidSimpleEntity);
    }

    if (view === ApplicationRoute.Interceptors) {
      return isValidSimpleEntity && !!entity.endpoint;
    }

    return isValidSimpleEntity;
  }

  const baseEntity = entity as DialBaseEntity;
  const isValidNames = !!baseEntity.displayName && !!baseEntity.name && !getErrorForName(baseEntity.name, names);
  const isWrongLengthForModel =
    isWrongLengthWithView(view, baseEntity.displayName) || isWrongLengthWithView(view, baseEntity.displayVersion);

  const baseEntityValidation = isValidNames && !getErrorForDescription(entity.description) && !isWrongLengthForModel;

  if (view === ApplicationRoute.Applications) {
    return baseEntityValidation && isValidApplication(entity);
  }

  if (view === ApplicationRoute.Models) {
    return baseEntityValidation && isValidModel(entity as DialModel);
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

const isValidApplication = (entity: DialApplication) => {
  return (entity as DialApplication).customAppSchemaId != null ? true : !!entity.endpoint;
};
