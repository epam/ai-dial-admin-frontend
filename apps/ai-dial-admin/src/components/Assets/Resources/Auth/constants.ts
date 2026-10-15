import { ToolsetAuthType } from '@/src/models/dial/resource';

// Mirrors Core's `ClientSecretValidation.MIN_LENGTH`; Core stays authoritative on write.
export const CLIENT_SECRET_MIN_LENGTH = 8;

export const NEVER_SELECTABLE_AUTH_TYPES: ToolsetAuthType[] = [ToolsetAuthType.DIAL_NATIVE];
