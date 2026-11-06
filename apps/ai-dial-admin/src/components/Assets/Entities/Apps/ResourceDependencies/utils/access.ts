import { ResourceAccess } from '@/src/models/dial/resource-dependency';

// A fixed order keeps equal declarations serializing equally; Core's approval compares access in order.
const ACCESS_ORDER = [ResourceAccess.Read, ResourceAccess.Write];

export const sortAccess = (access: ResourceAccess[]): ResourceAccess[] =>
  ACCESS_ORDER.filter((right) => access.includes(right));

// Write implies Read: selecting it selects Read too, and Read stays locked while Write is on.
export const toggleAccess = (
  access: ResourceAccess[],
  right: ResourceAccess,
  isSelected: boolean,
): ResourceAccess[] => {
  if (!isSelected) {
    return sortAccess(access.filter((current) => current !== right));
  }
  const next = right === ResourceAccess.Write ? [...access, right, ResourceAccess.Read] : [...access, right];
  return sortAccess(next);
};

export const isReadLocked = (access: ResourceAccess[]): boolean => access.includes(ResourceAccess.Write);
