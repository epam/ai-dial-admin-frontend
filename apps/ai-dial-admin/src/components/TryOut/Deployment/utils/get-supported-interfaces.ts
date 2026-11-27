import { REPORTED_INTERFACE_TYPES, TRY_OUT_INTERFACES } from '@/src/components/TryOut/Deployment/constants';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';

/** The interfaces to offer for a deployment whose reported interfaces are `reported`, in the order they are offered. */
export const getSupportedTryOutInterfaces = (reported: string[]): DeploymentInterfaceType[] => {
  const served = new Set(reported.map((name) => REPORTED_INTERFACE_TYPES[name]));

  return TRY_OUT_INTERFACES.filter((type) => served.has(type));
};
