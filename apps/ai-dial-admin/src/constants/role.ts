import { EntityRoleLimits } from '@/src/models/dial/base-entity';

export const DEFAULT_ROLE_LIMITS: Partial<EntityRoleLimits> = {
  defaultRoleLimit: { day: null, minute: null, month: null, week: null },
};

export const NO_LIMITS_KEY = 'No Limits';
