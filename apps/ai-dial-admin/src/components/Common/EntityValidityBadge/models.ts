import { CoreResourceValidity } from '@/src/models/dial/resource';
import { ValidityState } from '@/src/models/dial/base-entity';
import { ValidationWarning } from '@/src/models/evaluation/test-suite';

/** The validity fields an entity may carry, whichever service reports them. */
export interface EntityValidityInput {
  _metadata?: CoreResourceValidity;
  validityState?: ValidityState;
  valid?: boolean;
  validationWarnings?: ValidationWarning[];
}

export interface EntityValidity {
  isValid: boolean;
  hint?: string;
}
