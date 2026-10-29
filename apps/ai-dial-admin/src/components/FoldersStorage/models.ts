import { OrgUnitSubject } from '@/src/models/dial/org-unit';

export enum RolesCardStatus {
  LOADING = 'loading',
  READY = 'ready',
  FORBIDDEN = 'forbidden',
  ERROR = 'error',
}

/** One holder in the roles draft: `id` is set for stored assignments only. */
export interface DraftHolder {
  key: string;
  roleName: string;
  subject: OrgUnitSubject;
  id?: string;
  isRemoved?: boolean;
}
