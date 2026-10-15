import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { formatTestSuiteWarnings, formatValidationWarnings } from '@/src/utils/entities/validation-warnings';
import { EntityValidity, EntityValidityInput } from './models';

const invalid = (hint: string): EntityValidity => ({ isValid: false, hint: hint || undefined });

export const getEntityValidity = (entity: EntityValidityInput | undefined): EntityValidity | null => {
  const coreStatus = entity?._metadata?.status;

  if (coreStatus === DialModelResourceStatus.Valid) {
    return { isValid: true };
  }

  if (coreStatus === DialModelResourceStatus.Invalid) {
    return invalid(formatValidationWarnings(entity?._metadata?.validationWarnings));
  }

  if (entity?.validityState != null) {
    return entity.validityState.valid ? { isValid: true } : invalid(entity.validityState.message);
  }

  if (entity?.valid != null) {
    return entity.valid ? { isValid: true } : invalid(formatTestSuiteWarnings(entity.validationWarnings));
  }

  return null;
};
