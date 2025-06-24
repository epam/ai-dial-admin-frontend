import { isWrongLength } from '@/src/components/EntityMainProperties/error-title';
import { MAX_NAME_SYMBOLS, MAX_RUNNER_ID_SYMBOLS } from '@/src/constants/validation';
import { DialAdapter } from '@/src/models/dial/adapter';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialBaseEntity, DialBaseNamedEntity } from '@/src/models/dial/base-entity';
import { DialKey } from '@/src/models/dial/key';
import { DialModel, DialModelEndpoint } from '@/src/models/dial/model';
import { DialRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { isValidEndpoint } from '@/src/utils/validation/is-valid-url';
import { getErrorForName } from '@/src/utils/validation/name-error';
import { isValidAllRoutePaths } from '@/src/utils/validation/path-error';

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
      const route = entity as DialRoute;
      return (
        isValidSimpleEntity &&
        !!route.paths?.length &&
        isValidAllRoutePaths(route.paths) &&
        isValidRouteStatus(route) &&
        isValidUpstreams(route.upstreams)
      );
    }

    return isValidSimpleEntity;
  }
  const baseEntity = entity as DialBaseEntity;
  const isValidNames = !!baseEntity.displayName && !!baseEntity.name && !getErrorForName(baseEntity.name, names);

  if (view === ApplicationRoute.Applications) {
    return (
      isValidApplication(entity, isValidNames) &&
      !isWrongLength(view, (entity as DialApplication).displayName) &&
      !isWrongLength(view, (entity as DialApplication).displayVersion)
    );
  }

  if (view === ApplicationRoute.Assistants) {
    return isValidNames && !getErrorForDescription(entity.description);
  }

  const isWrongLengthForModel =
    isWrongLength(view, (entity as DialModel).displayName) || isWrongLength(view, (entity as DialModel).displayVersion);

  const baseEntityValidation = isValidNames && !getErrorForDescription(entity.description) && !isWrongLengthForModel;

  if (view === ApplicationRoute.Models) {
    return baseEntityValidation && !!baseEntity.adapter && isValidUpstreams((entity as DialModel).upstreams);
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

const isValidApplication = (entity: DialApplication, isValidNames: boolean) => {
  const endpoint = (entity as DialApplication).customAppSchemaId != null ? true : !!entity.endpoint;
  return isValidNames && endpoint && !getErrorForDescription(entity.description);
};

export const isValidKey = (entity: DialKey, names?: string[]) => {
  return (
    !!(entity.key && entity.project) &&
    !getErrorForName(entity.name, names) &&
    !getErrorForDescription(entity.description) &&
    !(entity.key.length > MAX_NAME_SYMBOLS)
  );
};

export const isValidAdapter = (entity: DialAdapter, names?: string[]) => {
  return (
    !!(entity.name && entity.baseEndpoint) &&
    !getErrorForName(entity.name, names) &&
    !getErrorForName(entity.displayName) &&
    !getErrorForDescription(entity.description)
  );
};

const isValidRouteStatus = (route: DialRoute): boolean => {
  if (route.response) {
    const status = route.response?.status;
    return !!status && +status >= 100 && +status <= 999;
  }

  return true;
};

const isValidUpstreams = (upstreams?: DialModelEndpoint[]): boolean => {
  if (upstreams) {
    return upstreams.every((upstream) => {
      if (upstream.endpoint === '' || !upstream.endpoint) {
        return true;
      }
      return isValidEndpoint(upstream.endpoint);
    });
  }
  return true;
};
