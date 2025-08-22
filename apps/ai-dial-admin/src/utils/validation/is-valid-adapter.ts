import { DialAdapter } from '@/src/models/dial/adapter';
import { getErrorForName } from '@/src/utils/validation/name-error';

export const isValidAdapter = (entity: DialAdapter, names?: string[]) => {
  return (
    !!entity.name &&
    !getErrorForName(entity.name, names) &&
    !getErrorForName(entity.displayName, void 0, void 0, false, false)
  );
};
