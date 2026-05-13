import { EntityViewTab } from '@/src/utils/tabs/utils';

const STORAGE_KEY_PREFIX = 'audit-tab-return:';

interface AuditTabReturnState {
  mainTab: EntityViewTab;
  auditTab: EntityViewTab;
}

export const saveAuditTabReturn = (entityPath: string): void => {
  if (typeof window === 'undefined') return;
  const state: AuditTabReturnState = {
    mainTab: EntityViewTab.Audit,
    auditTab: EntityViewTab.Activities,
  };
  sessionStorage.setItem(STORAGE_KEY_PREFIX + entityPath, JSON.stringify(state));
};

export const readAndClearAuditTabReturn = (entityPath: string): AuditTabReturnState | null => {
  if (typeof window === 'undefined') return null;
  const key = STORAGE_KEY_PREFIX + entityPath;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  sessionStorage.removeItem(key);
  try {
    return JSON.parse(raw) as AuditTabReturnState;
  } catch {
    return null;
  }
};
