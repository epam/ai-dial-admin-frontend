import { DialBaseEntity } from '@/src/models/dial/base-entity';

export const DEFAULT_ROLE_LIMITS: Partial<DialBaseEntity> = {
  defaultRoleLimit: { day: null, minute: null, month: null, week: null },
};

export const NO_LIMITS_KEY = 'No Limits';
