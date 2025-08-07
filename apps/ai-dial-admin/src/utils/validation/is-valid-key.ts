import { MAX_NAME_SYMBOLS } from '@/src/constants/validation';
import { DialKey } from '@/src/models/dial/key';
import { getErrorForDescription } from '@/src/utils/validation/description-error';
import { getErrorForName } from '@/src/utils/validation/name-error';

export const isValidKey = (entity: DialKey, names?: string[]) => {
  return (
    !!(entity.key && entity.project) &&
    !getErrorForName(entity.name, names) &&
    !getErrorForDescription(entity.description) &&
    !(entity.key.length > MAX_NAME_SYMBOLS)
  );
};
