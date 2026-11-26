import { REPORTED_INTERFACE_TYPES, TRY_OUT_INTERFACES } from '@/src/components/TryOut/Deployment/constants';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

/**
 * The interfaces to offer for a deployment whose reported interfaces are `reported`. A list that could not be read
 * (`null` or `undefined`) offers every interface, since Core refuses whatever the deployment does not serve.
 */
export const getSupportedTryOutInterfaces = (reported?: string[] | null): DeploymentInterfaceType[] => {
  if (reported == null) {
    return [...TRY_OUT_INTERFACES];
  }
  const served = new Set(reported.map((name) => REPORTED_INTERFACE_TYPES[name]));

  return TRY_OUT_INTERFACES.filter((type) => served.has(type));
};
