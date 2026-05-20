import { AUDIT_LIST_PRESELECT_STORAGE_KEY } from '@/src/constants/audit-list-preselect';
import { AuditListPreselect } from '@/src/types/audit-list-preselect';

const VALID_VALUES: ReadonlySet<string> = new Set(Object.values(AuditListPreselect));

const isAuditListPreselect = (value: string): value is AuditListPreselect => VALID_VALUES.has(value);

export const saveAuditListPreselect = (value: AuditListPreselect): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUDIT_LIST_PRESELECT_STORAGE_KEY, value);
};

export const readAuditListPreselect = (): AuditListPreselect | null => {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(AUDIT_LIST_PRESELECT_STORAGE_KEY);
  if (raw == null) return null;
  return isAuditListPreselect(raw) ? raw : null;
};

export const clearAuditListPreselect = (): void => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUDIT_LIST_PRESELECT_STORAGE_KEY);
};
