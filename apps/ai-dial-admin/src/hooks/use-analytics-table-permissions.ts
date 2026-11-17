import { useAppContext } from '@/src/context/AppContext';
import { AnalyticsTable } from '@/src/models/analytics/table';

export interface AnalyticsTablePermissions {
  /** Create a source/enrichment table (FULL_ADMIN). */
  canCreate: boolean;
  /** Delete the table (FULL_ADMIN, never a system table). */
  canDelete: boolean;
  /** View and edit the table's access — the backend-reported `grant` capability, system tables included. */
  canManageRoles: boolean;
  /** Insert rows — the backend-reported per-table write capability. */
  canWrite: boolean;
  /** Change schema/description — the backend-reported per-table modify capability. */
  canModify: boolean;
  canChangeSensitive: boolean;
  isRowsRestricted: boolean;
  isColumnsRestricted: boolean;
}

// Derives the Tables UI decisions from the caller's application role (AppContext) and the table's
// backend-reported `permissions`. The per-table flags trust the backend (FULL_ADMIN bypass and
// system-table protection are already baked in there); when a table omits `permissions` they fall back
// to open only when auth is disabled, otherwise read-only. `rows_restricted` falls back to false: a
// caller is confined only when the service says so.
export const useAnalyticsTablePermissions = (table?: AnalyticsTable): AnalyticsTablePermissions => {
  const { isFullAdmin, isEnableAuth } = useAppContext();
  const canModify = table?.permissions?.modify ?? !isEnableAuth;

  return {
    canCreate: isFullAdmin,
    canDelete: isFullAdmin && !table?.system,
    canManageRoles: table?.permissions?.grant ?? !isEnableAuth,
    canWrite: table?.permissions?.write ?? !isEnableAuth,
    canModify,
    canChangeSensitive: canModify && (table?.permissions?.sensitive ?? !isEnableAuth),
    isRowsRestricted: table?.permissions?.rows_restricted ?? false,
    isColumnsRestricted: table?.permissions?.columns_restricted ?? false,
  };
};
