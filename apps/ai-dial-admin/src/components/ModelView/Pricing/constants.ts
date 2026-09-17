import { PricingOperator } from '@/src/models/dial/model';

import { StandardUsageField } from './models';

// The usage fields DIAL Core resolves by bare name in a pricing condition (core's StandardField).
// isNumeric mirrors core's typing: ordering operators are valid only against numeric fields.
export const STANDARD_USAGE_FIELDS: StandardUsageField[] = [
  { field: 'cachedReadTokens', isNumeric: true },
  { field: 'cachedWriteTokens', isNumeric: true },
  { field: 'promptTokens', isNumeric: true },
  { field: 'serviceTier', isNumeric: false },
  { field: 'ttl', isNumeric: false },
];

export const ORDERING_OPERATORS: PricingOperator[] = [
  PricingOperator.GT,
  PricingOperator.LT,
  PricingOperator.GE,
  PricingOperator.LE,
];
