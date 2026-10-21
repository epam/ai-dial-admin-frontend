import { UserRole } from '@/src/models/user-info';

/**
 * Whether the caller holds full-admin rights. Shared by the client context and the server, so the two never
 * disagree about who a full admin is.
 *
 * Without the admin backend there is no FULL_ADMIN role to read, and with auth off nothing is enforced — so
 * both count as a full admin.
 */
export const resolveIsFullAdmin = (adminApiEnabled: boolean, isEnableAuth: boolean, roles?: UserRole[]): boolean =>
  !adminApiEnabled || !isEnableAuth || !!roles?.includes(UserRole.FULL_ADMIN);
