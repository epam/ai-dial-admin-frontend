import { EntityRoleLimits } from '@/src/models/dial/base-entity';

export const DEFAULT_ROLE_LIMITS: Partial<EntityRoleLimits> = {
  defaultRoleLimit: { day: null, minute: null, month: null, week: null },
};

export const NO_LIMITS_KEY = 'Not specified';
export const UNLIMITED_KEY = 'Unlimited';
// max values for BE
export const UNLIMITED_VALUE = '9223372036854775807';
export const UNLIMITED_ACCEPTED_USERS = '2147483647';
