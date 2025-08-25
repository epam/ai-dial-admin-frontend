import { DialRoute } from '@/src/models/dial/route';
import { isValidAllRoutePaths } from '@/src/utils/validation/path-error';

export const isValidRoute = (entity: DialRoute, isValidSimpleEntity: boolean) => {
  return (
    isValidSimpleEntity && !!entity.paths?.length && isValidAllRoutePaths(entity.paths) && isValidRouteStatus(entity)
  );
};

const isValidRouteStatus = (route: DialRoute): boolean => {
  if (route.response) {
    const status = route.response?.status;
    return !!status && +status >= 100 && +status <= 999;
  }

  return true;
};
