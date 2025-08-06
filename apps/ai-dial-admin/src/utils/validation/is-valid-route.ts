import { DialRoute } from '@/src/models/dial/route';
import { isValidUpstreams } from '@/src/utils/validation/is-valid-model';
import { isValidAllRoutePaths } from '@/src/utils/validation/path-error';

export const isValidRoute = (entity: DialRoute, isValidSimpleEntity: boolean) => {
  return (
    isValidSimpleEntity &&
    !!entity.paths?.length &&
    isValidAllRoutePaths(entity.paths) &&
    isValidRouteStatus(entity) &&
    isValidUpstreams(entity.upstreams)
  );
};

const isValidRouteStatus = (route: DialRoute): boolean => {
  if (route.response) {
    const status = route.response?.status;
    return !!status && +status >= 100 && +status <= 999;
  }

  return true;
};
